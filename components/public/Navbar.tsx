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

  const officeName = settings?.office_name ?? 'Pozitif Gayrimenkul'
  const whatsappPhone = settings?.whatsapp ?? settings?.phone

  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}`
    : null

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo + Office name */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={officeName}
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              {officeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide text-zinc-900">{officeName}</span>
            <span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
              İzmir Gayrimenkul Danışmanlığı
            </span>
          </div>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 md:hidden"
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
                className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
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