'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { FaTwitter, FaArrowLeft, FaClock, FaChartLine, FaQuoteLeft, FaUser } from 'react-icons/fa'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
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
            <section className="mb-12">
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-8 prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-6 prose-h3:text-blue-700 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-li:text-gray-700 prose-li:mb-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({children}) => (
                      <h2 className="flex items-center text-3xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-blue-100 pb-2">
                        <FaChartLine className="mr-3 text-blue-600" />
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="flex items-center text-xl font-semibold text-blue-700 mb-4 mt-6">
                        <FaUser className="mr-2 text-blue-500" />
                        {children}
                      </h3>
                    ),
                    ul: ({children}) => (
                      <ul className="space-y-3 my-6 pl-6">
                        {children}
                      </ul>
                    ),
                    li: ({children}) => (
                      <li className="text-gray-700 leading-relaxed flex items-start">
                        <span className="text-blue-500 mr-2 mt-2">•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({children}) => (
                      <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">
                        {children}
                      </strong>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 bg-blue-50 py-2 rounded-r">
                        <FaQuoteLeft className="inline mr-2 text-blue-400" />
                        {children}
                      </blockquote>
                    ),
                    p: ({children}) => (
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {children}
                      </p>
                    )
                  }}
                >
                  {content.blogArticle}
                </ReactMarkdown>
              </div>
            </section>

            {/* Notable Timestamps */}
            {content.notableTimestamps && (
              <section className="mb-12">
                <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700 border-b-2 border-indigo-100 pb-2">
                  <FaClock className="mr-3 text-indigo-600" />
                  Notable Timestamps
                </h2>
                <div className="grid gap-3">
                  {content.notableTimestamps.split('\n').map((line, idx) => {
                    const match = line.match(/\*\*\[(\d{2}):(\d{2})\]\*\*\s*—\s*(.*)/)
                    if (!match) return null
                    const [, mm, ss, desc] = match
                    const seconds = parseInt(mm, 10) * 60 + parseInt(ss, 10)
                    const url = `https://www.youtube.com/watch?v=${content.videoId}&t=${seconds}s`
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-mono font-semibold bg-indigo-100 px-3 py-1 rounded-md hover:bg-indigo-200 transition"
                        >
                          [{mm}:{ss}]
                        </a>
                        <span className="text-gray-700 flex-1">{desc}</span>
                      </div>
                    )
                  })}
                </div>
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