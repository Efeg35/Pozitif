'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, MessageCircle } from 'lucide-react'
import type { OfficeSettings } from '@/lib/types'

interface NavbarProps {
  settings: OfficeSettings | null
}

const NAV_LINKS = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/ilanlar', label: 'İlanlar' },
  { href: '/iletisim', label: 'İletişim' },
]

export default function Navbar({ settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const officeName = settings?.office_name ?? 'Pozitif Emlak'
  const whatsappPhone = settings?.whatsapp ?? settings?.phone

  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}`
    : null

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo + Office name */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={officeName}
              width={36}
              height={36}
              className="rounded-md object-contain"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              {officeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-base font-bold text-zinc-800">{officeName}</span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* WhatsApp button — desktop */}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-green-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-3">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp ile İletişim
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}