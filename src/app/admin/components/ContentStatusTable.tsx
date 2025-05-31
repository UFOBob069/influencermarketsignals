'use client'

import { useEffect, useState, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

interface Content {
  id: string
  youtubeUrl: string
  status: string
  createdAt: string
  updatedAt?: string
  tweetThread?: string
  videoScript?: string
}

export default function ContentStatusTable() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'))
    
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
  }, [])

  if (loading) {
    return <div className="p-4">Loading content status...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              YouTube URL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {content.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.status === 'complete' ? 'bg-green-100 text-green-800' :
                  item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <a
                  href={item.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item.youtubeUrl}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.tweetThread && (
                  <CopyTweetThreadButton tweetThread={item.tweetThread} />
                )}
                {item.videoScript && (
                  <CopyVideoScriptButton videoScript={item.videoScript} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CopyTweetThreadButton({ tweetThread }: { tweetThread: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tweetThread);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert('Failed to copy!');
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
    >
      {copied ? 'Copied!' : 'Copy Tweet Thread'}
    </button>
  );
}

function CopyVideoScriptButton({ videoScript }: { videoScript: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(videoScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert('Failed to copy!');
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs ml-2"
    >
      {copied ? 'Copied!' : 'Copy Video Script'}
    </button>
  );
} 