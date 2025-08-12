'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="py-12 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold leading-tight">
                Hear What Top Finance Influencers Are Saying About Stocks
              </h1>
              <p className="text-base md:text-lg lg:text-2xl text-zinc-300 mt-4 md:mt-6">
                We scan 100+ finance voices to find the day&apos;s most-mentioned stocks — and let you hear the exact clips.
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Updated daily. Free users see signals from 14 days ago.
              </p>
              <div className="mt-6 md:mt-8 space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4">
                <Link
                  href="/dashboard?d=13"
                  className="block w-full md:w-auto px-6 py-3 rounded-md bg-white text-black font-semibold hover:bg-zinc-200 transition text-center"
                >
                  Show Me Today&apos;s Signals
                </Link>
                <Link
                  href="/signup"
                  className="block w-full md:w-auto px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-center"
                >
                  Start Free Trial
                </Link>
                <span className="block md:inline text-zinc-400 text-center md:self-center text-sm">
                  Bloomberg $20K/yr → IMS Pro $49/mo (99.75% cheaper)
                </span>
              </div>
              <div className="mt-4 md:mt-6 text-zinc-400 text-sm text-center md:text-left">
                Early access spots are limited. Join now to lock in pricing.
              </div>
            </div>
            <div className="hidden md:block">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <StatCard title="Sources scanned" value="100+" />
          <StatCard title="Mentions tracked/day" value="1,000+" />
          <StatCard title="Update frequency" value="Updated Daily" />
        </div>
      </section>

      <SampleUnlockedDay />
      <TestimonialsSection />

      <section className="py-12 md:py-16 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-300">
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
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-zinc-400 text-sm md:text-base">{title}</div>
      {sub && <div className="text-zinc-500 text-xs">{sub}</div>}
    </div>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-lg font-semibold mb-2">✓ {label}</div>
    </div>
  )
}

function SampleUnlockedDay() {
  return (
    <section className="py-12 md:py-16 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">See What You&apos;re Missing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <UnlockedPreview />
          <LockedPreview label="Yesterday" />
          <LockedPreview label="2 days ago" />
        </div>
      </div>
    </section>
  )
}

function UnlockedPreview() {
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

function TestimonialsSection() {
  return (
    <section className="py-12 md:py-16 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <TestimonialCard
            name="Alex Chen"
            title="Day Trader"
            quote="I used to spend hours scrolling through YouTube trying to find what influencers were saying about stocks. Now I get it all in one place with sentiment analysis. Game changer!"
            rating={5}
          />
          <TestimonialCard
            name="Sarah Williams"
            title="Portfolio Manager"
            quote="The context and conviction levels are what make this different. I can see not just what was mentioned, but how confident the analyst is. That's priceless."
            rating={5}
          />
          <TestimonialCard
            name="Mike Rodriguez"
            title="Retail Investor"
            quote="Finally, I can hear the actual clips instead of just reading ticker lists. The notable timestamps save me so much time. Worth every penny."
            rating={5}
          />
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ name, title, quote, rating }: { name: string; title: string; quote: string; rating: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex items-center mb-4">
        {[...Array(rating)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
      </div>
      <p className="text-lg text-zinc-300 mb-4 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-zinc-400">{title}</div>
        </div>
        <div className="text-2xl text-zinc-700">&rdquo;</div>
      </div>
    </div>
  )
}
