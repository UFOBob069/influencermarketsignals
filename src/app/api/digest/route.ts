import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, startAt, endBefore } from 'firebase/firestore'

type Sentiment = 'bullish' | 'bearish' | 'neutral'
interface Mention { ticker: string; sentiment: Sentiment }
interface ContentRow { id: string; extractedMentions?: Mention[]; sourceUrl?: string; highlights?: { text: string }[] }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const isPro = url.searchParams.get('pro') === '1'

    const now = new Date()
    const dayIndex = isPro ? 0 : 13
    const day = new Date(now)
    day.setDate(now.getDate() - dayIndex)
    const start = new Date(day); start.setHours(0,0,0,0)
    const end = new Date(start); end.setDate(start.getDate()+1)

    const q = query(
      collection(db, 'content'),
      orderBy('createdAt'),
      startAt(start.toISOString()),
      endBefore(end.toISOString())
    )

    const snap = await getDocs(q)
    const items: ContentRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as ContentRow[]

    // Aggregate mentions
    const counts = new Map<string, { sum: number; count: number }>()
    const pick = (s: string) => s === 'bullish' ? 1 : s === 'bearish' ? -1 : 0
    for (const it of items) {
      const mentions = it.extractedMentions || []
      for (const m of mentions) {
        const cur = counts.get(m.ticker) || { sum: 0, count: 0 }
        cur.sum += pick(m.sentiment)
        cur.count += 1
        counts.set(m.ticker, cur)
      }
    }
    const top = Array.from(counts.entries())
      .map(([ticker, v]) => ({ ticker, count: v.count, score: v.sum / (v.count||1) }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5)

    const highlights = items
      .flatMap((it) => (it.highlights || []).slice(0, 1).map((h) => ({
        text: h.text,
        source: it.sourceUrl || null,
      })))
      .slice(0, 2)

    return NextResponse.json({
      date: start.toISOString().slice(0,10),
      top5: top,
      highlights,
      link: '/dashboard',
    })
  } catch (e) {
    const err = e as Error
    console.error('digest error', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}



