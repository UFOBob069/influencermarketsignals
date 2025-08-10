import fetch from 'node-fetch'
import { parseStringPromise } from 'xml2js'

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
    const response = await fetch(videoUrl)
    const html = await response.text()
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
    return apiKeyMatch ? apiKeyMatch[1] : null
  } catch (error) {
    console.error('Failed to get INNERTUBE_API_KEY:', error)
    return null
  }
}

async function getPlayerResponse(videoId: string, apiKey: string): Promise<PlayerResponse> {
  const endpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`
  
  const body = {
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "20.10.38",
      },
    },
    videoId: videoId,
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  return await response.json() as PlayerResponse
}

function extractCaptionTrackUrl(playerResponse: PlayerResponse, lang: string = "en"): string | null {
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  
  if (!tracks) {
    console.log('No caption tracks found in player response')
    return null
  }
  
  const track = tracks.find((t: CaptionTrack) => t.languageCode === lang)
  if (!track) {
    console.log(`No captions for language: ${lang}`)
    return null
  }
  
  // Remove "&fmt=srv3" if present
  return track.baseUrl.replace(/&fmt=\w+$/, "")
}

async function fetchAndParseCaptions(baseUrl: string): Promise<Array<{ caption: string, startTime: number, endTime: number }>> {
  const response = await fetch(baseUrl)
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
async function getYoutubeTranscriptInnertube(videoId: string, language: string = "en"): Promise<Array<{ caption: string, startTime: number, endTime: number }> | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    // Step 1: Get INNERTUBE_API_KEY
    const apiKey = await getInnertubeApiKey(videoUrl)
    if (!apiKey) {
      throw new Error("INNERTUBE_API_KEY not found.")
    }
    
    // Step 2: Get player response
    const playerData = await getPlayerResponse(videoId, apiKey)
    
    // Step 3: Extract caption track URL
    const baseUrl = extractCaptionTrackUrl(playerData, language)
    if (!baseUrl) {
      throw new Error(`No captions for language: ${language}`)
    }
    
    // Step 4: Fetch and parse captions
    const captions = await fetchAndParseCaptions(baseUrl)
    return captions
    
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


