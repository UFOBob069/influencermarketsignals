/**
 * Daily channel sync (Vercel Cron). Schedule in `vercel.json` is `0 4 * * *` (04:00 UTC),
 * which is 22:00 (10 PM) Central **standard** time (CST, UTC−6). During daylight time (CDT, UTC−5)
 * the same UTC moment is 23:00 (11 PM) Central — Vercel crons are UTC-only; adjust seasonally if needed.
 *
 * Env:
 * - YOUTUBE_API_KEY (or YOUTUBE_DATA_API_KEY): YouTube Data API v3
 * - FIREBASE_SERVICE_ACCOUNT_JSON: stringified service account (required; bypasses Firestore rules)
 * - CRON_SECRET: required in production; Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron
 * - NEXT_PUBLIC_BASE_URL or VERCEL_URL: base URL for calling `/api/process-content`
 * - CHANNEL_SYNC_MAX_PER_CHANNEL (default 25): max search results per channel per run
 * - CHANNEL_SYNC_MAX_INGESTS_PER_RUN (default 20)
 * - CHANNEL_SYNC_MIN_DURATION_SECONDS (default 480): minimum length (8 minutes)
 *
 * Time window: videos with publishedAt >= max(lastCron, now-24h). Duration & API filter applied in youtubeChannelPoll.
 *
 * Channel list: repo-root `channels.csv` (falls back to `channels.example.csv`).
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  contentExistsWithVideoId,
  getChannelSyncState,
  setChannelSyncState,
} from '@/lib/serverFirestoreContent'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import {
  fetchLatestForChannel,
  loadChannelsFromDisk,
  publishedAfterFromState,
} from '@/lib/youtubeChannelPoll'
import { ingestYoutubeWatchUrl } from '@/lib/youtubeIngestCore'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_VIDEOS_PER_CHANNEL = parseInt(process.env.CHANNEL_SYNC_MAX_PER_CHANNEL || '25', 10)
const MAX_INGESTS_PER_RUN = parseInt(process.env.CHANNEL_SYNC_MAX_INGESTS_PER_RUN || '20', 10)

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return process.env.NODE_ENV === 'development'
  }
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

function resolveBaseUrl(req: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  const host = req.headers.get('host')
  if (host?.includes('localhost')) return `http://${host}`
  if (host) return `https://${host}`
  return 'http://localhost:3000'
}

async function runSync(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Set YOUTUBE_API_KEY (or YOUTUBE_DATA_API_KEY) for channel sync.' },
      { status: 500 }
    )
  }

  if (!getAdminFirestore()) {
    return NextResponse.json(
      {
        error:
          'FIREBASE_SERVICE_ACCOUNT_JSON is required for automated ingest (Firestore writes from cron bypass user auth).',
      },
      { status: 500 }
    )
  }

  const channels = loadChannelsFromDisk()
  if (!channels.length) {
    return NextResponse.json({ error: 'No channels in channels.csv / channels.example.csv' }, { status: 400 })
  }

  const state = await getChannelSyncState()
  const publishedAfterIso = publishedAfterFromState(state.lastRunIso)
  const perChannel = MAX_VIDEOS_PER_CHANNEL
  const publishedAfterMs = new Date(publishedAfterIso).getTime()

  const baseUrl = resolveBaseUrl(req)

  type Cand = { url: string; name: string; title: string | null; published_at: string | null }
  const candidates: Cand[] = []
  const seen = new Set<string>()

  for (const row of channels) {
    const cid = row.channel_id.trim()
    try {
      const items = await fetchLatestForChannel(cid, apiKey, {
        maxResults: perChannel,
        publishedAfterIso,
      })
      for (const it of items) {
        if (seen.has(it.video_id)) continue
        const pa = it.published_at ? new Date(it.published_at).getTime() : 0
        if (!Number.isFinite(pa) || pa < publishedAfterMs) continue
        seen.add(it.video_id)
        candidates.push({
          url: it.url,
          name: row.name,
          title: it.title,
          published_at: it.published_at,
        })
      }
    } catch (e) {
      console.error(`channel sync error ${row.name}:`, e)
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  candidates.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))

  let ingested = 0
  const errors: string[] = []
  const skipped: string[] = []

  for (const c of candidates) {
    if (ingested >= MAX_INGESTS_PER_RUN) {
      skipped.push(`cap:${c.url}`)
      continue
    }
    const vid = c.url.match(/[?&]v=([^&]+)/)?.[1]
    if (!vid) continue
    const exists = await contentExistsWithVideoId(vid)
    if (exists) continue

    const res = await ingestYoutubeWatchUrl(c.url, { baseUrl })
    if (res.ok) {
      ingested += 1
    } else {
      errors.push(`${vid}: ${res.error}`)
    }
  }

  await setChannelSyncState({ lastRunIso: new Date().toISOString() })

  return NextResponse.json({
    ok: true,
    channels: channels.length,
    candidates: candidates.length,
    ingested,
    maxIngestsPerRun: MAX_INGESTS_PER_RUN,
    publishedAfterIso,
    errors: errors.slice(0, 30),
    skippedCount: skipped.length,
  })
}

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runSync(req)
  } catch (e) {
    console.error('sync-channels fatal:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'sync failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
