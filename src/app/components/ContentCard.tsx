'use client'

import Link from 'next/link'
import { FaLink } from 'react-icons/fa'

interface ContentCardProps {
  id: string
  title: string
  description: string
  videoId: string
  blogArticle: string
  createdAt: string
}

export default function ContentCard({
  id,
  title,
  description,
  videoId,
  blogArticle,
  createdAt,
}: ContentCardProps) {
  const embedId = videoId

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
      {/* Video Preview - smaller and with rounded corners */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '180px' }}>
        <iframe
          src={`https://www.youtube.com/embed/${embedId}`}
          className="absolute inset-0 w-full h-full rounded-t-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-2">{title}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{description}</p>

        {/* Blog Preview Only */}
        <div className="mb-4">
          <h4 className="font-semibold mb-1 text-blue-700">Blog Preview</h4>
          <p className="text-gray-700 text-sm line-clamp-4 whitespace-pre-line">{blogArticle}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <Link
            href={`/content/${id}`}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaLink className="mr-2" />
            Read Full Article
          </Link>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          Published {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
} 