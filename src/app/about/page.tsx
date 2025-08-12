'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AboutPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Simulate form submission - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitStatus('success')
      setContactForm({ name: '', email: '', company: '', message: '' })
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 md:py-28 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Why We Built This
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-4xl mx-auto">
              Because scanning ticker lists is like reading a restaurant menu without tasting the food. 
              You miss the context, the nuance, and the real insights that drive markets.
            </p>
          </div>

          {/* Value Proposition Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                The Problem with Traditional Market Data
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">✗</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ticker Lists Are Meaningless</h3>
                                         <p className="text-zinc-400">Seeing &quot;NVDA +5%&quot; tells you nothing about why it moved, what the analyst really thinks, or if you should care.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">✗</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Context or Nuance</h3>
                    <p className="text-zinc-400">You miss the tone, the reasoning, the caveats, and the real conviction behind each mention.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">✗</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hours of Manual Work</h3>
                    <p className="text-zinc-400">Scrolling through hundreds of hours of content to find the relevant mentions is impossible for most traders.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Solution: Hear the Alpha
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-emerald-400 text-2xl">✓</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Context-Rich Insights</h3>
                    <p className="text-zinc-400">Hear exactly what was said, how it was said, and why it matters for your trading decisions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-emerald-400 text-2xl">✓</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Sentiment + Conviction</h3>
                    <p className="text-zinc-400">Understand not just what was mentioned, but how bullish/bearish and how confident the analyst is.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-emerald-400 text-2xl">✓</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Time-Saving Intelligence</h3>
                    <p className="text-zinc-400">Get the insights from 100+ hours of content in minutes, not days.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">How We Process 100+ Hours Daily</h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              Our AI doesn&apos;t just scan for mentions—it understands context, sentiment, and conviction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-zinc-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Content Ingestion</h3>
              <p className="text-zinc-400">
                We automatically ingest content from 100+ top finance influencers across YouTube, podcasts, and social media.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-zinc-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">2. AI Analysis</h3>
              <p className="text-zinc-400">
                Our GPT-4 powered system extracts tickers, analyzes sentiment, identifies key moments, and understands context.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-zinc-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Real-Time Delivery</h3>
              <p className="text-zinc-400">
                You get actionable insights with direct links to the source content, delivered daily to your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Listening Matters */}
      <section className="py-20 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Listening Beats Scanning</h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              The difference between knowing what was mentioned and understanding why it matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-red-400">Traditional Approach</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 text-lg">•</span>
                  <p className="text-zinc-400">See &quot;NVDA mentioned&quot; - no context</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 text-lg">•</span>
                  <p className="text-zinc-400">Miss the analyst&apos;s conviction level</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 text-lg">•</span>
                  <p className="text-zinc-400">No understanding of reasoning</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 text-lg">•</span>
                  <p className="text-zinc-400">Can&apos;t assess credibility</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-emerald-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-emerald-400">IMS Approach</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 text-lg">•</span>
                  <p className="text-zinc-400">Hear &quot;NVDA is my highest conviction pick&quot;</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 text-lg">•</span>
                  <p className="text-zinc-400">Understand the bull case and risks</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 text-lg">•</span>
                  <p className="text-zinc-400">Assess analyst&apos;s track record</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 text-lg">•</span>
                  <p className="text-zinc-400">Make informed trading decisions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Trade with Context?
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Join thousands of traders who never miss the real insights behind market moves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors text-lg"
            >
              See Sample Data
            </Link>
          </div>
          <p className="text-zinc-400 mt-4">
            7-day free trial • Cancel anytime • No credit card required
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-xl text-zinc-300">
              Have questions? Want to suggest content sources? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Why Contact Us?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">💡</span>
                  <div>
                    <h4 className="font-semibold mb-1">Feature Requests</h4>
                    <p className="text-zinc-400 text-sm">Tell us what would make IMS even better for your trading.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">🎯</span>
                  <div>
                    <h4 className="font-semibold mb-1">Content Suggestions</h4>
                    <p className="text-zinc-400 text-sm">Know great finance influencers we should be monitoring?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">🤝</span>
                  <div>
                    <h4 className="font-semibold mb-1">Partnerships</h4>
                    <p className="text-zinc-400 text-sm">Interested in integrating IMS into your platform?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">💬</span>
                  <div>
                    <h4 className="font-semibold mb-1">General Support</h4>
                    <p className="text-zinc-400 text-sm">Questions about your account or the platform.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Company (Optional)</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                    required
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className="p-3 bg-emerald-900 text-emerald-200 rounded-md text-sm">
                    ✅ Message sent! We&apos;ll get back to you within 24 hours.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-3 bg-red-900 text-red-200 rounded-md text-sm">
                    ❌ Error sending message. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-12 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-300">Important Disclaimer</h3>
            <div className="text-sm text-zinc-400 space-y-2">
              <p>
                <strong>Not Investment Advice:</strong> The information provided on Influencer Market Signals is for informational and educational purposes only. It is not intended to be, and should not be construed as, investment advice, financial advice, trading advice, or any other type of advice.
              </p>
              <p>
                <strong>Do Your Own Research:</strong> All trading and investment decisions should be based on your own research, analysis, and judgment. We strongly encourage you to consult with qualified financial advisors, accountants, and legal professionals before making any investment decisions.
              </p>
              <p>
                <strong>Past Performance:</strong> Past performance of any mentioned stocks, strategies, or influencers does not guarantee future results. The market can be unpredictable and all investments carry risk of loss.
              </p>
              <p>
                <strong>No Guarantees:</strong> Influencer Market Signals makes no representations or warranties regarding the accuracy, completeness, or reliability of any information provided. We are not responsible for any losses or damages that may result from the use of this information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
