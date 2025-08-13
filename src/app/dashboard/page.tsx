'use client'

import { useEffect, useMemo, useState } from 'react'
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
  extractedMentions?: Mention[]
  highlights?: { startSec: number; endSec?: number; text: string }[]
  notableTimestamps?: string | Array<{ time: number; description: string }>
}



interface DayData {
  date: Date
  dayIndex: number
  tickerCount: number
  bullishPercent: number
  bearishPercent: number
  topTickers: Array<{ ticker: string; sentiment: Sentiment }>
  isLocked: boolean
  isFreeDay: boolean
}

export default function DashboardPage() {
  const { isPro } = useAuth() // get Pro status from auth context
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0) // 0 = Today
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false)
  const [daysData, setDaysData] = useState<DayData[]>([])
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Generate days with actual dates (14 days from selected date or current date)
  const days = useMemo(() => {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
    const dParam = url?.searchParams.get('d')
    const initial = dParam ? Number(dParam) : 0
    
    // Determine the base date for generating days
    let baseDate = new Date()
    if (selectedMonth && selectedYear) {
      // If a specific month/year is selected, use the last day of that month
      const lastDayOfMonth = new Date(selectedYear, parseInt(selectedMonth), 0)
      baseDate = lastDayOfMonth
    }
    
    if (!Number.isNaN(initial)) {
      setSelectedDayIndex(Math.max(0, Math.min(13, initial)))
    }
    
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() - i)
      return {
        dayIndex: i,
        date: date,
        isLocked: !isPro && (i < 12 || i > 14), // Free users see days 12-14 (12-14 days ago)
        isFreeDay: i >= 12 && i <= 14 // Days 12-14 are free days
      }
    })
  }, [isPro, selectedMonth, selectedYear])

  const isLocked = (dayIndex: number) => {
    if (isPro) return false
    // Free users can see days 12, 13, and 14 (12-14 days ago)
    return dayIndex < 12 || dayIndex > 14
  }

  // Fetch data for all days to show previews
  useEffect(() => {
    const fetchAllDaysData = async () => {
      const daysDataPromises = days.map(async (day) => {
        const start = new Date(day.date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + 1)

        try {
          const q = query(
            collection(db, 'content'),
            orderBy('publishedAt')
          )
          const snap = await getDocs(q)
          const docs: ContentDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentDoc[]
          
          // Filter by date after fetching since publishedAt is a string
          const filteredDocs = docs.filter(doc => {
            if (!doc.publishedAt) return false
            const docDate = new Date(doc.publishedAt)
            return docDate >= start && docDate < end
          })

          const aggregates = aggregateMentions(filteredDocs)
          const topTickers = aggregates.slice(0, 3).map(t => ({
            ticker: t.ticker,
            sentiment: (t.avgSentimentScore > 0.2 ? 'bullish' : t.avgSentimentScore < -0.2 ? 'bearish' : 'neutral') as Sentiment
          }))

          const totalMentions = aggregates.reduce((sum, t) => sum + t.count, 0)
          const bullishCount = aggregates.filter(t => t.avgSentimentScore > 0.2).reduce((sum, t) => sum + t.count, 0)
          const bearishCount = aggregates.filter(t => t.avgSentimentScore < -0.2).reduce((sum, t) => sum + t.count, 0)

          return {
            ...day,
            tickerCount: totalMentions,
            bullishPercent: totalMentions > 0 ? Math.round((bullishCount / totalMentions) * 100) : 0,
            bearishPercent: totalMentions > 0 ? Math.round((bearishCount / totalMentions) * 100) : 0,
            topTickers
          }
        } catch (e) {
          console.error(`Failed loading data for day ${day.dayIndex}`, e)
          return {
            ...day,
            tickerCount: 0,
            bullishPercent: 0,
            bearishPercent: 0,
            topTickers: []
          }
        }
      })

      const results = await Promise.all(daysDataPromises)
      setDaysData(results)
    }

    fetchAllDaysData()
  }, [days])



  const formatDate = (date: Date) => {
    // Use Eastern timezone for all date operations
    const today = new Date()
    const todayEastern = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const yesterdayEastern = new Date(todayEastern)
    yesterdayEastern.setDate(todayEastern.getDate() - 1)
    
    const dateEastern = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    
    if (dateEastern.toDateString() === todayEastern.toDateString()) {
      return 'Today'
    } else if (dateEastern.toDateString() === yesterdayEastern.toDateString()) {
      return 'Yesterday'
    } else {
      return dateEastern.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'America/New_York'
      })
    }
  }

  // Helper function to format date for URL in Eastern timezone
  const formatDateForUrl = (date: Date) => {
    // Get the date in Eastern timezone by using toLocaleDateString with timezone
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // en-CA gives YYYY-MM-DD format
    return dateStr
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex-shrink-0">Market Signals Timeline</h1>
          <div className="flex items-center gap-1 md:gap-2 lg:gap-3 ml-auto flex-shrink-0">
            <button
              onClick={() => setShowDateSelector(!showDateSelector)}
              className="text-xs px-1 md:px-2 lg:px-3 py-1 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500"
              title="Browse historical data"
            >
              <span className="hidden sm:inline">📅 Browse History</span>
              <span className="sm:hidden">📅</span>
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ims_pro', localStorage.getItem('ims_pro') === '1' ? '0' : '1')
                  window.location.reload()
                }
              }}
              className="text-xs px-1 md:px-2 lg:px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              title="Toggle Pro (for demo)"
            >
              <span className="hidden sm:inline">Pro ✓</span>
              <span className="sm:hidden">Pro</span>
            </button>
          </div>
        </div>

        {/* Date Selector Modal */}
        {showDateSelector && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Browse Historical Data</h3>
                <button
                  onClick={() => setShowDateSelector(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Month</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Current (Last 14 Days)</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedMonth('')
                      setSelectedYear(new Date().getFullYear())
                      setShowDateSelector(false)
                    }}
                    className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-200 hover:border-zinc-500"
                  >
                    Reset to Current
                  </button>
                  <button
                    onClick={() => setShowDateSelector(false)}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    View Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card View (for very small screens) */}
        <div className="md:hidden space-y-3 mb-8">
          {daysData.map((day) => (
            <div 
              key={day.dayIndex}
              className={`bg-zinc-950 border border-zinc-800 rounded-lg p-4 ${
                day.isFreeDay ? 'border-emerald-500 bg-emerald-950/20' : ''
              } ${selectedDayIndex === day.dayIndex ? 'bg-zinc-800/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                    className={`text-sm font-medium ${
                      selectedDayIndex === day.dayIndex ? 'text-white' : 'text-zinc-300'
                    } hover:text-white transition-colors`}
                  >
                    {formatDate(day.date)}
                  </button>
                  {day.isFreeDay && (
                    <span className="text-xs bg-emerald-900 text-emerald-200 px-2 py-1 rounded">Free Day</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {day.isLocked ? (
                    <span className="text-zinc-600">🔒</span>
                  ) : (
                    <span className="text-emerald-400">✓</span>
                  )}
                  {day.isLocked && (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                  {!day.isLocked && (
                    <Link
                      href={`/dashboard/day/${formatDateForUrl(day.date)}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-zinc-400 text-xs">Tickers</div>
                  <div className="text-zinc-300">{day.tickerCount > 0 ? day.tickerCount : '-'}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-xs">Sentiment</div>
                  {day.tickerCount > 0 ? (
                    <div className="flex gap-1">
                      <span className="text-emerald-400 text-xs">{day.bullishPercent}%</span>
                      <span className="text-zinc-500 text-xs">|</span>
                      <span className="text-red-400 text-xs">{day.bearishPercent}%</span>
                    </div>
                  ) : (
                    <div className="text-zinc-500">-</div>
                  )}
                </div>
                <div>
                  <div className="text-zinc-400 text-xs">Top Mentions</div>
                  {day.topTickers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {day.topTickers.slice(0, 2).map((ticker, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-1 py-1 rounded ${
                            ticker.sentiment === 'bullish' ? 'bg-emerald-900 text-emerald-200' :
                            ticker.sentiment === 'bearish' ? 'bg-red-900 text-red-200' :
                            'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {ticker.ticker}
                        </span>
                      ))}
                      {day.topTickers.length > 2 && (
                        <span className="text-xs text-zinc-400">+{day.topTickers.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-500">-</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Timeline Table */}
        <div className="hidden md:block bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] md:min-w-[600px]">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-2 md:px-3 lg:px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Date</th>
                  <th className="px-1 md:px-2 lg:px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">#</th>
                  <th className="px-1 md:px-2 lg:px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Sentiment</th>
                  <th className="px-2 md:px-3 lg:px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Top</th>
                  <th className="px-1 md:px-2 lg:px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {daysData.map((day) => (
                  <tr 
                    key={day.dayIndex} 
                    className={`hover:bg-zinc-900/50 transition-colors ${
                      day.isFreeDay ? 'bg-emerald-950/20 border-l-4 border-emerald-500' : ''
                    } ${selectedDayIndex === day.dayIndex ? 'bg-zinc-800/50' : ''}`}
                  >
                    <td className="px-2 md:px-3 lg:px-4 py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        {!day.isLocked ? (
                          <Link
                            href={`/dashboard/day/${formatDateForUrl(day.date)}`}
                            className={`text-sm font-medium ${
                              selectedDayIndex === day.dayIndex ? 'text-white' : 'text-zinc-300'
                            } hover:text-white transition-colors`}
                          >
                            {formatDate(day.date)}
                          </Link>
                        ) : (
                          <button
                            onClick={() => setSelectedDayIndex(day.dayIndex)}
                            className={`text-sm font-medium ${
                              selectedDayIndex === day.dayIndex ? 'text-white' : 'text-zinc-300'
                            } hover:text-white transition-colors`}
                          >
                            {formatDate(day.date)}
                          </button>
                        )}
                        {day.isFreeDay && (
                          <span className="text-xs bg-emerald-900 text-emerald-200 px-1 md:px-2 py-1 rounded">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-1 md:px-2 lg:px-4 py-4">
                      <span className="text-sm text-zinc-300">
                        {day.tickerCount > 0 ? day.tickerCount : '-'}
                      </span>
                    </td>
                    <td className="px-1 md:px-2 lg:px-4 py-4">
                      {day.tickerCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            <span className="text-xs text-emerald-400">{day.bullishPercent}%</span>
                            <span className="text-xs text-zinc-500">|</span>
                            <span className="text-xs text-red-400">{day.bearishPercent}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-2 md:px-3 lg:px-4 py-4">
                      {day.topTickers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {day.topTickers.slice(0, 1).map((ticker, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-1 md:px-2 py-1 rounded ${
                                ticker.sentiment === 'bullish' ? 'bg-emerald-900 text-emerald-200' :
                                ticker.sentiment === 'bearish' ? 'bg-red-900 text-red-200' :
                                'bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {ticker.ticker}
                            </span>
                          ))}
                          {day.topTickers.length > 1 && (
                            <span className="text-xs text-zinc-400">+{day.topTickers.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-1 md:px-2 lg:px-4 py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        {day.isLocked ? (
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-600">🔒</span>
                            <span className="text-xs text-zinc-400 hidden lg:inline">Locked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span className="text-xs text-emerald-400 hidden lg:inline">Unlocked</span>
                          </div>
                        )}
                        {day.isLocked && (
                          <button
                            onClick={() => setShowUpgrade(true)}
                            className="text-xs bg-blue-600 text-white px-1 md:px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            <span className="hidden sm:inline">Upgrade</span>
                            <span className="sm:hidden">↑</span>
                          </button>
                        )}
                        {!day.isLocked && (
                          <Link
                            href={`/dashboard/day/${formatDateForUrl(day.date)}`}
                            className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                          >
                            <span className="hidden sm:inline">View</span>
                            <span className="sm:hidden">→</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showUpgrade && (
          <UpgradeModal onClose={() => setShowUpgrade(false)} />
        )}

        {/* Content Preview for Selected Day */}
        {!isLocked(selectedDayIndex) && daysData[selectedDayIndex] && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Content Preview</h2>
              <Link
                href={`/dashboard/day/${formatDateForUrl(days[selectedDayIndex]?.date)}`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Full Details →
              </Link>
            </div>
            <ContentPreview dayData={daysData[selectedDayIndex]} />
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/trending"
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Trending Tickers</h3>
                <span className="text-blue-400">→</span>
              </div>
              <p className="text-zinc-400 text-sm">
                View all trending tickers across all available data with filtering and sorting options.
              </p>
            </Link>
            
            {!isLocked(selectedDayIndex) && (
              <Link
                href={`/dashboard/day/${formatDateForUrl(days[selectedDayIndex]?.date)}`}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Today&apos;s Details</h3>
                  <span className="text-blue-400">→</span>
                </div>
                <p className="text-zinc-400 text-sm">
                  View full details for {formatDate(days[selectedDayIndex]?.date)} including all content and mentions.
                </p>
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function sentimentToScore(s: Sentiment): number {
  if (s === 'bullish') return 1
  if (s === 'bearish') return -1
  return 0
}

function aggregateMentions(docs: ContentDoc[]): Array<{ ticker: string; count: number; avgSentimentScore: number }> {
  const map = new Map<string, { sum: number; count: number }>()
  for (const doc of docs) {
    const mentions = doc.extractedMentions || []
    for (const m of mentions) {
      const prev = map.get(m.ticker) || { sum: 0, count: 0 }
      prev.sum += sentimentToScore(m.sentiment)
      prev.count += 1
      map.set(m.ticker, prev)
    }
  }
  const arr = Array.from(map.entries()).map(([ticker, v]) => ({
    ticker,
    count: v.count,
    avgSentimentScore: v.count ? v.sum / v.count : 0,
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

function ContentPreview({ dayData }: { dayData: DayData }) {
  const [content, setContent] = useState<ContentDoc[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchContent = async () => {
      const start = new Date(dayData.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)

      try {
        const q = query(
          collection(db, 'content'),
          orderBy('publishedAt')
        )
        const snap = await getDocs(q)
        const docs: ContentDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentDoc[]
        
        // Filter by date
        const filteredDocs = docs.filter(doc => {
          if (!doc.publishedAt) return false
          
          let docDate: Date
          if (doc.publishedAt.includes(',')) {
            docDate = new Date(doc.publishedAt)
          } else if (doc.publishedAt.includes('-')) {
            const [year, month, day] = doc.publishedAt.split('-').map(Number)
            docDate = new Date(year, month - 1, day)
          } else {
            docDate = new Date(doc.publishedAt)
          }
          
          return docDate >= start && docDate < end
        })
        
        setContent(filteredDocs)
      } catch (e) {
        console.error('Failed loading content preview', e)
        setContent([])
      }
    }

    fetchContent()
  }, [dayData.date])

  if (content.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        No content available for this day
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content.slice(0, 2).map((item) => (
        <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {item.episodeTitle || 'Untitled Episode'}
              </h3>
              <p className="text-zinc-400 text-sm">
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
            <div className="mb-3">
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
                        <div key={idx} className="text-sm bg-zinc-900 p-2 rounded">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-zinc-300 text-xs">{timestamp.description}</p>
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
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
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
  )
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
                  <p className="text-zinc-300 mb-4">
            You&apos;re viewing data from 14 days ago. Pro members are seeing today&apos;s market-moving calls right now — don&apos;t trade in the past.
          </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-200"
          >
            Maybe later
          </button>
          <Link
            href="#"
            className="px-4 py-2 rounded-md bg-white text-black font-semibold"
          >
            Upgrade — $49/mo
          </Link>
        </div>
      </div>
    </div>
  )
}



