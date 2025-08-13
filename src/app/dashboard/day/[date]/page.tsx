'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import {
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { useAuth } from '@/lib/auth'

type Sentiment = 'bullish' | 'bearish' | 'neutral'

interface Mention {
  ticker: string
  sentiment: Sentiment
  timestamps?: number[]
  context?: string
}

interface ContentDoc {
  id: string
  influencerName?: string
  platform?: string
  sourceUrl?: string
  videoId?: string
  episodeTitle?: string
  createdAt: string
  publishedAt?: string
  updatedAt?: string
  extractedMentions?: Mention[]
  highlights?: { startSec: number; endSec?: number; text: string }[]
  notableTimestamps?: Array<{ time: number; description: string }>
}

interface TickerAggregate {
  ticker: string
  count: number
  avgSentimentScore: number
  mentions: Array<{
    influencer: string
    episode: string
    sentiment: Sentiment
    context?: string
  }>
}

interface PageProps {
  params: Promise<{ date: string }> // This will be a date string like "2025-01-15"
}

export default function DayPage({ params }: PageProps) {
  const { isPro, user } = useAuth()
  const [content, setContent] = useState<ContentDoc[]>([])
  const [tickers, setTickers] = useState<TickerAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [dayDate, setDayDate] = useState<Date | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Debug auth status
  console.log('Debug: Auth status', {
    user: user?.email,
    uid: user?.uid,
    isPro,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      const dateStr = resolvedParams.date // e.g., "2025-01-15"
      // Parse the date in Eastern timezone
      const [year, month, day] = dateStr.split('-').map(Number)
      // Create date in Eastern timezone
      const date = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid DST issues
      console.log('Debug: Parsed URL date', {
        dateStr,
        parsedDate: date.toISOString(),
        localDate: date.toLocaleDateString('en-US', { timeZone: 'America/New_York' })
      })
      setDayDate(date)
    }
    getParams()
  }, [params])

  // TEMPORARY: Force Pro status for testing if user is david.eagan@gmail.com
  const forcePro = user?.email === 'david.eagan@gmail.com'
  const effectiveIsPro = isPro || forcePro

  // Check if this date is locked
  // Free users can see days 12-14, everything after 90 days is free for SEO, Pro users see all data
  const isLocked = (() => {
    if (!dayDate) return false
    
    // Use Eastern timezone for all date comparisons
    const now = new Date()
    const todayEastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const todayStr = todayEastern.toISOString().split('T')[0] // YYYY-MM-DD
    
    const dayDateEastern = new Date(dayDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const dayDateStr = dayDateEastern.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Calculate days difference using Eastern timezone dates
    const todayDate = new Date(todayStr)
    const dayDateOnly = new Date(dayDateStr)
    const diffTime = todayDate.getTime() - dayDateOnly.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Pro users can see any date
    if (effectiveIsPro) {
      console.log('Debug: Pro user accessing:', {
        requestedDate: dayDateStr,
        today: todayStr,
        dayIndex: diffDays,
        isPro,
        forcePro,
        effectiveIsPro,
        isLocked: false,
        reason: 'Pro user - full access'
      })
      return false
    }
    
    // Everything after 90 days is free for SEO
    if (diffDays > 90) {
      console.log('Debug: SEO free access:', {
        requestedDate: dayDateStr,
        today: todayStr,
        dayIndex: diffDays,
        isPro,
        isLocked: false,
        reason: 'SEO free access (90+ days old)'
      })
      return false
    }
    
    // Free users can see days 12, 13, and 14 (12-14 days ago)
    const isFreeDay = diffDays >= 12 && diffDays <= 14
    const result = !isFreeDay
    
    // Debug logging
    console.log('Debug date comparison:', {
      requestedDate: dayDateStr,
      today: todayStr,
      dayIndex: diffDays,
      isPro,
      isLocked: result,
      freeDays: '12-14',
      reason: isFreeDay ? 'Free day (12-14 days ago)' : 
              diffDays < 0 ? 'Future date' :
              diffDays < 12 ? 'Recent date (requires Pro)' :
              diffDays <= 90 ? 'Recent date (requires Pro)' :
              'Older date (SEO free)'
    })
    
    return result
  })()

  useEffect(() => {
    if (isLocked) {
      setLoading(false)
      return
    }

    const fetchDayData = async () => {
      if (!dayDate) return

      // Use Eastern timezone for date comparison
      const dayDateEastern = new Date(dayDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const dayDateStr = dayDateEastern.toISOString().split('T')[0] // YYYY-MM-DD

      try {
        const q = query(
          collection(db, 'content'),
          orderBy('publishedAt')
        )
        const snap = await getDocs(q)
        const docs: ContentDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentDoc[]
        
        // Filter by date after fetching since publishedAt is a string
        console.log('Debug: Date filtering', {
          requestedDate: dayDateStr,
          totalDocs: docs.length,
          sampleDocs: docs.slice(0, 3).map(d => ({ id: d.id, publishedAt: d.publishedAt }))
        })
        
        const filteredDocs = docs.filter(doc => {
          if (!doc.publishedAt && !doc.updatedAt) {
            console.log('Debug: No publishedAt or updatedAt for doc:', doc.id)
            return false
          }
          
          // Normalize the requested date to start of day in Eastern timezone
          const requestedDateStart = new Date(dayDateStr + 'T00:00:00')
          
          // Determine which date field to use
          let dateField = doc.publishedAt
          if (doc.publishedAt && (
            doc.publishedAt.includes('Streamed live') || 
            doc.publishedAt.includes('ago') ||
            doc.publishedAt.includes('Live')
          )) {
            // Use updatedAt for live stream content
            dateField = doc.updatedAt || doc.createdAt
            console.log('Debug: Using updatedAt for live stream:', {
              docId: doc.id,
              publishedAt: doc.publishedAt,
              updatedAt: doc.updatedAt,
              createdAt: doc.createdAt,
              usingField: dateField
            })
          }
          
          if (!dateField) {
            console.log('Debug: No valid date field for doc:', doc.id)
            return false
          }
          
          // Parse the date
          let docDate: Date
          try {
            // Handle different date formats
            if (typeof dateField === 'string') {
              if (dateField.includes(',')) {
                // Format like "Aug 10, 2025" - parse in Eastern timezone
                const [monthDay, year] = dateField.split(', ')
                const [month, day] = monthDay.split(' ')
                const monthIndex = new Date(Date.parse(month + " 1, 2000")).getMonth()
                docDate = new Date(parseInt(year), monthIndex, parseInt(day))
              } else if (dateField.includes('-')) {
                // Format like "2025-08-10"
                const [year, month, day] = dateField.split('-').map(Number)
                docDate = new Date(year, month - 1, day)
              } else {
                // Try parsing as is
                docDate = new Date(dateField)
              }
            } else {
              // If it's already a Date object
              docDate = new Date(dateField)
            }
            
            // Check if the date is valid
            if (isNaN(docDate.getTime())) {
              console.warn('Invalid date found:', dateField, 'for doc:', doc.id)
              return false
            }
            
            // Normalize doc date to start of day in Eastern timezone
            const docDateEastern = new Date(docDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
            const docDateStart = new Date(docDateEastern.getFullYear(), docDateEastern.getMonth(), docDateEastern.getDate())
            
            // Compare dates
            const isInRange = docDateStart.getTime() === requestedDateStart.getTime()
            
            if (isInRange) {
              console.log('Debug: Found matching doc:', {
                docId: doc.id,
                publishedAt: doc.publishedAt,
                updatedAt: doc.updatedAt,
                usedField: dateField,
                docDateStart: docDateStart.toISOString(),
                requestedDateStart: requestedDateStart.toISOString()
              })
            }
            
            return isInRange
          } catch (error) {
            console.error('Error parsing date:', dateField, 'for doc:', doc.id, error)
            return false
          }
        })
        
        console.log('Debug: Filtering results', {
          requestedDate: dayDateStr,
          totalDocs: docs.length,
          filteredDocs: filteredDocs.length,
          filteredDocIds: filteredDocs.map(d => d.id)
        })
        
        setContent(filteredDocs)
        const aggregates = aggregateMentions(filteredDocs)
        setTickers(aggregates)
      } catch (e) {
        console.error('Failed loading day data', e)
        setContent([])
        setTickers([])
      } finally {
        setLoading(false)
      }
    }

    fetchDayData()
  }, [dayDate, isLocked])

  const formatDate = (date: Date | null) => {
    if (!date) return 'Loading...'
    
    // Use Eastern timezone for date comparisons
    const now = new Date()
    const todayEastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const yesterdayEastern = new Date(todayEastern)
    yesterdayEastern.setDate(todayEastern.getDate() - 1)
    
    const dateEastern = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    
    if (dateEastern.toDateString() === todayEastern.toDateString()) {
      return 'Today'
    } else if (dateEastern.toDateString() === yesterdayEastern.toDateString()) {
      return 'Yesterday'
    } else {
      return dateEastern.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        timeZone: 'America/New_York'
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLocked) {
    // Use Eastern timezone for date calculations
    const now = new Date()
    const todayEastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const dayDateEastern = new Date(dayDate!.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    
    const diffTime = todayEastern.getTime() - dayDateEastern.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    const isRecent = diffDays < 12
    
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">{formatDate(dayDate)}</h1>
              <p className="text-zinc-400 mt-1">
                {dayDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'America/New_York'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400">
                {diffDays === 0 ? 'Today' : 
                 diffDays === 1 ? 'Yesterday' : 
                 `${diffDays} days ago`}
              </div>
              <div className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded mt-1">
                🔒 Pro Only
              </div>
            </div>
          </div>

          {/* Locked Content Preview */}
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🔒</div>
              
              {isRecent ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">Recent Market Signals</h2>
                  <p className="text-zinc-400 mb-6 text-lg">
                    This day contains fresh market-moving insights from top finance influencers. 
                    Pro members get same-day access to all signals.
                  </p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-3">What Pro Members See:</h3>
                    <ul className="text-left text-zinc-300 space-y-2">
                      <li>• Real-time stock mentions and sentiment analysis</li>
                      <li>• Key highlights with timestamps for quick insights</li>
                      <li>• Notable moments from finance podcasts and videos</li>
                      <li>• Access to all 14 days of market signals</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">Historical Market Data</h2>
                  <p className="text-zinc-400 mb-6 text-lg">
                    This day contains valuable market insights from finance influencers. 
                    Pro members have full access to our complete archive.
                  </p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Pro Benefits:</h3>
                    <ul className="text-left text-zinc-300 space-y-2">
                      <li>• Complete access to all historical data</li>
                      <li>• Advanced filtering and search capabilities</li>
                      <li>• Export functionality for analysis</li>
                      <li>• Priority support and updates</li>
                    </ul>
                  </div>
                </>
              )}
              
              <div className="space-y-4">
                                 <button 
                   onClick={() => {
                     // Redirect to admin to set Pro status
                     window.location.href = '/admin'
                   }}
                   className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
                 >
                   Upgrade to Pro - $49/month
                 </button>
                <div className="text-sm text-zinc-500">
                  Free users can access data from 12-14 days ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">{formatDate(dayDate)}</h1>
            <p className="text-zinc-400 mt-1">
              {content.length} content pieces • {tickers.length} tickers mentioned
            </p>
          </div>
                     <div className="text-right">
             <div className="text-sm text-zinc-400">
               {dayDate?.toLocaleDateString('en-US', { 
                 year: 'numeric',
                 month: 'short', 
                 day: 'numeric',
                 timeZone: 'America/New_York'
               })}
             </div>
             {!isLocked && (
               <div className={`text-xs px-2 py-1 rounded mt-1 ${
                 effectiveIsPro 
                   ? 'bg-blue-900 text-blue-200' 
                   : 'bg-emerald-900 text-emerald-200'
               }`}>
                 {effectiveIsPro ? 'Pro Day' : 'Free Day'}
               </div>
             )}
           </div>
        </div>

        {/* Content Pieces */}
        {content.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Content Pieces</h2>
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {item.episodeTitle || 'Untitled Episode'}
                      </h3>
                      <p className="text-zinc-400">
                        {item.influencerName} • {item.platform}
                      </p>
                    </div>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Source →
                    </a>
                  </div>
                  
                                     {item.extractedMentions && Array.isArray(item.extractedMentions) && item.extractedMentions.length > 0 && (
                     <div className="mb-4">
                       <h4 className="text-sm font-medium text-zinc-300 mb-2">Stock Mentions</h4>
                       <div className="flex flex-wrap gap-2">
                         {item.extractedMentions.map((mention, idx) => (
                           <span
                             key={idx}
                             className={`text-xs px-2 py-1 rounded ${
                               mention.sentiment === 'bullish' ? 'bg-emerald-900 text-emerald-200' :
                               mention.sentiment === 'bearish' ? 'bg-red-900 text-red-200' :
                               'bg-zinc-700 text-zinc-300'
                             }`}
                           >
                             {mention.ticker} ({mention.sentiment})
                           </span>
                         ))}
                       </div>
                     </div>
                   )}

                                     

                                                                                                                                                       {item.notableTimestamps && (
                       <div>
                         <h4 className="text-sm font-medium text-zinc-300 mb-2">Notable Moments</h4>
                         <div className="space-y-2">
                           {(() => {
                             const timestamps = typeof item.notableTimestamps === 'string' 
                               ? parseNotableTimestamps(item.notableTimestamps)
                               : Array.isArray(item.notableTimestamps) 
                                 ? item.notableTimestamps.map(ts => ({
                                     timeString: formatTime(ts.time),
                                     seconds: ts.time,
                                     description: ts.description
                                   }))
                                 : []
                             
                             const isExpanded = expandedItems.has(item.id)
                             const displayTimestamps = isExpanded ? timestamps : timestamps.slice(0, 3)
                             
                             return (
                               <>
                                 {displayTimestamps.map((timestamp, idx) => (
                                   <div key={idx} className="text-sm bg-zinc-900 p-3 rounded">
                                     <div className="flex items-start justify-between">
                                       <div className="flex-1">
                                         <p className="text-zinc-300">{timestamp.description}</p>
                                       </div>
                                       <a
                                         href={`${item.sourceUrl}&t=${timestamp.seconds}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="text-blue-400 hover:text-blue-300 text-xs ml-2 flex-shrink-0"
                                       >
                                         {timestamp.timeString}
                                       </a>
                                     </div>
                                   </div>
                                 ))}
                                 
                                 {timestamps.length > 3 && (
                                   <button
                                     onClick={() => {
                                       const newExpanded = new Set(expandedItems)
                                       if (isExpanded) {
                                         newExpanded.delete(item.id)
                                       } else {
                                         newExpanded.add(item.id)
                                       }
                                       setExpandedItems(newExpanded)
                                     }}
                                     className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                   >
                                     {isExpanded ? 'Show Less' : `Show ${timestamps.length - 3} More`}
                                   </button>
                                 )}
                               </>
                             )
                           })()}
                          </div>
                        </div>
                      )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Tickers */}
        {tickers.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Trending Tickers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickers.map((ticker) => (
                <div key={ticker.ticker} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold">{ticker.ticker}</div>
                    <SentimentBadge score={ticker.avgSentimentScore} />
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-zinc-400 mb-1">{ticker.count} mentions</div>
                    <div className="h-2 bg-zinc-800 rounded">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{ width: `${Math.min(100, ticker.count * 8)}%` }}
                      />
                    </div>
                  </div>

                  {ticker.mentions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-2">Mentions</h4>
                      <div className="space-y-2">
                        {ticker.mentions.slice(0, 3).map((mention, idx) => (
                          <div key={idx} className="text-xs bg-zinc-900 p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-zinc-400">{mention.influencer}</span>
                              <span className={`text-xs ${
                                mention.sentiment === 'bullish' ? 'text-emerald-400' :
                                mention.sentiment === 'bearish' ? 'text-red-400' :
                                'text-zinc-400'
                              }`}>
                                {mention.sentiment}
                              </span>
                            </div>
                            <p className="text-zinc-500 truncate">{mention.episode}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {content.length === 0 && (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-2">No content for this day</div>
            <p className="text-sm text-zinc-500">
              No videos or podcasts have been processed for this date yet.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function sentimentToScore(s: Sentiment): number {
  if (s === 'bullish') return 1
  if (s === 'bearish') return -1
  return 0
}

function aggregateMentions(docs: ContentDoc[]): TickerAggregate[] {
  const map = new Map<string, { 
    sum: number; 
    count: number; 
    mentions: Array<{
      influencer: string
      episode: string
      sentiment: Sentiment
      context?: string
    }>
  }>()
  
  for (const doc of docs) {
    const mentions = doc.extractedMentions || []
    for (const m of mentions) {
      const prev = map.get(m.ticker) || { sum: 0, count: 0, mentions: [] }
      prev.sum += sentimentToScore(m.sentiment)
      prev.count += 1
      prev.mentions.push({
        influencer: doc.influencerName || 'Unknown',
        episode: doc.episodeTitle || 'Untitled',
        sentiment: m.sentiment,
        context: m.context
      })
      map.set(m.ticker, prev)
    }
  }
  
  const arr: TickerAggregate[] = Array.from(map.entries()).map(([ticker, v]) => ({
    ticker,
    count: v.count,
    avgSentimentScore: v.count ? v.sum / v.count : 0,
    mentions: v.mentions
  }))
  
  arr.sort((a, b) => b.count - a.count)
  return arr
}

function parseNotableTimestamps(timestampsString: string) {
  // Parse the formatted string like "- **[00:00]** — Description"
  const lines = timestampsString.split('\n').filter(line => line.trim())
  
  return lines.map(line => {
    // Extract timestamp like [00:00] and description
    const match = line.match(/- \*\*\[(\d{2}:\d{2})\]\*\* — (.+)/)
    if (!match) return null
    
    const timeString = match[1] // e.g., "00:00"
    const description = match[2].trim()
    
    // Convert MM:SS to seconds
    const [minutes, seconds] = timeString.split(':').map(Number)
    const totalSeconds = minutes * 60 + seconds
    
    return {
      timeString,
      seconds: totalSeconds,
      description
    }
  }).filter(Boolean) as Array<{
    timeString: string
    seconds: number
    description: string
  }>
}

function SentimentBadge({ score }: { score: number }) {
  const label = score > 0.2 ? 'bullish' : score < -0.2 ? 'bearish' : 'neutral'
  const cls =
    label === 'bullish'
      ? 'text-emerald-400'
      : label === 'bearish'
      ? 'text-red-400'
      : 'text-zinc-400'
  return <span className={`text-xs ${cls}`}>{label}</span>
}
