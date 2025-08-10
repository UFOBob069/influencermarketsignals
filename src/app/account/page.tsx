'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'

interface UserProfile {
  firstName?: string
  lastName?: string
  website?: string
  twitter?: string
  linkedin?: string
  bio?: string
  company?: string
  role?: string
}

export default function AccountPage() {
  const { user, isPro } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const userDoc = doc(db, 'users', user.uid)
        const userSnapshot = await getDoc(userDoc)
        
        if (userSnapshot.exists()) {
          const data = userSnapshot.data()
          setProfile({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            website: data.website || '',
            twitter: data.twitter || '',
            linkedin: data.linkedin || '',
            bio: data.bio || '',
            company: data.company || '',
            role: data.role || ''
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage('')
    
    try {
      const userDoc = doc(db, 'users', user.uid)
      await updateDoc(userDoc, {
        ...profile,
        updatedAt: new Date().toISOString()
      })
      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage('Error updating profile. Please try again.')
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      // In a real implementation, you would get the customer ID from your user's subscription data
      // For now, we'll show a placeholder
      alert('This would redirect to Stripe Customer Portal to manage subscription')
      
      // Example implementation:
      // const response = await fetch('/api/stripe/create-portal-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ customerId: userSubscription.customerId }),
      // })
      // const { url } = await response.json()
      // window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Failed to open subscription management. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link href="/signin" className="text-blue-400 hover:text-blue-300">
            Sign in to access your account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-zinc-400">Manage your profile and subscription</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="md:col-span-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profile.company || ''}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your company"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your role"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={profile.twitter || ''}
                    onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={profile.linkedin || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm mb-4 ${
                  message.includes('successfully') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400">Plan</label>
                  <div className="flex items-center">
                    <span className={`text-sm px-2 py-1 rounded ${
                      isPro ? 'bg-blue-900 text-blue-200' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {isPro ? 'Pro' : 'Free'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400">Member Since</label>
                  <p className="text-white">
                    {user.metadata?.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString() : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Management */}
            {isPro && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Subscription</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Current Plan: Pro ($49/month)</p>
                    <p className="text-xs text-zinc-500">Next billing date: Monthly</p>
                  </div>
                  
                  <button
                    onClick={handleCancelSubscription}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                  >
                    Manage Subscription
                  </button>
                  
                  <p className="text-xs text-zinc-500">
                    You can update your payment method, view billing history, or cancel your subscription.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-2 bg-zinc-800 text-white font-semibold rounded-md hover:bg-zinc-700 text-center"
                >
                  Go to Dashboard
                </Link>
                
                <Link
                  href="/pricing"
                  className="block w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 text-center"
                >
                  {isPro ? 'Change Plan' : 'Upgrade to Pro'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
