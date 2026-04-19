import fetch from 'node-fetch'
import { parseStringPromise } from 'xml2js'

/** YouTube is stricter with datacenter IPs; bare Node UA often gets player responses without captions. */
const YOUTUBE_FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

const INNERTUBE_CLIENTS: ReadonlyArray<{ clientName: string; clientVersion: string }> = [
  { clientName: 'ANDROID', clientVersion: '20.10.38' },
  { clientName: 'ANDROID', clientVersion: '19.08.35' },
  { clientName: 'WEB', clientVersion: '2.20250122.00.00' },
  { clientName: 'MWEB', clientVersion: '2.20250122.00.00' },
]

export function extractVideoId(input: string): string | null {
  if (!input) return null
  if (/^[\w-]{11}$/.test(input)) return input
  try {
    const u = new URL(input)
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v')
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1) || null
    }
  } catch {
    // ignore
  }
  return null
}

interface CaptionTrack {
  languageCode: string
  baseUrl: string
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[]
    }
  }
}

interface CaptionEntry {
  _: string
  $: {
    start: string
    dur: string
  }
}

interface ParsedTranscript {
  transcript: {
    text: CaptionEntry[]
  }
}

async function getInnertubeApiKey(videoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(videoUrl, { headers: YOUTUBE_FETCH_HEADERS })
    const html = await response.text()
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
    return apiKeyMatch ? apiKeyMatch[1] : null
  } catch (error) {
    console.error('Failed to get INNERTUBE_API_KEY:', error)
    return null
  }
}

async function getPlayerResponse(
  videoId: string,
  apiKey: string,
  client: { clientName: string; clientVersion: string }
): Promise<PlayerResponse> {
  const endpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`

  const body = {
    context: {
      client,
    },
    videoId,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...YOUTUBE_FETCH_HEADERS,
      Origin: 'https://www.youtube.com',
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
    body: JSON.stringify(body),
  })

  return (await response.json()) as PlayerResponse
}

function pickCaptionTrack(tracks: CaptionTrack[], lang: string): CaptionTrack | null {
  const exact = tracks.find((t) => t.languageCode === lang)
  if (exact) return exact

  const lower = lang.toLowerCase()
  const prefix = lower.split('-')[0] || lower
  const prefixMatch = tracks.find(
    (t) =>
      t.languageCode.toLowerCase() === lower ||
      t.languageCode.toLowerCase().startsWith(prefix + '-') ||
      t.languageCode.toLowerCase() === prefix
  )
  if (prefixMatch) return prefixMatch

  if (prefix === 'en') {
    const anyEn = tracks.find((t) => t.languageCode.toLowerCase().startsWith('en'))
    if (anyEn) return anyEn
  }

  return tracks[0] ?? null
}

function extractCaptionTrackUrl(playerResponse: PlayerResponse, lang: string = 'en'): string | null {
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!tracks?.length) {
    console.log('No caption tracks found in player response')
    return null
  }

  const track = pickCaptionTrack(tracks, lang)
  if (!track) {
    console.log(`No usable caption track for preference: ${lang}`)
    return null
  }

  return track.baseUrl.replace(/&fmt=\w+$/, '')
}

async function fetchAndParseCaptions(baseUrl: string): Promise<Array<{ caption: string, startTime: number, endTime: number }>> {
  const response = await fetch(baseUrl, { headers: YOUTUBE_FETCH_HEADERS })
  const xml = await response.text()
  const parsed = await parseStringPromise(xml) as ParsedTranscript
  
  return parsed.transcript.text.map((entry: CaptionEntry) => ({
    caption: entry._,
    startTime: parseFloat(entry.$.start),
    endTime: parseFloat(entry.$.start) + parseFloat(entry.$.dur),
  }))
}

/**
 * Get captions for a given YouTube video using the Innertube API
 * @param videoId - YouTube video ID
 * @param language - Language code, e.g., "en", "hi"
 * @returns Promise<Array<{ caption: string, startTime: number, endTime: number }>>
 */
async function getYoutubeTranscriptInnertube(
  videoId: string,
  language: string = 'en'
): Promise<Array<{ caption: string; startTime: number; endTime: number }> | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    const apiKey = await getInnertubeApiKey(videoUrl)
    if (!apiKey) {
      console.warn('Innertube: INNERTUBE_API_KEY not found in watch page HTML')
      return null
    }

    for (const client of INNERTUBE_CLIENTS) {
      const playerData = await getPlayerResponse(videoId, apiKey, client)
      const baseUrl = extractCaptionTrackUrl(playerData, language)
      if (!baseUrl) continue

      const captions = await fetchAndParseCaptions(baseUrl)
      if (captions?.length) return captions
    }

    return null
  } catch (error) {
    console.error('Innertube API failed:', error)
    return null
  }
}

export async function fetchTranscriptCascade(videoId: string): Promise<string | null> {
  // Try Innertube API first (most reliable)
  const languages = ['en', 'en-US', 'en-GB', 'en-CA']
  
  for (const lang of languages) {
    try {
      console.log(`Trying Innertube API with language: ${lang}`)
      const captions = await getYoutubeTranscriptInnertube(videoId, lang)
      
      if (captions && captions.length > 0) {
        const transcript = captions.map(c => c.caption).join(' ').replace(/\s+/g, ' ').trim()
        if (transcript) {
          console.log(`Innertube API succeeded with language: ${lang}, ${captions.length} captions`)
          return transcript
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`Innertube API failed with language ${lang}:`, errorMessage)
    }
  }

  // Fallback: Try Node.js method with multiple strategies
  const strategies = [
    { name: 'default', options: {} },
    { name: 'english', options: { lang: 'en' } },
    { name: 'en-US', options: { lang: 'en-US' } },
    { name: 'en-GB', options: { lang: 'en-GB' } },
    { name: 'en-CA', options: { lang: 'en-CA' } }
  ]

  for (const strategy of strategies) {
    try {
      const { YoutubeTranscript } = await import('youtube-transcript')
      const items = await YoutubeTranscript.fetchTranscript(videoId, strategy.options)
      if (items && items.length > 0) {
        const joined = items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim()
        if (joined) {
          console.log(`Node.js method succeeded with ${strategy.name} strategy`)
          return joined
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`Node.js method failed with ${strategy.name} strategy:`, errorMessage)
    }
  }

  // Final fallback: Try to get any available transcript
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const items = await YoutubeTranscript.fetchTranscript(videoId)
    if (items && items.length > 0) {
      const joined = items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim()
      if (joined) {
        console.log('Node.js method succeeded with any available transcript')
        return joined
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('All methods failed:', errorMessage)
  }
  
  return null
}


