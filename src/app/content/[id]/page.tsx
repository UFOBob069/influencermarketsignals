'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { FaTwitter, FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  description: string
  videoId: string
  blogArticle: string
  tweetThread: string
  createdAt: string
  notableTimestamps?: string
}

export default function ContentPage() {
  const params = useParams()
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'content', params.id as string)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setContent({
            id: docSnap.id,
            ...docSnap.data()
          } as Content)
        }
      } catch (error) {
        console.error('Error fetching content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading content...</div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Content not found</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-lg"
          >
            <FaArrowLeft className="mr-2" />
            Back to All Articles
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.tweetThread.split('\n')[0])}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition font-semibold sticky top-4 z-10"
          >
            <FaTwitter className="mr-2" />
            Share on X
          </a>
        </div>

        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Video */}
          <div className="aspect-video relative bg-gray-200">
            <iframe
              src={`https://www.youtube.com/embed/${content.videoId}`}
              className="absolute inset-0 w-full h-full rounded-t-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Content */}
          <div className="p-10 md:p-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 leading-tight tracking-tight">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 mb-8 font-medium">
              {content.description}
            </p>

            {/* Blog Article */}
            <section className="prose max-w-none mb-12 prose-blue prose-lg">
              <h2 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-100 pb-2">Full Article</h2>
              <div className="whitespace-pre-line">{content.blogArticle}</div>
            </section>

            {/* Notable Timestamps */}
            {content.notableTimestamps && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-indigo-700 border-b-2 border-indigo-100 pb-2">Notable Timestamps</h2>
                <ul className="space-y-3">
                  {content.notableTimestamps.split('\n').map((line, idx) => {
                    const match = line.match(/\*\*\[(\d{2}):(\d{2})\]\*\*\s*—\s*(.*)/)
                    if (!match) return null
                    const [, mm, ss, desc] = match
                    const seconds = parseInt(mm, 10) * 60 + parseInt(ss, 10)
                    const url = `https://www.youtube.com/watch?v=${content.videoId}&t=${seconds}s`
                    return (
                      <li key={idx} className="flex items-center gap-3">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline font-mono font-semibold bg-indigo-50 px-2 py-1 rounded"
                        >
                          [{mm}:{ss}]
                        </a>
                        <span className="ml-2 text-gray-700">— {desc}</span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <div className="mt-8 text-sm text-gray-500 border-t pt-6">
              Published {new Date(content.createdAt).toLocaleDateString()}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
} 