import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { getSubtitles } from 'youtube-captions-scraper'
import OpenAI from 'openai'

// Type declaration for the transcript segment
interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    console.log('Fetching transcript for video:', videoId)
    
    // Try to get transcript with the new library
    const transcript = await getSubtitles({
      videoID: videoId,
      lang: 'en' // try English first
    }) as TranscriptSegment[]
    
    console.log('Transcript segments found:', transcript.length)
    
    if (!transcript || transcript.length === 0) {
      // Try without language specification
      console.log('Trying without language specification...')
      const transcriptNoLang = await getSubtitles({
        videoID: videoId
      }) as TranscriptSegment[]
      console.log('Transcript without lang segments found:', transcriptNoLang.length)
      
      if (!transcriptNoLang || transcriptNoLang.length === 0) {
        throw new Error(`No transcript available for this video. Please check if the video has captions enabled at: https://www.youtube.com/watch?v=${videoId}`)
      }
      
      // Combine all transcript segments into one text
      const transcriptText = transcriptNoLang.map((segment: TranscriptSegment) => segment.text).join(' ')
      console.log('Final transcript length:', transcriptText.length)
      console.log('First 200 characters:', transcriptText.slice(0, 200))
      
      return transcriptText
    }
    
    // Combine all transcript segments into one text
    const transcriptText = transcript.map((segment: TranscriptSegment) => segment.text).join(' ')
    console.log('Final transcript length:', transcriptText.length)
    console.log('First 200 characters:', transcriptText.slice(0, 200))
    
    return transcriptText
    
  } catch (error) {
    console.error('Error in getYouTubeTranscript:', error)
    throw error
  }
}

export async function POST(request: Request) {
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
    
    if (!content.videoId) {
      console.error('No videoId found in content:', content)
      return NextResponse.json({ error: 'No videoId found in content' }, { status: 400 })
    }
    
    // Clean video ID (remove any URL parts)
    let cleanVideoId = content.videoId
    if (content.videoId.includes('youtube.com') || content.videoId.includes('youtu.be')) {
      const urlMatch = content.videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      if (urlMatch) {
        cleanVideoId = urlMatch[1]
      }
    }
    console.log('Clean video ID:', cleanVideoId)
    
    try {
      // Get transcript
      console.log('Fetching YouTube transcript for videoId:', cleanVideoId)
      console.log('Full video URL:', `https://www.youtube.com/watch?v=${cleanVideoId}`)
      
      // Get transcript text
      let transcriptText
      try {
        transcriptText = await getYouTubeTranscript(cleanVideoId)
        console.log('Transcript text (first 500 chars):', transcriptText.slice(0, 500));
        console.log('Transcript length:', transcriptText.length);
        console.log('Transcript fetched successfully')

        if (!transcriptText || transcriptText.length === 0) {
          throw new Error('No transcript data received from YouTube. This video may not have captions/transcripts available.')
        }
      } catch (transcriptError) {
        console.error('Error fetching transcript:', transcriptError)
        throw new Error(`Failed to fetch transcript: ${transcriptError instanceof Error ? transcriptError.message : 'Unknown error'}`)
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
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
            content: `You are an assistant designed to extract only the most important timestamps from a financial podcast transcript.\n\nYour job is to output a clean, chronological list of notable segments based only on what was said.\n\nFormat:\n- Each item should include the approximate timestamp (MM:SS)\n- A short, factual description of the discussion at that time\n- No interpretation, no summarizing the entire episode, no filler — just exactly what was discussed and when\n\nOutput example:\n- **[00:00]** — Introduction and market context\n- **[03:42]** — Guest introduces thesis on $NVDA post-earnings\n- **[07:10]** — Debate on whether the Fed will raise again in 2025\n- **[12:33]** — Mention of oil prices and Middle East tensions\n- **[16:20]** — Host questions the viability of AI startups\n\nUse only the information in the transcript. Your goal is to help someone jump to the exact moment where something important was said. Do not skip bold claims or tickers mentioned.`
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