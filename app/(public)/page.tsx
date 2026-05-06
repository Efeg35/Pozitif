import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Shield, Star, Waves } from 'lucide-react'
import { getFeaturedListings, getDistrictsWithListings } from '@/app/actions/public.actions'
import ListingGrid from '@/components/public/ListingGrid'
import HeroSearch from '@/components/public/HeroSearch'
import { IZMIR_COASTAL_DISTRICTS } from '@/lib/constants'
import type { PublicListing } from '@/app/actions/public.actions'

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

  // Pick first featured listing with a cover image for the hero panel
  const heroListing: PublicListing | undefined = featuredListings.find(
    (l) => l.listing_images.length > 0
  )
  const heroCover = heroListing?.listing_images[0]

  return (
    <div className="flex flex-col bg-stone-50">
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            {/* Left column — copy + search */}
            <div className="flex flex-col gap-7">
              {/* Eyebrow */}
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-widest text-blue-700 uppercase">
                <MapPin className="h-3 w-3" />
                İzmir
              </span>

              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
                  Yaşamınıza Uygun<br />
                  <span className="text-blue-900">Doğru Gayrimenkulü</span><br />
                  Bulun
                </h1>
                <p className="text-base leading-relaxed text-zinc-500 max-w-md">
                  Karşıyaka, Urla, Çeşme ve İzmir&apos;in değerli lokasyonlarında satılık ve kiralık seçili ilanlar.
                </p>
              </div>

              {/* Search box */}
              <div className="max-w-md">
                <HeroSearch districts={districts} />
              </div>

              {/* CTA links */}
              <div className="flex items-center gap-4">
                <Link
                  href="/ilanlar"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
                >
                  Tüm İlanları Gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/iletisim"
                  className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors underline-offset-2 hover:underline"
                >
                  Bize Ulaşın
                </Link>
              </div>
            </div>

            {/* Right column — featured listing preview card */}
            <div className="hidden md:block">
              {heroCover && heroListing ? (
                <Link
                  href={`/ilanlar/${heroListing.id}/${heroListing.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={heroCover.url}
                      alt={heroListing.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
                        Öne Çıkan İlan
                      </p>
                      <p className="text-base font-semibold text-white line-clamp-1">
                        {heroListing.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-bold text-zinc-900">
                      {heroListing.district && (
                        <span className="flex items-center gap-1 text-zinc-500 font-normal text-xs">
                          <MapPin className="h-3 w-3" />
                          {heroListing.district}, {heroListing.city}
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                      Detayları Gör <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50">
                  <p className="text-sm text-zinc-400">Öne çıkan ilan görseli</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ─────────────────────────── */}
      {featuredListings.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                  Seçili Portföy
                </p>
                <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                  Öne Çıkan İlanlar
                </h2>
              </div>
              <Link
                href="/ilanlar"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Tümünü Gör
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ListingGrid listings={featuredListings} priorityCount={3} />
          </div>
        </section>
      )}

      {/* ── WHY POZITIF ───────────────────────────────── */}
      <section className="border-y border-zinc-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Neden Biz?
            </p>
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Neden Pozitif Emlak?
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-stone-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-900" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Yerel Uzmanlık</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  İzmir&apos;in her ilçesini, semtini ve değerini bilen, sahada deneyimli bir ekip.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-stone-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Star className="h-5 w-5 text-blue-900" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Seçili Portföy</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  Yalnızca değerlendirdiğimiz ve güvendiğimiz mülkleri portföyümüzde sunuyoruz.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-stone-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Shield className="h-5 w-5 text-blue-900" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Şeffaf Süreç</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  Fiyat, tapu, hukuki durum — tüm detayları baştan paylaşıyor, sürpriz bırakmıyoruz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COASTAL DISTRICTS ─────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Bölgeler
            </p>
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Yazlık Bölgeler</h2>
            <p className="mt-2.5 text-sm text-zinc-500 max-w-md mx-auto">
              İzmir&apos;in en gözde sahil ve yazlık bölgelerinde ilan arayın
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {IZMIR_COASTAL_DISTRICTS.map((district) => (
              <Link
                key={district}
                href={`/ilanlar?district=${encodeURIComponent(district)}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3.5 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                  <p className="text-sm font-medium text-zinc-700 group-hover:text-blue-900 transition-colors">{district}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────── */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Gayrimenkulünüzü Satmak mı İstiyorsunuz?
          </h2>
          <p className="mt-3 text-blue-200 text-sm leading-relaxed">
            Profesyonel ekibimizle doğru fiyatlandırma ve hızlı satış için hemen iletişime geçin.
          </p>
          <Link
            href="/iletisim"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
          >
            Bizimle İletişime Geçin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}