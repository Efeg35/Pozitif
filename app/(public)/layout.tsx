import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { getOfficeSettings } from '@/app/actions/public.actions'

// Lucide doesn't include Instagram/Facebook — use minimal inline SVGs
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getOfficeSettings()
  const officeName = settings?.office_name ?? 'Pozitif Emlak'
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar settings={settings} />

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Office info */}
            <div className="flex flex-col gap-4">
              <p className="text-lg font-bold text-white">{officeName}</p>
              <div className="flex flex-col gap-2.5 text-sm">
                {settings?.phone && (
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0 text-blue-400" />
                    {settings.phone}
                  </a>
                )}
                {settings?.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0 text-blue-400" />
                    {settings.email}
                  </a>
                )}
                {settings?.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    {settings.address}
                    {settings.district && `, ${settings.district}`}
                    {settings.city && ` / ${settings.city}`}
                  </p>
                )}
              </div>

              {/* Social links */}
              {(settings?.instagram_url || settings?.facebook_url) && (
                <div className="flex items-center gap-3 pt-1">
                  {settings.instagram_url && (
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  )}
                  {settings.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Hızlı Linkler
              </p>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/" className="hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/ilanlar" className="hover:text-white transition-colors">
                  İlanlar
                </Link>
                <Link href="/iletisim" className="hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>

            {/* Working hours */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Çalışma Saatleri
              </p>
              <div className="flex flex-col gap-1.5 text-sm">
                <p>Pazartesi – Cumartesi</p>
                <p className="text-white font-medium">09:00 – 18:00</p>
                <p className="mt-1 text-zinc-500">Pazar: Kapalı</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
            © {year} {officeName}. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  )
}