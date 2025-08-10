'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import ContentStatusTable from './components/ContentStatusTable'

export default function AdminPage() {
  const { user } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  
  // Pro status management
  const [proUid, setProUid] = useState('')
  const [isPro, setIsPro] = useState(true)
  const [proLoading, setProLoading] = useState(false)
  const [proMessage, setProMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return

    setIsSubmitting(true)
    setStatus('')
    setError('')

    try {
      setStatus('Fetching video data and transcript...')
      
      const response = await fetch('/api/youtube/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 422) {
          setError('No transcript available for this video. The video may have captions disabled or be too new to have captions available.')
        } else {
          setError(data.error || 'Failed to process video')
        }
        return
      }

      setStatus(`Success! Video processed. Transcript length: ${data.transcriptLength || 'Unknown'} characters`)
      setYoutubeUrl('')
      
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const setProStatus = async () => {
    if (!proUid.trim()) {
      setProMessage('Please enter a User UID')
      return
    }

    setProLoading(true)
    setProMessage('')

    try {
      const response = await fetch('/api/user/set-pro-firestore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: proUid.trim(), isPro }),
      })

      const data = await response.json()

      if (response.ok) {
        setProMessage(`✅ ${data.message}`)
        setProUid('')
      } else {
        setProMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setProMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-gray-400">Please sign in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Content</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Process Video'}
            </button>
          </form>

          {status && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded-md">
              <p className="text-green-200">{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200 mb-2">{error}</p>
              <p className="text-sm text-red-300">
                You can try a different video or contact support if this persists.
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Pro Status Management</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">User UID</label>
              <input
                type="text"
                value={proUid}
                onChange={(e) => setProUid(e.target.value)}
                placeholder="Enter user UID (from Firebase Auth)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-2">Pro Status</label>
              <select
                value={isPro.toString()}
                onChange={(e) => setIsPro(e.target.value === 'true')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Pro User</option>
                <option value="false">Free User</option>
              </select>
            </div>

            <button
              onClick={setProStatus}
              disabled={proLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proLoading ? 'Setting...' : 'Set Pro Status'}
            </button>

            {proMessage && (
              <div className={`p-3 rounded-md text-sm ${
                proMessage.includes('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
              }`}>
                {proMessage}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p><strong>Note:</strong> Users will need to sign out and sign back in to see their updated Pro status.</p>
            <p className="mt-1"><strong>Current user:</strong> {user.email} (UID: {user.uid})</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Content Status</h2>
          <ContentStatusTable />
        </div>
      </div>
    </div>
  )
} 