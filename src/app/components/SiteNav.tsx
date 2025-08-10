'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function SiteNav() {
  const { user, loading, signOut } = useAuth()
  usePathname()
  useRouter()

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-900 bg-black/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">IMS</Link>
          <Link href="/dashboard" className="text-zinc-300 hover:text-white text-sm">Dashboard</Link>
          <Link href="/dashboard/trending" className="text-zinc-300 hover:text-white text-sm">Trending</Link>
          {user && (
            <Link href="/account" className="text-zinc-300 hover:text-white text-sm">Account</Link>
          )}
          <Link href="/admin" className="text-zinc-300 hover:text-white text-sm">Admin</Link>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-zinc-400">Loading…</span>
          ) : user ? (
            <>
              <span className="text-xs text-zinc-400 hidden sm:inline">{user.email}</span>
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
      </div>
    </nav>
  )
}


