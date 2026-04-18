import { NextResponse } from 'next/server'
import { ingestYoutubeWatchUrl } from '@/lib/youtubeIngestCore'

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

export async function POST(req: Request) {
  try {
    const { youtubeUrl } = await req.json()
    if (!youtubeUrl) return NextResponse.json({ error: 'youtubeUrl is required' }, { status: 400 })

    const baseUrl = resolveBaseUrl(req)
    const result = await ingestYoutubeWatchUrl(youtubeUrl, { baseUrl })

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
