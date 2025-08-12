'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'

interface Content {
  id: string
  youtubeUrl: string
  videoId: string
  status: string
  createdAt: string
  updatedAt?: string
  transcript?: string
  influencerName?: string
  platform?: string
  episodeTitle?: string
  channelSubscribers?: number
  publishedAt?: string
  sourceUrl?: string
  
  // Processed content
  extractedMentions?: Array<{
    ticker: string
    sentiment: string
    timestamp?: number
    context?: string
  }>
  highlights?: Array<{
    text: string
    timestamp?: number
    sentiment?: string
  }>
  tweetThread?: string
  videoScript?: string
  blogArticle?: string
  notableTimestamps?: Array<{
    time: number
    description: string
  }>
}

export default function ContentStatusTable() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [influencerFilter, setInfluencerFilter] = useState<string>('')

  useEffect(() => {
    // Use limit(30) for initial load, then expand if needed
    const q = showAll 
      ? query(collection(db, 'content'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'content'), orderBy('createdAt', 'desc'), limit(30))
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const contentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Content[]
        
        setContent(contentData)
        setLoading(false)
      },
      (error) => {
        console.error('Firestore connection error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [showAll])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Filter content based on status and influencer
  const filteredContent = content.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesInfluencer = !influencerFilter || 
      (item.influencerName && item.influencerName.toLowerCase().includes(influencerFilter.toLowerCase()))
    return matchesStatus && matchesInfluencer
  })

  // Get unique influencers for filter dropdown
  const uniqueInfluencers = Array.from(new Set(content.map(item => item.influencerName).filter(Boolean)))

  if (loading) {
    return <div className="p-4 text-gray-400">Loading content status...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Recent Content ({filteredContent.length} of {content.length})
          </h3>
          <p className="text-sm text-gray-400">
            {showAll ? 'Showing all content' : 'Showing last 30 items'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="complete">Complete</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
          </select>

          {/* Influencer Filter */}
          <select
            value={influencerFilter}
            onChange={(e) => setInfluencerFilter(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          >
            <option value="">All Influencers</option>
            {uniqueInfluencers.map(influencer => (
              <option key={influencer} value={influencer}>{influencer}</option>
            ))}
          </select>

          {/* Show All Toggle */}
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            {showAll ? 'Show Recent 30' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        Click any row to expand details • Use filters to narrow down results
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Influencer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Episode
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Published
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {filteredContent.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-800 cursor-pointer" onClick={() => toggleRow(item.id)}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'complete' ? 'bg-green-900 text-green-200' :
                      item.status === 'processing' ? 'bg-yellow-900 text-yellow-200' :
                      item.status === 'error' ? 'bg-red-900 text-red-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-white font-medium">
                      {item.influencerName || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.platform} • {formatSubs(item.channelSubscribers)} subs
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-white max-w-xs truncate">
                      {item.episodeTitle || 'Untitled'}
                    </div>
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 block mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on YouTube →
                    </a>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.publishedAt || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {item.tweetThread && (
                        <CopyButton text={item.tweetThread} label="Tweet" color="blue" />
                      )}
                      {item.videoScript && (
                        <CopyButton text={item.videoScript} label="Script" color="green" />
                      )}
                      {item.blogArticle && (
                        <CopyButton text={item.blogArticle} label="Blog" color="purple" />
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details Row */}
                {expandedRows.has(item.id) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-gray-800">
                      <div className="space-y-4">
                        {/* Extracted Mentions */}
                        {item.extractedMentions && item.extractedMentions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Stock Mentions ({item.extractedMentions.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {item.extractedMentions.map((mention, idx) => (
                                <div key={idx} className="bg-gray-700 p-3 rounded">
                                  <div className="flex items-center justify-between">
                                    <span className="text-white font-mono text-sm">{mention.ticker}</span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      mention.sentiment === 'bullish' ? 'bg-green-900 text-green-200' :
                                      mention.sentiment === 'bearish' ? 'bg-red-900 text-red-200' :
                                      'bg-gray-600 text-gray-300'
                                    }`}>
                                      {mention.sentiment}
                                    </span>
                                  </div>
                                  {mention.context && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{mention.context}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Highlights */}
                        {item.highlights && item.highlights.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Key Highlights ({item.highlights.length})</h4>
                            <div className="space-y-2">
                              {item.highlights.slice(0, 5).map((highlight, idx) => (
                                <div key={idx} className="bg-gray-700 p-3 rounded">
                                  <p className="text-sm text-gray-300">{highlight.text}</p>
                                  {highlight.timestamp && (
                                    <span className="text-xs text-gray-500">
                                      {Math.floor(highlight.timestamp / 60)}:{(highlight.timestamp % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notable Timestamps */}
                        {item.notableTimestamps && item.notableTimestamps.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Notable Timestamps ({item.notableTimestamps.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {item.notableTimestamps.map((timestamp, idx) => (
                                <div key={idx} className="bg-gray-700 p-3 rounded">
                                  <div className="text-sm text-white font-mono">
                                    {Math.floor(timestamp.time / 60)}:{(timestamp.time % 60).toString().padStart(2, '0')}
                                  </div>
                                  <div className="text-xs text-gray-400">{timestamp.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.tweetThread && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-2">Tweet Thread Preview</h4>
                              <div className="bg-gray-700 p-3 rounded text-sm text-gray-300 max-h-32 overflow-y-auto">
                                {item.tweetThread.substring(0, 200)}...
                              </div>
                            </div>
                          )}
                          
                          {item.videoScript && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-2">Video Script Preview</h4>
                              <div className="bg-gray-700 p-3 rounded text-sm text-gray-300 max-h-32 overflow-y-auto">
                                {item.videoScript.substring(0, 200)}...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results message */}
      {filteredContent.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No content matches the current filters.
        </div>
      )}
    </div>
  )
}

function CopyButton({ text, label, color }: { text: string; label: string; color: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy!')
    }
  }

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700', 
    purple: 'bg-purple-600 hover:bg-purple-700'
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-2 py-1 text-white rounded text-xs ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}

function formatSubs(n?: number) {
  if (!n && n !== 0) return 'Unknown'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}