'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'

export default function SiteNav() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  usePathname()
  useRouter()

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-900 bg-black/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="font-semibold">IMS</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white text-sm">Dashboard</Link>
            <Link href="/dashboard/trending" className="text-zinc-300 hover:text-white text-sm">Trending</Link>
            {user && (
              <Link href="/account" className="text-zinc-300 hover:text-white text-sm">Account</Link>
            )}
            <Link href="/admin" className="text-zinc-300 hover:text-white text-sm">Admin</Link>
          </div>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-zinc-400">Loading…</span>
          ) : user ? (
            <>
              <span className="text-xs text-zinc-400">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-xs px-3 py-1 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="text-xs px-3 py-1 rounded bg-white text-black hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {!loading && !user && (
            <Link
              href="/signin"
              className="text-xs px-2 py-1 rounded bg-white text-black hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-zinc-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800">
          <div className="px-4 py-2 space-y-1">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/trending" 
              className="block px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trending
            </Link>
            {user && (
              <Link 
                href="/account" 
                className="block px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Account
              </Link>
            )}
            <Link 
              href="/admin" 
              className="block px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
            {user && (
              <div className="border-t border-zinc-800 pt-2 mt-2">
                <div className="px-3 py-2 text-xs text-zinc-400">{user.email}</div>
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}


