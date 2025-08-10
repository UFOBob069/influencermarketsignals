'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)

    try {
      // Create the user account with Firebase Auth
      const auth = getAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // User account created successfully
      console.log('User created:', userCredential.user.email)
      
      // Redirect to pricing page to complete the signup flow
      router.push('/pricing')
    } catch (error: unknown) {
      console.error('Signup error:', error)
      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Get Real-Time Market Signals
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-3xl mx-auto">
              Join thousands of traders who get daily insights from top finance influencers. 
              Never miss a market-moving mention again.
            </p>
            
            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold mb-2">Same-Day Access</h3>
                <p className="text-zinc-400">Get market signals the same day influencers mention them</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold mb-2">Sentiment Analysis</h3>
                <p className="text-zinc-400">Bullish, bearish, or neutral - know the sentiment instantly</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold mb-2">100+ Sources</h3>
                <p className="text-zinc-400">We scan the top finance podcasts and YouTube channels daily</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Form */}
      <div className="max-w-md mx-auto px-4 pb-24">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
                     <h2 className="text-2xl font-bold text-center mb-2">Start Your Free Trial</h2>
           <p className="text-center text-zinc-400 mb-6">7 days free, then $49/month</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

                         <button
               type="submit"
               disabled={loading}
               className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? 'Creating Account...' : 'Start 7-Day Free Trial'}
             </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-950 text-zinc-400">Or continue with</span>
              </div>
            </div>

                         <button
               onClick={async () => {
                 setError('')
                 setLoading(true)
                 try {
                   await signInWithGoogle()
                   // Google sign-in creates the account automatically
                   router.push('/pricing')
                                   } catch (error: unknown) {
                    console.error('Google sign-in error:', error)
                    const firebaseError = error as { code?: string }
                    if (firebaseError.code === 'auth/popup-closed-by-user') {
                      setError('Sign-in was cancelled. Please try again.')
                    } else {
                      setError('Google sign-in failed. Please try again.')
                    }
                  } finally {
                   setLoading(false)
                 }
               }}
               className="mt-4 w-full py-3 px-4 bg-zinc-900 text-white font-semibold rounded-md border border-zinc-700 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
             >
               Continue with Google
             </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{' '}
              <Link href="/signin" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>

                     {/* Trust Indicators */}
           <div className="mt-8 pt-6 border-t border-zinc-800">
             <div className="text-center space-y-2">
               <p className="text-xs text-zinc-500">✓ 7-day free trial, no credit card required</p>
               <p className="text-xs text-zinc-500">✓ Cancel anytime</p>
               <p className="text-xs text-zinc-500">✓ No setup fees</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
