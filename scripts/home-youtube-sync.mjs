#!/usr/bin/env node
/**
 * Run on your **home PC** (or any machine where YouTube transcripts work) on a schedule,
 * e.g. Windows Task Scheduler nightly:
 *   Program: node
 *   Args: C:\path\to\influencermarketsignals\scripts\home-youtube-sync.mjs
 *   Start in: C:\path\to\influencermarketsignals
 *
 * Env (in .env.local next to repo, or system env):
 *   YOUTUBE_API_KEY
 *   INGEST_WEBHOOK_URL   = https://YOUR-APP.vercel.app   (no trailing slash ok)
 *   INGEST_WEBHOOK_SECRET = same value as on Vercel (INGEST_WEBHOOK_SECRET)
 * Optional: HOME_SYNC_MAX_INGESTS (default 15), HOME_SYNC_PER_CHANNEL (default 25),
 *   CHANNEL_SYNC_MIN_DURATION_SECONDS (default 480 = 8 minutes)
 *
 * State file: scripts/.home-sync-state.json (gitignored)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined || process.env[k] === '') process.env[k] = v
  }
}

loadEnvLocal()

const YT_KEY = process.env.YOUTUBE_API_KEY
const WEBHOOK = process.env.INGEST_WEBHOOK_URL?.replace(/\/$/, '')
const WH_SECRET = process.env.INGEST_WEBHOOK_SECRET
const MAX_PER_RUN = Number(process.env.HOME_SYNC_MAX_INGESTS ?? 15)
const PER_CHANNEL = Number(process.env.HOME_SYNC_PER_CHANNEL ?? 25)
const MIN_DURATION_SEC = Number(process.env.CHANNEL_SYNC_MIN_DURATION_SECONDS ?? 480)

if (!YT_KEY || !WEBHOOK || !WH_SECRET) {
  console.error('Set YOUTUBE_API_KEY, INGEST_WEBHOOK_URL, and INGEST_WEBHOOK_SECRET')
  process.exit(1)
}

const statePath = path.join(__dirname, '.home-sync-state.json')

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'))
  } catch {
    return { lastRunIso: null, seenVideoIds: [] }
  }
}

function saveState(s) {
  const seen = (s.seenVideoIds || []).slice(-4000)
  fs.writeFileSync(statePath, JSON.stringify({ ...s, seenVideoIds: seen }, null, 2))
}

function publishedAfterFromState(state) {
  const now = Date.now()
  const rolling24hMs = now - 24 * 60 * 60 * 1000
  const rollingIso = new Date(rolling24hMs).toISOString()
  if (!state.lastRunIso) return rollingIso
  const lastMs = new Date(state.lastRunIso).getTime()
  if (!Number.isFinite(lastMs)) return rollingIso
  return new Date(Math.max(lastMs, rolling24hMs)).toISOString()
}

function parseIso8601DurationSeconds(iso) {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return 0
  const h = parseInt(m[1] || '0', 10)
  const min = parseInt(m[2] || '0', 10)
  const s = parseInt(m[3] || '0', 10)
  return h * 3600 + min * 60 + s
}

async function videoIdsMeetingMinDuration(ids) {
  const ok = new Set()
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'contentDetails')
    url.searchParams.set('id', chunk.join(','))
    url.searchParams.set('key', YT_KEY)
    const data = await fetch(url).then((r) => r.json())
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))
    for (const v of data.items || []) {
      const d = v.contentDetails?.duration
      if (!d) continue
      if (parseIso8601DurationSeconds(d) >= MIN_DURATION_SEC) ok.add(v.id)
    }
  }
  return ok
}

function loadChannels() {
  const csvPath = path.join(__dirname, '..', 'channels.csv')
  const csvEx = path.join(__dirname, '..', 'channels.example.csv')
  const csv = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : fs.readFileSync(csvEx, 'utf8')
  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  const h = lines[0].split(',').map((x) => x.trim().toLowerCase().replace(/^\ufeff/, ''))
  const ni = h.indexOf('name')
  const ci = h.indexOf('channel_id')
  if (ni === -1 || ci === -1) throw new Error('channels.csv needs name,channel_id header')
  const channels = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const channel_id = (cols[ci] || '').trim()
    if (channel_id) channels.push({ name: (cols[ni] || '').trim() || channel_id, channel_id })
  }
  return channels
}

async function searchChannel(cid, publishedAfterIso) {
  const base = 'https://www.googleapis.com/youtube/v3/search'
  const makeParams = (extra = {}) => {
    const p = new URLSearchParams({
      part: 'snippet',
      channelId: cid,
      order: 'date',
      maxResults: String(PER_CHANNEL),
      type: 'video',
      key: YT_KEY,
    })
    if (publishedAfterIso) p.set('publishedAfter', publishedAfterIso)
    for (const [k, v] of Object.entries(extra)) p.set(k, v)
    return p
  }
  const regular = await fetch(`${base}?${makeParams()}`).then((r) => r.json())
  if (regular.error) throw new Error(regular.error.message || JSON.stringify(regular.error))
  const live = await fetch(`${base}?${makeParams({ eventType: 'completed' })}`).then((r) => r.json())
  const items = [...(regular.items || []), ...(live.items || [])]
  const seen = new Set()
  const out = []
  for (const it of items) {
    const vid = it?.id?.videoId
    if (!vid || seen.has(vid)) continue
    seen.add(vid)
    const title = it.snippet?.title || ''
    const publishedAt = it.snippet?.publishedAt || ''
    out.push({ vid, title, publishedAt })
  }
  out.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
  return out.slice(0, PER_CHANNEL)
}

async function main() {
  const state = loadState()
  const publishedAfterIso = publishedAfterFromState(state)
  const publishedAfterMs = new Date(publishedAfterIso).getTime()
  const set = new Set(state.seenVideoIds || [])
  const channels = loadChannels()

  const { YoutubeTranscript } = await import('youtube-transcript')

  const candidates = []
  for (const ch of channels) {
    const items = await searchChannel(ch.channel_id, publishedAfterIso)
    for (const { vid, title, publishedAt } of items) {
      const t = (title || '').toLowerCase()
      if (t.includes('shorts') || /\bshort\b/.test(t)) continue
      const pa = publishedAt ? new Date(publishedAt).getTime() : 0
      if (!Number.isFinite(pa) || pa < publishedAfterMs) continue
      candidates.push({ vid })
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  const uniq = []
  const vseen = new Set()
  for (const c of candidates) {
    if (vseen.has(c.vid)) continue
    vseen.add(c.vid)
    uniq.push(c)
  }

  const durationOk = await videoIdsMeetingMinDuration(uniq.map((u) => u.vid))

  let ingested = 0
  for (const { vid } of uniq) {
    if (!durationOk.has(vid)) continue
    if (ingested >= MAX_PER_RUN) break
    if (set.has(vid)) continue

    let lines
    try {
      lines = await YoutubeTranscript.fetchTranscript(vid)
    } catch (e) {
      console.warn('transcript skip', vid, e?.message || e)
      continue
    }
    const text = lines.map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim()
    if (text.length < 40) continue

    const youtubeUrl = `https://www.youtube.com/watch?v=${vid}`
    const r = await fetch(`${WEBHOOK}/api/youtube/ingest-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WH_SECRET}`,
      },
      body: JSON.stringify({ youtubeUrl, transcript: text }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('webhook failed', vid, r.status, data)
      continue
    }
    if (data.skipped) {
      set.add(vid)
      continue
    }
    console.log('ingested', vid, data.contentId)
    set.add(vid)
    ingested++
  }

  state.seenVideoIds = [...set]
  state.lastRunIso = new Date().toISOString()
  saveState(state)
  console.log('done', { ingested, channels: channels.length, stateFile: statePath })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
