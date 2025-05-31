'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import ContentCard from './components/ContentCard'

interface Content {
  id: string
  title: string
  description: string
  videoId: string
  blogArticle: string
  tweetThread: string
  createdAt: string
}

export default function Home() {
  const [featuredContent, setFeaturedContent] = useState<Content | null>(null)
  const [latestContent, setLatestContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(
          collection(db, 'content'),
          orderBy('createdAt', 'desc'),
          limit(6)
        )
        
        const snapshot = await getDocs(q)
        const content = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Content[]

        if (content.length > 0) {
          setFeaturedContent(content[0])
          setLatestContent(content.slice(1))
        }
      } catch (error) {
        console.error('Error fetching content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Stay Ahead of the Market
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Concise summaries from the top finance podcasts, powered by AI
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <iframe 
              src="https://embeds.beehiiv.com/73d23f02-1204-4df2-8436-ede39ac9f11b?slim=true" 
              data-test-id="beehiiv-embed" 
              height="52" 
              frameBorder="0" 
              scrolling="no" 
              style={{ margin: 0, borderRadius: '0px !important', backgroundColor: 'transparent' }}
            />
            <Link
              href="https://twitter.com/marketpoddigest"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Follow on X
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Content as Grid of Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Latest Insights</h2>
          {loading ? (
            <div className="text-center py-12">Loading content...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {([featuredContent, ...latestContent].filter(Boolean) as Content[]).map((content) => (
                <ContentCard
                  key={content.id}
                  id={content.id}
                  title={content.title}
                  description={content.description}
                  videoId={content.videoId}
                  blogArticle={content.blogArticle}
                  createdAt={content.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">About MarketPod Digest</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-lg mb-4">
                We transform lengthy finance podcasts into concise, actionable insights.
                Our AI-powered platform delivers:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>10-minute video summaries</li>
                <li>Comprehensive blog articles</li>
                <li>Viral tweet threads</li>
                <li>Weekly newsletter digest</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Trust Signals</h3>
              <ul className="space-y-4">
                <li>✓ AI-powered accuracy</li>
                <li>✓ Expert-curated sources</li>
                <li>✓ Time-saving summaries</li>
                <li>✓ Regular updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">MarketPod Digest</h3>
              <p className="text-gray-400">Your shortcut to market insights</p>
            </div>
            <div className="flex space-x-6">
              <Link href="https://twitter.com/marketpoddigest" className="hover:text-blue-400">
                <FaTwitter className="text-2xl" />
              </Link>
              <Link href="https://linkedin.com/company/marketpoddigest" className="hover:text-blue-400">
                <FaLinkedin className="text-2xl" />
              </Link>
              <Link href="mailto:hello@marketpoddigest.com" className="hover:text-blue-400">
                <FaEnvelope className="text-2xl" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
