'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      alert('Please sign in to subscribe')
      return
    }

    setLoading(true)
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.uid,
          planType: planType,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js')
      const stripeInstance = await stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      
      if (stripeInstance) {
        const { error } = await stripeInstance.redirectToCheckout({ sessionId })
        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-zinc-300 mb-12 max-w-3xl mx-auto">
            Get access to real-time market signals from top finance influencers. 
            Start with a free trial, then choose the plan that works for you.
          </p>
        </div>

                 {/* Bloomberg Anchor Pricing */}
         <div className="text-center mb-12">
           <div className="inline-block bg-zinc-900 border border-zinc-700 rounded-lg px-6 py-4">
             <p className="text-zinc-400 text-sm mb-2">Bloomberg Terminal</p>
             <p className="text-2xl font-bold text-zinc-300">$20,000/year</p>
             <p className="text-xs text-zinc-500 mt-1">For same-day market intelligence</p>
           </div>
         </div>

         {/* Pricing Cards */}
         <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {/* Free Plan */}
           <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
             <div className="text-center">
               <h3 className="text-2xl font-bold mb-2">Free</h3>
               <div className="text-4xl font-bold mb-4">$0</div>
               <p className="text-zinc-400 mb-6">Perfect for getting started</p>
             </div>
             
             <ul className="space-y-3 mb-8">
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Access to 12-14 day old data
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Basic ticker mentions
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Sentiment analysis
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Notable moments
               </li>
               <li className="flex items-center text-zinc-500">
                 <span className="text-zinc-500 mr-2">✗</span>
                 Real-time updates
               </li>
               <li className="flex items-center text-zinc-500">
                 <span className="text-zinc-500 mr-2">✗</span>
                 Full 14-day access
               </li>
             </ul>
             
             <Link
               href="/dashboard"
               className="block w-full py-3 px-4 bg-zinc-800 text-white font-semibold rounded-md hover:bg-zinc-700 text-center"
             >
               Get Started Free
             </Link>
           </div>

           {/* Pro Monthly */}
           <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-8">
             <div className="text-center">
               <h3 className="text-2xl font-bold mb-2">Pro Monthly</h3>
               <div className="text-4xl font-bold mb-2">$49</div>
               <div className="text-zinc-400 mb-2">per month</div>
               <div className="text-sm text-zinc-500 mb-6">99.75% cheaper than Bloomberg</div>
             </div>
             
             <ul className="space-y-3 mb-8">
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Everything in Free
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Real-time market signals
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Full 14-day access
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Same-day influencer mentions
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Advanced filtering
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Priority support
               </li>
             </ul>
             
             <button
               onClick={() => handleSubscribe('monthly')}
               disabled={loading}
               className="w-full py-3 px-4 bg-zinc-700 text-white font-semibold rounded-md hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
             </button>
             
             <p className="text-xs text-zinc-500 text-center mt-3">
               Cancel anytime. No commitment required.
             </p>
           </div>

           {/* Pro Annual */}
           <div className="bg-zinc-950 border-2 border-blue-500 rounded-lg p-8 relative">
             <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
               <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                 Best Value
               </span>
             </div>
             
             <div className="text-center">
               <h3 className="text-2xl font-bold mb-2">Pro Annual</h3>
               <div className="text-4xl font-bold mb-2">$490</div>
               <div className="text-zinc-400 mb-2">per year</div>
               <div className="text-sm text-green-400 mb-2">Save $98/year (17% off)</div>
               <div className="text-xs text-zinc-500 mb-6">One good trade pays for the year</div>
             </div>
             
             <ul className="space-y-3 mb-8">
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Everything in Monthly
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Real-time market signals
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Full 14-day access
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Same-day influencer mentions
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Advanced filtering
               </li>
               <li className="flex items-center">
                 <span className="text-green-400 mr-2">✓</span>
                 Priority support
               </li>
             </ul>
             
             <button
               onClick={() => handleSubscribe('annual')}
               disabled={loading}
               className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
             </button>
             
             <p className="text-xs text-zinc-500 text-center mt-3">
               Cancel anytime. No commitment required.
             </p>
           </div>
         </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">What&apos;s included in the free trial?</h3>
              <p className="text-zinc-400">Your 7-day free trial includes full Pro access to all features, including real-time market signals and complete 14-day data access.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-zinc-400">Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">How often is data updated?</h3>
              <p className="text-zinc-400">We scan and process new content daily, typically within 2-4 hours of publication. Pro users get same-day access to all new signals.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">What sources do you monitor?</h3>
              <p className="text-zinc-400">We monitor 100+ top finance influencers across YouTube, podcasts, and social media, including major financial news outlets and popular trading channels.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-zinc-300 mb-8">
            Join thousands of traders who never miss a market-moving mention.
          </p>
                     <button
             onClick={() => handleSubscribe('annual')}
             disabled={loading}
             className="py-4 px-8 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed text-lg"
           >
             {loading ? 'Processing...' : 'Start Your Free Trial'}
           </button>
        </div>
      </div>
    </div>
  )
}
