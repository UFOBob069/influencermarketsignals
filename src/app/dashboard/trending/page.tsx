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
    date: string
  }>
}

export default function TrendingPage() {
  const { isPro } = useAuth()
  const [tickers, setTickers] = useState<TickerAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'count' | 'sentiment'>('count')
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all')
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d' | '90d' | 'all'>('7d')

  useEffect(() => {
    const fetchAllTickers = async () => {
      setLoading(true)
      try {
        const q = query(
          collection(db, 'content'),
          orderBy('publishedAt')
        )
        const snap = await getDocs(q)
        const docs: ContentDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentDoc[]
        
        // Filter content based on user access level and time frame
        const today = new Date()
        const filteredDocs = docs.filter(doc => {
          if (!doc.publishedAt) return false
          const docDate = new Date(doc.publishedAt)
          const diffTime = today.getTime() - docDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          // First filter by user access level
          let hasAccess = false
          if (isPro) {
            hasAccess = true
          } else {
            // Free users can see days 12-14 and 90+ days old
            hasAccess = (diffDays >= 12 && diffDays <= 14) || diffDays > 90
          }
          
          if (!hasAccess) return false
          
          // Then filter by time frame
          switch (timeFrame) {
            case '7d':
              return diffDays <= 7
            case '30d':
              return diffDays <= 30
            case '90d':
              return diffDays <= 90
            case 'all':
              return true
            default:
              return true
          }
        })
        
        const aggregates = aggregateMentions(filteredDocs)
        setTickers(aggregates)
      } catch (e) {
        console.error('Failed loading trending data', e)
        setTickers([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllTickers()
  }, [isPro, timeFrame])

  const filteredAndSortedTickers = tickers
    .filter(ticker => {
      if (filterSentiment === 'all') return true
      const avgSentiment = ticker.avgSentimentScore
      if (filterSentiment === 'bullish') return avgSentiment > 0.2
      if (filterSentiment === 'bearish') return avgSentiment < -0.2
      if (filterSentiment === 'neutral') return avgSentiment >= -0.2 && avgSentiment <= 0.2
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'count') return b.count - a.count
      if (sortBy === 'sentiment') return Math.abs(b.avgSentimentScore) - Math.abs(a.avgSentimentScore)
      return 0
    })

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading trending tickers...</div>
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
            <h1 className="text-3xl font-bold">Trending Tickers</h1>
            <p className="text-zinc-400 mt-1">
              {filteredAndSortedTickers.length} tickers mentioned in the last {
                timeFrame === '7d' ? '7 days' :
                timeFrame === '30d' ? '30 days' :
                timeFrame === '90d' ? '90 days' :
                'all time'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">
              {isPro ? 'Pro Access' : 'Free Access'}
            </div>
            {!isPro && (
              <div className="text-xs bg-amber-900 text-amber-200 px-2 py-1 rounded mt-1">
                Limited Data
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Time frame:</label>
              <select 
                value={timeFrame} 
                onChange={(e) => setTimeFrame(e.target.value as '7d' | '30d' | '90d' | 'all')}
                className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'count' | 'sentiment')}
                className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm"
              >
                <option value="count">Most Mentioned</option>
                <option value="sentiment">Strongest Sentiment</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Filter sentiment:</label>
              <select 
                value={filterSentiment} 
                onChange={(e) => setFilterSentiment(e.target.value as 'all' | 'bullish' | 'bearish' | 'neutral')}
                className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Sentiments</option>
                <option value="bullish">Bullish Only</option>
                <option value="bearish">Bearish Only</option>
                <option value="neutral">Neutral Only</option>
              </select>
            </div>
            <div className="text-sm text-zinc-500">
              Showing {filteredAndSortedTickers.length} of {tickers.length} tickers
            </div>
          </div>
        </div>

        {/* Trending Tickers Grid */}
        {filteredAndSortedTickers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTickers.map((ticker) => (
              <div key={ticker.ticker} className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold">{ticker.ticker}</div>
                  <SentimentBadge score={ticker.avgSentimentScore} />
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-zinc-400 mb-2">{ticker.count} total mentions</div>
                  {(() => {
                    const bullish = ticker.mentions.filter(m => m.sentiment === 'bullish').length
                    const bearish = ticker.mentions.filter(m => m.sentiment === 'bearish').length
                    const neutral = ticker.mentions.filter(m => m.sentiment === 'neutral').length
                    const total = Math.max(1, bullish + bearish + neutral)
                    const bullPct = (bullish / total) * 100
                    const neutralPct = (neutral / total) * 100
                    const bearPct = (bearish / total) * 100
                    return (
                      <div className="h-3 bg-zinc-800 rounded overflow-hidden flex">
                        <div className="h-3 bg-emerald-500" style={{ width: `${bullPct}%` }} />
                        <div className="h-3 bg-zinc-600" style={{ width: `${neutralPct}%` }} />
                        <div className="h-3 bg-red-500" style={{ width: `${bearPct}%` }} />
                      </div>
                    )
                  })()}
                </div>

                {ticker.mentions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-3">Recent Mentions</h4>
                    <div className="space-y-2">
                      {ticker.mentions.slice(0, 3).map((mention, idx) => (
                        <div key={idx} className="text-xs bg-zinc-900 p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-zinc-400 font-medium">{mention.influencer}</span>
                            <span className={`text-xs ${
                              mention.sentiment === 'bullish' ? 'text-emerald-400' :
                              mention.sentiment === 'bearish' ? 'text-red-400' :
                              'text-zinc-400'
                            }`}>
                              {mention.sentiment}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-xs mb-1 truncate">{mention.episode}</p>
                          <p className="text-zinc-600 text-xs">{mention.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <Link 
                    href={`/dashboard/ticker/${ticker.ticker}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View all mentions →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-2">No tickers found</div>
            <p className="text-sm text-zinc-500">
              Try adjusting your filters or check back later for new data.
            </p>
          </div>
        )}

        {!isPro && (
          <div className="mt-8 text-center">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-2">Get Full Access</h3>
              <p className="text-zinc-400 mb-4">
                Pro members see trending tickers from all 14 days of data, including today&apos;s real-time signals.
              </p>
              <button 
                onClick={() => {
                  localStorage.setItem('ims_pro', '1')
                  window.location.reload()
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Upgrade to Pro - $49/month
              </button>
            </div>
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
      date: string
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
        context: m.context,
        date: doc.publishedAt || 'Unknown date'
      })
      map.set(m.ticker, prev)
    }
  }
  
  const arr: TickerAggregate[] = Array.from(map.entries()).map(([ticker, v]) => ({
    ticker,
    count: v.count,
    avgSentimentScore: v.count ? v.sum / v.count : 0,
    mentions: v.mentions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }))
  
  return arr
}

function SentimentBadge({ score }: { score: number }) {
  const label = score > 0.2 ? 'bullish' : score < -0.2 ? 'bearish' : 'neutral'
  const cls =
    label === 'bullish'
      ? 'text-emerald-400 bg-emerald-900'
      : label === 'bearish'
      ? 'text-red-400 bg-red-900'
      : 'text-zinc-400 bg-zinc-700'
  return <span className={`text-xs px-2 py-1 rounded font-medium ${cls}`}>{label}</span>
}
