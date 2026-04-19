import type { DocumentData } from 'firebase/firestore'
import { fetchTranscriptCascade, extractVideoId } from '@/lib/fetchTranscript'
import { contentDocCreate } from '@/lib/serverFirestoreContent'

function omitUndefined(o: Record<string, unknown>): DocumentData {
  const out: DocumentData = {}
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

function watchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

async function fetchMetadata(videoId: string) {
  const youtubeUrl = watchUrl(videoId)
  const oembed = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  let title: string | null = oembed?.title || null
  let channelTitle: string | null = oembed?.author_name || null
  let publishedAt: string | null = null
  let channelSubscribers: number | null = null

  try {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'accept-language': 'en' },
    }).then((r) => r.text())
    const mTitle = html.match(/<meta name="title" content="([^"]+)"/)
    title = title || mTitle?.[1] || null
    const mChannel = html.match(/"ownerChannelName":"([^"]+)"/)
    channelTitle = channelTitle || mChannel?.[1] || null
    const mPublished = html.match(/"dateText":\{"simpleText":"([^"]+)"\}/)
    publishedAt = mPublished?.[1] || null
    const mSubs = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/)
    if (mSubs?.[1]) {
      const n = mSubs[1].replace(/[^0-9.kKmM]/g, '')
      const mult = /m/i.test(n) ? 1_000_000 : /k/i.test(n) ? 1_000 : 1
      channelSubscribers = Math.round(parseFloat(n) * mult)
    }
  } catch {
    // optional HTML scrape
  }

  return { title, channelTitle, publishedAt, channelSubscribers, youtubeUrl }
}

export type IngestYoutubeResult =
  | { ok: true; contentId: string; transcriptLength: number }
  | { ok: false; error: string; status?: number }

/**
 * Fetches transcript + metadata (unless `transcript` is pre-supplied, e.g. from a home runner),
 * creates `content` doc, triggers LLM processing.
 */
export async function ingestYoutubeWatchUrl(
  youtubeUrl: string,
  opts: { baseUrl: string; transcript?: string }
): Promise<IngestYoutubeResult> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) return { ok: false, error: 'Invalid YouTube URL', status: 400 }

  const provided = opts.transcript?.trim()
  const transcript = provided && provided.length > 0 ? provided : await fetchTranscriptCascade(videoId)
  if (!transcript) {
    return {
      ok: false,
      error: 'No transcript available for this video. Captions may be disabled or the video may be too new.',
      status: 422,
    }
  }

  const meta = await fetchMetadata(videoId)
  const subs =
    meta.channelSubscribers != null && Number.isFinite(meta.channelSubscribers)
      ? meta.channelSubscribers
      : null

  const contentId = await contentDocCreate(
    omitUndefined({
      youtubeUrl: meta.youtubeUrl,
      videoId,
      transcript,
      influencerName: meta.channelTitle ?? undefined,
      platform: 'YouTube',
      sourceUrl: meta.youtubeUrl,
      episodeTitle: meta.title ?? undefined,
      channelSubscribers: subs ?? undefined,
      publishedAt: meta.publishedAt ?? undefined,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  )

  try {
    const processUrl = `${opts.baseUrl.replace(/\/$/, '')}/api/process-content`
    await fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    })
  } catch (e) {
    console.error('ingestYoutubeWatchUrl: process-content trigger failed', e)
  }

  return { ok: true, contentId, transcriptLength: transcript.length }
}
