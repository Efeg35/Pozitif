import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users, Home, Award, Waves } from 'lucide-react'
import { getFeaturedListings, getDistrictsWithListings } from '@/app/actions/public.actions'
import ListingGrid from '@/components/public/ListingGrid'
import HeroSearch from '@/components/public/HeroSearch'
import { IZMIR_COASTAL_DISTRICTS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Pozitif Emlak | İzmir Gayrimenkul',
  description:
    "İzmir'de satılık ve kiralık daire, villa, arsa ilanları. Karşıyaka, Çeşme, Urla, Bornova ve tüm İzmir ilçelerinde güvenilir emlak danışmanlığı.",
}

export default async function HomePage() {
  const [featuredListings, districts] = await Promise.all([
    getFeaturedListings(),
    getDistrictsWithListings(),
  ])

  return (
    <div className="flex flex-col">
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-20 md:py-28">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Hayalinizdeki Evi Bulun
            </h1>
            <p className="mt-4 text-lg text-blue-200 sm:text-xl">
              İzmir&apos;in en iyi lokasyonlarında seçkin gayrimenkul ilanları
            </p>

            {/* Quick search */}
            <div className="mt-8">
              <HeroSearch districts={districts} />
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/ilanlar"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50 transition-colors"
              >
                Tüm İlanları Gör
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
              >
                Bize Ulaşın
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ─────────────────────────── */}
      {featuredListings.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                  Öne Çıkan İlanlar
                </h2>
                <p className="mt-1 text-sm text-zinc-500">Özenle seçilmiş, özel ilanlar</p>
              </div>
              <Link
                href="/ilanlar"
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Tümünü Gör
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ListingGrid listings={featuredListings} priorityCount={3} />
          </div>
        </section>
      )}

      {/* ── STATS BAR ─────────────────────────────────── */}
      <section className="bg-blue-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-blue-700">500+</p>
              <p className="text-sm font-medium text-zinc-600">Mutlu Müşteri</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Home className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-blue-700">200+</p>
              <p className="text-sm font-medium text-zinc-600">Tamamlanan İlan</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Award className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-blue-700">10+</p>
              <p className="text-sm font-medium text-zinc-600">Yıl Deneyim</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COASTAL DISTRICTS ─────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Yazlık Bölgeler</h2>
            <p className="mt-2 text-sm text-zinc-500">
              İzmir&apos;in en gözde sahil ve yazlık bölgelerinde ilan arayın
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {IZMIR_COASTAL_DISTRICTS.map((district) => (
              <Link
                key={district}
                href={`/ilanlar?district=${encodeURIComponent(district)}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Waves className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">{district}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────── */}
      <section className="bg-zinc-900 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Gayrimenkulünüzü Satmak mı İstiyorsunuz?
          </h2>
          <p className="mt-3 text-zinc-400">
            Profesyonel ekibimizle doğru fiyatlandırma ve hızlı satış için hemen iletişime geçin.
          </p>
          <Link
            href="/iletisim"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Bizimle İletişime Geçin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}