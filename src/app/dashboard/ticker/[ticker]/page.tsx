'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import Link from 'next/link'

type Sentiment = 'bullish' | 'bearish' | 'neutral'

interface ContentDoc {
  id: string
  createdAt: string
  influencerName?: string
  platform?: string
  sourceUrl?: string
  videoId?: string
  extractedMentions?: { ticker: string; sentiment: Sentiment; timestamps?: number[] }[]
  highlights?: { startSec: number; endSec?: number; text: string }[]
}

export default function TickerPage() {
  const params = useParams<{ ticker: string }>()
  const ticker = (params?.ticker || '').toUpperCase()
  const [docs, setDocs] = useState<ContentDoc[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const isPro = useMemo(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ims_pro') === '1') return true
    return false
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Get last 14 days of content; client filters by mentions of ticker
        const since = new Date()
        since.setDate(since.getDate() - 13)
        const q = query(
          collection(db, 'content'),
          where('createdAt', '>=', since.toISOString()),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        const rows = (
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentDoc[]
        ).filter((r) => (r.extractedMentions || []).some((m: { ticker?: string }) => (m.ticker || '').toUpperCase() === ticker))
        setDocs(rows)
      } catch (e) {
        console.error('Failed loading ticker docs', e)
        setDocs([])
      } finally {
        setLoading(false)
      }
    }
    if (ticker) load()
  }, [ticker])

  const freeOnlyOldest = useMemo(() => {
    if (isPro) return docs
    // Free: only show data exactly 14 days ago (index 13). We approximate by picking the oldest date in range
    const sorted = [...docs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return sorted.length ? [sorted[0]] : []
  }, [docs, isPro])

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{ticker}</h1>
          <Link href="/dashboard" className="text-zinc-400 hover:text-white">Back</Link>
        </div>

        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : (
          <div className="space-y-6">
            {freeOnlyOldest.map((d) => (
              <div key={d.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{new Date(d.createdAt).toDateString()}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-zinc-200">
                    {d.influencerName || 'Influencer'} {d.platform ? `• ${d.platform}` : ''}
                  </div>
                  {d.sourceUrl ? (
                    <a className="text-xs underline text-zinc-400" href={d.sourceUrl} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  ) : null}
                </div>
                <div className="mt-3">
                  <div className="text-sm text-zinc-400 mb-2">Snippet Highlights</div>
                  <div className="grid gap-2">
                    {(d.highlights || []).slice(0, 4).map((h, i) => (
                      <div key={i} className="rounded-md bg-zinc-900 p-3 border border-zinc-800">
                        <div className="text-xs text-zinc-400">{formatTime(h.startSec)}</div>
                        <div className="mt-1 text-zinc-200 text-sm">{h.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {!isPro && docs.length > 1 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-zinc-300">
                  Upgrade to see all mentions for {ticker} across the last 14 days, including today’s live updates.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function formatTime(sec?: number) {
  if (!sec && sec !== 0) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}



