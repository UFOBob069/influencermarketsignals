'use client'

import Link from 'next/link'
import { FaLink, FaChartLine } from 'react-icons/fa'

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

  // Extract a clean preview from the blog article
  const getBlogPreview = (article: string) => {
    // Remove markdown formatting and get first few sentences
    const cleanText = article
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/- /g, '') // Remove bullet points
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    // Get first 200 characters and add ellipsis if needed
    return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText
  }

  const blogPreview = getBlogPreview(blogArticle)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-shadow duration-300">
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

        {/* Blog Preview */}
        <div className="mb-4 flex-1">
          <div className="flex items-center mb-2">
            <FaChartLine className="text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-700">Article Preview</h4>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
              {blogPreview}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <Link
            href={`/content/${id}`}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium shadow-sm"
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