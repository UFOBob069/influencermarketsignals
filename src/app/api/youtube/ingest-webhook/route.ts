import { NextRequest, NextResponse } from 'next/server'
import { ingestYoutubeWatchUrl } from '@/lib/youtubeIngestCore'
import { contentExistsWithVideoId } from '@/lib/serverFirestoreContent'
import { extractVideoId } from '@/lib/fetchTranscript'

function resolveBaseUrl(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  const host = req.headers.get('host')
  if (host?.includes('localhost')) return `http://${host}`
  if (host) return `https://${host}`
  return 'http://localhost:3000'
}

function webhookAuthorized(req: NextRequest, secret: string): boolean {
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  return req.headers.get('x-ingest-webhook-secret') === secret
}

/**
 * Secured ingest for a **pre-fetched transcript** (e.g. from a home PC / Railway worker with better YouTube success).
 * Set `INGEST_WEBHOOK_SECRET` on Vercel and send the same value as `Authorization: Bearer …` or `x-ingest-webhook-secret`.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INGEST_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'INGEST_WEBHOOK_SECRET is not configured on the server' },
        { status: 503 }
      )
    }

    if (!webhookAuthorized(req, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { youtubeUrl?: string; transcript?: string }
    const youtubeUrl = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim() : ''
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'youtubeUrl is required' }, { status: 400 })
    }
    if (transcript.length < 40) {
      return NextResponse.json(
        { error: 'transcript is required and must be at least 40 characters' },
        { status: 400 }
      )
    }

    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const exists = await contentExistsWithVideoId(videoId)
    if (exists) {
      return NextResponse.json({ success: true, skipped: true, reason: 'already_ingested', videoId })
    }

    const baseUrl = resolveBaseUrl(req)
    const result = await ingestYoutubeWatchUrl(youtubeUrl, { baseUrl, transcript })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
    }

    return NextResponse.json({
      success: true,
      contentId: result.contentId,
      transcriptLength: result.transcriptLength,
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
