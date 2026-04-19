import { readFileSync } from 'fs'
import { join } from 'path'

/** Default 8 minutes; override with CHANNEL_SYNC_MIN_DURATION_SECONDS */
export function getMinVideoDurationSeconds(): number {
  const n = parseInt(process.env.CHANNEL_SYNC_MIN_DURATION_SECONDS || '480', 10)
  return Number.isFinite(n) && n > 0 ? n : 480
}

/**
 * YouTube `publishedAfter` lower bound: never earlier than rolling 24h, and never earlier than
 * last successful cron (`lastRunIso`) so each run only considers the window since last job
 * (capped at 24h if a run was missed for a long time).
 */
export function publishedAfterFromState(lastRunIso: string | null): string {
  const now = Date.now()
  const rolling24hMs = now - 24 * 60 * 60 * 1000
  const rollingIso = new Date(rolling24hMs).toISOString()
  if (!lastRunIso) return rollingIso
  const lastMs = new Date(lastRunIso).getTime()
  if (!Number.isFinite(lastMs)) return rollingIso
  return new Date(Math.max(lastMs, rolling24hMs)).toISOString()
}

export interface ChannelRow {
  name: string
  channel_id: string
}

export interface PolledVideo {
  video_id: string
  title: string | null
  published_at: string | null
  scraped_at?: string
  channel_id: string
  channel_title: string | null
  url: string
  duration: string
  duration_seconds: number
}

function isoNowUtc() {
  return new Date().toISOString()
}

export function parseChannelsCsv(text: string): ChannelRow[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((s) => s.trim().toLowerCase().replace(/^\ufeff/, ''))
  const nameIdx = header.indexOf('name')
  const idIdx = header.indexOf('channel_id')
  if (nameIdx === -1 || idIdx === -1) {
    throw new Error('channels.csv must include name and channel_id columns')
  }
  const out: ChannelRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const name = (cols[nameIdx] ?? '').trim()
    const channel_id = (cols[idIdx] ?? '').trim()
    if (!channel_id) continue
    out.push({ name: name || channel_id, channel_id })
  }
  return out
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && c === ',') {
      result.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  result.push(cur)
  return result
}

export function loadChannelsFromDisk(): ChannelRow[] {
  const root = process.cwd()
  const primary = join(root, 'channels.csv')
  const fallback = join(root, 'channels.example.csv')
  let raw: string
  try {
    raw = readFileSync(primary, 'utf-8')
  } catch {
    raw = readFileSync(fallback, 'utf-8')
  }
  return parseChannelsCsv(raw)
}

function parseIso8601Duration(iso: string): { total: number; display: string } {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return { total: 0, display: 'Unknown' }
  const hours = parseInt(m[1] || '0', 10)
  const minutes = parseInt(m[2] || '0', 10)
  const seconds = parseInt(m[3] || '0', 10)
  const total = hours * 3600 + minutes * 60 + seconds
  const display =
    hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
  return { total, display }
}

interface SearchItem {
  id: { videoId: string }
  snippet: {
    title?: string
    publishedAt?: string
    channelTitle?: string
  }
}

async function youtubeSearch(
  apiKey: string,
  params: Record<string, string | number | undefined>
): Promise<SearchItem[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    url.searchParams.set(k, String(v))
  }
  const r = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`YouTube search ${r.status}: ${t.slice(0, 200)}`)
  }
  const data = (await r.json()) as { items?: SearchItem[] }
  return data.items ?? []
}

async function youtubeVideosDetails(apiKey: string, videoIds: string[]) {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('key', apiKey)
  const r = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`YouTube videos ${r.status}: ${t.slice(0, 200)}`)
  }
  return (await r.json()) as {
    items?: { id: string; contentDetails: { duration: string } }[]
  }
}

export async function fetchLatestForChannel(
  channelId: string,
  apiKey: string,
  opts: { maxResults: number; publishedAfterIso: string }
): Promise<PolledVideo[]> {
  const { maxResults, publishedAfterIso } = opts

  const baseParams: Record<string, string | number | undefined> = {
    channelId,
    order: 'date',
    maxResults,
    type: 'video',
    publishedAfter: publishedAfterIso,
  }

  const regular = await youtubeSearch(apiKey, baseParams)
  let live: SearchItem[] = []
  try {
    live = await youtubeSearch(apiKey, { ...baseParams, eventType: 'completed' })
  } catch {
    // Some keys/projects error on completed live search; regular uploads still apply.
  }

  const seen = new Set<string>()
  const items: SearchItem[] = []
  for (const it of [...regular, ...live]) {
    const vid = it.id?.videoId
    if (!vid || seen.has(vid)) continue
    seen.add(vid)
    items.push(it)
  }

  items.sort((a, b) => (b.snippet.publishedAt || '').localeCompare(a.snippet.publishedAt || ''))
  const trimmed = items.slice(0, maxResults)
  if (!trimmed.length) return []

  const videoIds = trimmed.map((it) => it.id.videoId)
  const details = await youtubeVideosDetails(apiKey, videoIds)
  const lookup = new Map<string, { duration: string }>()
  for (const v of details.items ?? []) {
    lookup.set(v.id, v.contentDetails)
  }

  const out: PolledVideo[] = []
  for (const it of trimmed) {
    const vid = it.id.videoId
    const sn = it.snippet
    const title = (sn.title || '').toLowerCase()
    if (title.includes('shorts') || /\bshort\b/.test(title)) continue

    const cd = lookup.get(vid)
    if (!cd?.duration) continue

    const parsed = parseIso8601Duration(cd.duration)
    const totalSeconds = parsed.total
    const durationStr = parsed.display
    if (totalSeconds < getMinVideoDurationSeconds()) continue

    out.push({
      video_id: vid,
      title: sn.title ?? null,
      published_at: sn.publishedAt ?? null,
      scraped_at: isoNowUtc(),
      channel_id: channelId,
      channel_title: sn.channelTitle ?? null,
      url: `https://www.youtube.com/watch?v=${vid}`,
      duration: durationStr,
      duration_seconds: totalSeconds,
    })
  }
  return out
}
