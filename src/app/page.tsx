'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Hear What Top Finance Influencers Are Saying About Stocks
              </h1>
              <p className="text-lg md:text-2xl text-zinc-300 mt-6">
                We scan 100+ finance voices to find the day’s most-mentioned stocks — and let you hear the exact clips.
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Updated daily. Free users see signals from 14 days ago.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard?d=13"
                  className="px-6 py-3 rounded-md bg-white text-black font-semibold hover:bg-zinc-200 transition"
                >
                  Show Me Today’s Signals
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Start Free Trial
                </Link>
                                        <span className="text-zinc-400 self-center text-sm">
                          Bloomberg $20K/yr → IMS Pro $49/mo (99.75% cheaper)
                        </span>
              </div>
              <div className="mt-6 text-zinc-400 text-sm">
                Early access spots are limited. Join now to lock in pricing.
              </div>
            </div>
            <div>
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <StatCard title="Sources scanned" value="100+" />
          <StatCard title="Mentions tracked/day" value="1,000+" />
          <StatCard title="Update frequency" value="Updated Daily" />
        </div>
      </section>

      <SampleUnlockedDay />

      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-zinc-300">
          <TrustItem label="Professionals use daily" />
          <TrustItem label="Sentiment analysis & insights" />
          <TrustItem label="Ticker + sentiment extraction" />
        </div>
      </section>
    </main>
  )
}

function HeroMockup() {
  const days = Array.from({ length: 14 }, (_, i) => 13 - i)
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {days.map((d, idx) => (
          <div
            key={d}
            className={`flex-1 min-w-24 px-3 py-4 rounded-lg text-center border ${idx === 0 ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-900 bg-zinc-950 opacity-50'} `}
          >
            <div className="text-xs text-zinc-400">{d === 0 ? 'Today' : `${d}d ago`}</div>
            <div className="mt-2 h-14 flex items-center justify-center">
              {idx === 0 ? (
                <span className="text-emerald-400 font-semibold">Unlocked</span>
              ) : (
                <span className="text-zinc-600">🔒</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {["NVDA","AAPL","TSLA"].map((t, i) => (
          <div key={t} className={`rounded-md p-3 bg-zinc-900 border ${i===0?'border-emerald-600':'border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t}</span>
              <span className={`text-xs ${i===0?'text-emerald-400':'text-zinc-400'}`}>{i===0?'+bullish':'neutral'}</span>
            </div>
            <div className="mt-2 h-2 bg-zinc-800 rounded">
              <div className={`h-2 rounded ${i===0?'bg-emerald-500 w-4/5':'bg-zinc-600 w-2/5'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-6 bg-zinc-950">
      <div className="text-zinc-400 text-sm">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {sub ? <div className="text-xs text-zinc-500 mt-1">{sub}</div> : null}
    </div>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-5 bg-zinc-950 text-center">
      <div className="font-medium">{label}</div>
    </div>
  )
}

function SampleUnlockedDay() {
  return (
    <section className="py-14 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-xl font-semibold mb-4">Today vs Free Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UnlockedPreview />
          <LockedPreview label="Today" />
          <LockedPreview label="1d ago" />
        </div>
      </div>
    </section>
  )
}

function UnlockedPreview() {
  // Simple static preview; live data is on the dashboard
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs text-zinc-400 mb-2">14d ago — Unlocked</div>
      {[{t:'NVDA', s:'bullish'},{t:'AAPL', s:'neutral'},{t:'TSLA', s:'bearish'}].map((x) => (
        <div key={x.t} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{x.t}</div>
            <span className={`text-xs ${x.s==='bullish'?'text-emerald-400':x.s==='bearish'?'text-red-400':'text-zinc-400'}`}>{x.s}</span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded"><div className="h-2 bg-emerald-500 w-3/5 rounded" /></div>
          <button className="mt-2 text-xs underline text-zinc-300">View details</button>
        </div>
      ))}
    </div>
  )
}

function LockedPreview({ label }: { label: string }) {
  return (
    <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-4 overflow-hidden group">
      <div className="text-xs text-zinc-400 mb-2">{label} — Locked</div>
      {[1,2,3].map((i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between">
            <div className="font-semibold">TICKER</div>
            <span className="text-xs text-zinc-400">neutral</span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded"><div className="h-2 bg-zinc-700 w-2/5 rounded" /></div>
          <button className="mt-2 text-xs underline text-zinc-400">View details</button>
        </div>
      ))}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-sm text-zinc-300">Upgrade to See It Now</div>
        </div>
      </div>
    </div>
  )
}
