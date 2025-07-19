'use client'

import { useAuth } from '@/lib/auth'
import ContentStatusTable from './components/ContentStatusTable'
import Link from 'next/link'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export default function AdminPage() {
  const { user, signOut, error } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const [processingStatus, setProcessingStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setFormError('')
    setProcessingStatus('Starting content processing...')

    try {
      // Extract video ID from YouTube URL
      const videoId = extractVideoId(youtubeUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      if (!transcript.trim()) {
        throw new Error('Transcript is required')
      }

      setProcessingStatus('Adding content to Firestore...')
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'content'), {
        youtubeUrl,
        videoId,
        transcript: transcript.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      })

      setProcessingStatus('Triggering content processing...')
      // Trigger content processing (if you have an API route for this)
      await fetch('/api/process-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: docRef.id }),
      })

      setProcessingStatus('Content processing started successfully')
      setStatus('success')
      setYoutubeUrl('')
      setTranscript('')
    } catch (err) {
      setStatus('error')
      setFormError(err instanceof Error ? err.message : 'An error occurred')
      setProcessingStatus('')
      console.error('Error processing content:', err)
    }
  }

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Initializing Admin</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">
            Please check your Firebase configuration in .env.local
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {user ? (
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/admin/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
        )}
      </div>

      {user ? (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Submit New Content</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL
                </label>
                <input
                  type="text"
                  id="youtubeUrl"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-1">
                  Transcript (paste the full transcript here)
                </label>
                <textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste the full transcript from the YouTube video here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Copy the transcript from YouTube&apos;s transcript feature and paste it here
                </p>
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {status === 'loading' ? 'Processing...' : 'Submit'}
              </button>
              {processingStatus && (
                <p className="text-blue-600">{processingStatus}</p>
              )}
              {status === 'success' && (
                <p className="text-green-600">Content submitted successfully!</p>
              )}
              {status === 'error' && (
                <p className="text-red-600">{formError}</p>
              )}
            </form>
          </div>
          <ContentStatusTable />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access the admin dashboard and manage content.
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
} 