'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Home,
  Users,
  CalendarDays,
  MessageSquare,
  Settings,
  Menu,
  X,
  Building2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/types'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/admin',             adminOnly: false },
  { icon: Home,            label: 'İlanlar',      href: '/admin/ilanlar',     adminOnly: false },
  { icon: Users,           label: 'Müşteriler',   href: '/admin/musteriler',  adminOnly: false },
  { icon: CalendarDays,    label: 'Randevular',   href: '/admin/randevular',  adminOnly: false },
  { icon: MessageSquare,   label: 'Talepler',     href: '/admin/talepler',    adminOnly: false },
  { icon: Settings,        label: 'Ayarlar',      href: '/admin/ayarlar',     adminOnly: true  },
]

interface SidebarProps {
  agent: Pick<Agent, 'full_name' | 'title' | 'avatar_url'> | null
  is_admin: boolean
}

export default function Sidebar({ agent, is_admin }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Office Name */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Building2 className="h-6 w-6 text-blue-700 shrink-0" />
        <span className="font-bold text-zinc-900 text-sm leading-tight">Pozitif Gayrimenkul</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.filter(item => !item.adminOnly || is_admin).map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-blue-700 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Agent info */}
      {agent && (
        <div className="border-t px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
              {agent.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{agent.full_name}</p>
              {agent.title && (
                <p className="text-xs text-zinc-500 truncate">{agent.title}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border rounded-md shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menüyü aç/kapat"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 z-40 h-full w-60 bg-white border-r shadow-lg transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  )
}