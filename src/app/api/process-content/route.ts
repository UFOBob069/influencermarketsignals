import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import OpenAI from 'openai'
import { extractVideoId, fetchTranscriptCascade } from '@/lib/fetchTranscript'

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Starting content processing...')
    console.log('Environment check - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
    
    const { contentId } = await request.json()
    console.log('Processing content ID:', contentId)

    if (!contentId) {
      console.error('No contentId provided in request')
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 })
    }

    // Get content document
    const contentRef = doc(db, 'content', contentId)
    const contentDoc = await getDoc(contentRef)
    
    if (!contentDoc.exists()) {
      console.error('Content not found:', contentId)
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const content = contentDoc.data()
    console.log('Content data:', content)
    console.log('Video ID from content:', content.videoId)
    console.log('Video ID type:', typeof content.videoId)
    
    const providedVideoId: string | undefined = content.videoId
    let cleanVideoId = providedVideoId || null
    if (!cleanVideoId && content.youtubeUrl) {
      cleanVideoId = extractVideoId(content.youtubeUrl)
    }
    if (!cleanVideoId) {
      console.error('No videoId/youtubeUrl found in content:', content)
      return NextResponse.json({ error: 'No videoId/youtubeUrl found in content' }, { status: 400 })
    }
    console.log('Clean video ID:', cleanVideoId)
    
    try {
      // mark as processing
      await updateDoc(contentRef, { status: 'processing', updatedAt: new Date().toISOString() })

      // Use existing transcript or try to fetch automatically
      let transcriptText: string = content.transcript || ''
      
      if (!transcriptText || transcriptText.trim().length === 0) {
        const fetched = await fetchTranscriptCascade(cleanVideoId)
        if (fetched && fetched.trim().length > 0) {
          transcriptText = fetched
        }
      }

      if (!transcriptText || transcriptText.trim().length === 0) {
        return NextResponse.json(
          { error: 'No transcript available for this video. Please paste the transcript manually.' },
          { status: 422 }
        )
      }
      
      console.log('Using manually provided transcript')
      console.log('Transcript length:', transcriptText.length)
      console.log('Transcript preview (first 500 chars):', transcriptText.slice(0, 500))

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
      }

      // Extract tickers + sentiment + timestamps (JSON)
      console.log('Extracting tickers and highlights...')
      const extraction = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You extract ONLY structured data from a finance transcript. Reply with STRICT JSON only, no prose.
\nSchema:
{
  "mentions": [
    { "ticker": string, "sentiment": "bullish"|"bearish"|"neutral", "timestamps": number[] }
  ],
  "highlights": [
    { "startSec": number, "endSec"?: number, "text": string }
  ]
}
\nGuidelines:
- Tickers MUST be real symbols explicitly mentioned. Use uppercase.
- sentiment must reflect stated sentiment in the transcript; if unclear, use "neutral".
- timestamps: array of approximate seconds from episode start when the ticker was discussed. Estimate if needed based on transcript timing hints.
- highlights: 5–12 top quotes or moments with startSec (approx) and short text.`
          },
          { role: 'user', content: transcriptText },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      })

      type Sentiment = 'bullish' | 'bearish' | 'neutral'
      interface Mention { ticker: string; sentiment: Sentiment; timestamps?: number[] }
      interface Highlight { startSec: number; endSec?: number; text: string }
      let extractedMentions: Mention[] = []
      let highlights: Highlight[] = []
      try {
        const raw = extraction.choices[0].message.content || '{}'
        const parsed = JSON.parse(raw)
        extractedMentions = Array.isArray(parsed.mentions) ? parsed.mentions : []
        highlights = Array.isArray(parsed.highlights) ? parsed.highlights : []
      } catch {
        console.warn('Failed to parse extraction JSON, defaulting to empty arrays')
      }

      // Generate blog article
      console.log('Generating blog article...')
      const blogArticle = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a financial note-taker summarizing a podcast transcript for readers who want to know exactly what was discussed — without interpretation, fluff, or generic summaries.
          
          Your task is to convert the transcript into a structured, factual recap. Only include details that were **explicitly discussed in the episode**.
          
          Output in this format (Markdown):
          ## 🎧 Episode Summary
          
          ### 🔹 Key Discussion Points
          - [Speaker name if available]: [Brief summary of what was said — only facts]
          - Bullet every major point or topic covered
          - Be specific: include tickers, macro topics, earnings data, quotes, etc.
          
          ### 📈 Stocks/Sectors Mentioned
          - [Ticker] – [context: what was said about it]
          
          ### 🗣️ Notable Quotes
          - " [Exact quote from speaker] "
          
          ### 📊 Sentiment From Hosts
          - Label the tone for each speaker as bullish, bearish, neutral, or mixed — but only if explicitly stated
          
          ### 🔗 Source
          _This summary is based on: [Podcast Name], " [Episode Title] " – [link if available]_
          
          DO NOT interpret what anything means.
          DO NOT add your own opinions.
          DO NOT generalize.
          DO NOT summarize without including the actual content.`
          },
          {
            role: "user",
            content: transcriptText
          }
        ],
        max_tokens: 3000,
      })
      console.log('Blog article generated')

      // Generate tweet thread
      console.log('Generating tweet thread...')
      const tweetThread = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are summarizing the literal content of a finance podcast in a 6–10 tweet thread for readers who want a straight recap.
          
          Instructions:
          - Begin with: A viral hook from the podcast, your goal is to make the tweet thread go viral
          - Each tweet should contain a specific detail, quote, or topic discussed — NOT general summaries.
          - Use names, tickers, statements made, questions debated — all from the transcript.
          - Include 1–2 direct quotes where impactful.
          - Do not add interpretation, opinion, or conclusions.
          - Final tweet should include: "🎧 Full episode: [link] — Follow @MarketPodDigest for more straight podcast recaps."
          - Make sure the tweet thread goes viral

          Each tweet should feel like someone is taking notes in real time, not rewriting it into blog-speak or commentary. Just the facts. Each tweet should be 280 characters or less.`
          },
          {
            role: "user",
            content: transcriptText
          }
        ],
        max_tokens: 1500,
      })
      console.log('Tweet thread generated')

      // Generate video script
      console.log('Generating video script...')
      const videoScript = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are creating a 90-second short-form video script that summarizes what was said in a finance podcast — exactly as it was discussed.
          
          Goal: Give the viewer a faithful recap of the key moments, names, and stock mentions from the episode.
          
          Script Structure:
          1. **Hook** (first 5s): use a real quote or bold claim from the podcast.
          2. **3–5 Sections (15–25s each)**: summarize key segments or conversations from the episode. Include names, tickers, and quotes.
          3. After each section, include a visual cue like: [Visual: NVDA stock chart], [Visual: Speaker headshot], or [Visual: Quote text]
          4. Final line: "Want more quick recaps? Follow @MarketPodDigest."
          
          Do not editorialize, interpret, or simplify.
          Your job is to surface what was said — no filler, no takes. Just the facts.`
          },
          {
            role: "user",
            content: transcriptText
          }
        ],
        max_tokens: 2000,
      })
      console.log('Video script generated')

      // Generate notable timestamps
      console.log('Generating notable timestamps...')
      const notableTimestamps = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an assistant that extracts only the most important timestamps from a financial podcast transcript.

Your output is a clean, chronological list of notable segments, based strictly on what was actually said.

Rules:
- Include the approximate timestamp in MM:SS (or H:MM:SS if needed).
- Use the exact timestamp from the transcript when available; if none exists, estimate conservatively based on surrounding context.
- Keep each description short, factual, and specific — just what was discussed, not summaries of the whole show.
- Always capture bold claims, ticker symbols (e.g., $NVDA), specific numbers, and any material news or guidance.
- Exclude filler, pleasantries, and minor tangents.
- Do not add interpretation, opinions, or extra analysis beyond what is explicitly stated.
- Keep the list chronological and evenly spaced; skip repetitive points unless they add new facts.

Format:
- **[MM:SS]** — Brief factual description
- **[03:42]** — Guest outlines thesis on $NVDA post-earnings
- **[07:10]** — Debate on whether the Fed will raise rates in 2025
- **[12:33]** — Mention of oil prices and Middle East tensions
- **[16:20]** — Host questions viability of AI startups

Your goal: help a reader jump directly to the exact moments in the episode where something important was said.
`
          },
          {
            role: "user",
            content: transcriptText
          }
        ],
        max_tokens: 1200,
      })
      console.log('Notable timestamps generated')

      // Update Firestore with generated content
      console.log('Updating Firestore...')
      await updateDoc(contentRef, {
        status: 'complete',
        blogArticle: blogArticle.choices[0].message.content,
        tweetThread: tweetThread.choices[0].message.content,
        videoScript: videoScript.choices[0].message.content,
        notableTimestamps: notableTimestamps.choices[0].message.content,
        extractedMentions,
        highlights,
        updatedAt: new Date().toISOString(),
      })
      console.log('Firestore updated successfully')

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error during content generation:', error)
      
      // Update Firestore with error status
      try {
        await updateDoc(contentRef, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          updatedAt: new Date().toISOString(),
        })
      } catch (updateError) {
        console.error('Failed to update error status:', updateError)
      }

      throw error
    }
  } catch (error) {
    console.error('Error processing content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process content' },
      { status: 500 }
    )
  }
}