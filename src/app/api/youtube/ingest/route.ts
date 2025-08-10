import { NextResponse } from 'next/server'
import { fetchTranscriptCascade } from '@/lib/fetchTranscript'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

function extractVideoId(url: string): string | null {
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[1]?.length === 11 ? match[1] : null
}

export async function POST(req: Request) {
  try {
    const { youtubeUrl } = await req.json()
    if (!youtubeUrl) return NextResponse.json({ error: 'youtubeUrl is required' }, { status: 400 })

    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })

    // Fetch transcript using Python service
    const transcript = await fetchTranscriptCascade(videoId)

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript available for this video. Captions may be disabled or the video may be too new.' },
        { status: 422 }
      )
    }

    // Fetch metadata via no-key oEmbed endpoint and basic page fetch fallback
    const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`).then(r => r.ok ? r.json() : null).catch(() => null)

    let title: string | null = oembed?.title || null
    let channelTitle: string | null = oembed?.author_name || null
    let publishedAt: string | null = null
    let channelSubscribers: number | null = null

    try {
      const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { 'accept-language': 'en' } }).then(r => r.text())
      const mTitle = html.match(/<meta name="title" content="([^"]+)"/)
      title = title || mTitle?.[1] || null
      const mChannel = html.match(/"ownerChannelName":"([^"]+)"/)
      channelTitle = channelTitle || mChannel?.[1] || null
      const mPublished = html.match(/"dateText":\{"simpleText":"([^"]+)"\}/)
      publishedAt = mPublished?.[1] || null
      const mSubs = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/)
      if (mSubs?.[1]) {
        const n = mSubs[1].replace(/[^0-9\.kKmM]/g, '')
        const mult = /m/i.test(n) ? 1_000_000 : /k/i.test(n) ? 1_000 : 1
        channelSubscribers = Math.round(parseFloat(n) * mult)
      }
    } catch {}

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'content'), {
      youtubeUrl,
      videoId,
      transcript,
      influencerName: channelTitle,
      platform: 'YouTube',
      sourceUrl: youtubeUrl,
      episodeTitle: title,
      channelSubscribers,
      publishedAt,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Trigger content processing
    try {
      // Use HTTP for localhost, HTTPS for production
      const protocol = req.headers.get('host')?.includes('localhost') ? 'http' : 'https'
      const baseUrl = req.headers.get('host') ? `${protocol}://${req.headers.get('host')}` : 'http://localhost:3001'
      await fetch(`${baseUrl}/api/process-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: docRef.id }),
      })
    } catch (error) {
      console.error('Error triggering content processing:', error)
      // Don't fail the request if processing fails
    }

    return NextResponse.json({
      success: true,
      contentId: docRef.id,
      transcriptLength: transcript.length,
      videoTitle: title,
      channelTitle,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}


