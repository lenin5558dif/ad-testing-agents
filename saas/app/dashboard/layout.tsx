'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <>
      <div className="mb-8">
        <h1 className="text-lg font-bold">Ad Testing</h1>
      </div>

      <nav className="space-y-2">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`block rounded px-3 py-2 text-sm ${
            pathname === '/dashboard'
              ? 'bg-black text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          Проекты
        </Link>
      </nav>

      <div className="mt-auto pt-8">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-200"
        >
          Выйти
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 border-r bg-gray-50 p-4 md:block">
        {navContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded border bg-white p-2 shadow-sm md:hidden"
        aria-label="Открыть меню"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-gray-50 p-4 shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded p-1 hover:bg-gray-200"
              aria-label="Закрыть меню"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <main className="flex-1 p-8 pt-16 md:pt-8">{children}</main>
    </div>
  )
}
