import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Shield, Star, Waves, ArrowUpRight } from 'lucide-react'
import { getFeaturedListings, getDistrictsWithListings } from '@/app/actions/public.actions'
import ListingGrid from '@/components/public/ListingGrid'
import HeroSearch from '@/components/public/HeroSearch'
import { IZMIR_COASTAL_DISTRICTS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import type { PublicListing } from '@/app/actions/public.actions'
import { getOfficeSettings } from '@/app/actions/settings.actions'
import StructuredData, { buildOrganizationJsonLd } from '@/components/public/StructuredData'
import { getSiteUrl } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Pozitif Gayrimenkul İzmir | Satılık ve Kiralık Daire İlanları',
  description:
    "İzmir emlak ofisi olarak Konak, Karabağlar, Karşıyaka, Çeşme ve tüm İzmir ilçelerinde satılık daire, kiralık daire ve villa ilanları. Güvenilir gayrimenkul danışmanlığı.",
  openGraph: {
    title: 'Pozitif Gayrimenkul İzmir | Satılık ve Kiralık Daire',
    description:
      "İzmir'de satılık ve kiralık daire ilanları. Konak, Karabağlar, Karşıyaka ve daha fazlası.",
    type: 'website',
    locale: 'tr_TR',
  },
}

// ── Coastal district data — imageUrl ready for future photo support ──────────
type DistrictConfig = {
  bg: string
  text: string
  border: string
  imageUrl?: string // placeholder for future district photo
}

const DISTRICT_CONFIG: Record<string, DistrictConfig> = {
  Çeşme:       { bg: 'bg-sky-50',    text: 'text-sky-800',    border: 'border-sky-100'    },
  Urla:        { bg: 'bg-teal-50',   text: 'text-teal-800',   border: 'border-teal-100'   },
  Foça:        { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-100'  },
  Seferihisar: { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-100'  },
  Güzelbahçe:  { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-100' },
}
const DEFAULT_DISTRICT: DistrictConfig = { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-100' }

// Static fallback hero image — place a JPG at public/images/hero-fallback.jpg
// for a real photo. If absent, the gradient fallback underneath is shown.
const HERO_FALLBACK_SRC = '/images/hero-fallback.jpg'

export default async function HomePage() {
  const [featuredListings, districts, officeSettings] = await Promise.all([
    getFeaturedListings(),
    getDistrictsWithListings(),
    getOfficeSettings(),
  ])

  const siteUrl = getSiteUrl()
  const orgJsonLd = buildOrganizationJsonLd({
    name: officeSettings?.office_name ?? 'Pozitif Gayrimenkul',
    url: siteUrl,
    phone: officeSettings?.phone,
    email: officeSettings?.email,
    address: officeSettings?.address,
    city: officeSettings?.city,
    logoUrl: officeSettings?.logo_url,
    instagram: officeSettings?.instagram_url,
    facebook: officeSettings?.facebook_url,
  })

  const heroListing: PublicListing | undefined = featuredListings.find(
    (l) => l.listing_images.length > 0
  )
  const heroCover = heroListing?.listing_images[0]

  // Decide which image src to use for the hero panel
  const heroImageSrc: string | null = heroCover?.url ?? HERO_FALLBACK_SRC
  const heroImageAlt = heroCover
    ? (heroListing?.title ?? 'Öne çıkan ilan')
    : 'İzmir Gayrimenkul'

  return (
    <div className="flex flex-col bg-stone-50">
      <StructuredData data={orgJsonLd} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 md:py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_420px] md:items-stretch lg:grid-cols-[1fr_460px]">

            {/* Left — copy + search */}
            <div className="flex flex-col justify-center gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-900" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  İzmir Gayrimenkul
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-5xl md:text-[2.75rem] lg:text-5xl">
                  Yaşamınıza Uygun<br />
                  <span className="text-blue-900">Doğru Gayrimenkulü</span><br />
                  Bulun
                </h1>
                <p className="max-w-sm text-sm leading-relaxed text-zinc-500 sm:text-base">
                  Karşıyaka, Urla, Çeşme ve İzmir&apos;in değerli lokasyonlarında
                  satılık ve kiralık seçili ilanlar.
                </p>
              </div>

              <div className="w-full max-w-lg">
                <HeroSearch districts={districts} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/ilanlar"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
                >
                  Tüm İlanları Gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
                >
                  Bize Ulaşın
                </Link>
              </div>
            </div>

            {/* Right — hero image panel */}
            <div className="w-full">
              {/* Mobile: aspect-ratio box; Desktop: full height */}
              <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full md:min-h-[380px] overflow-hidden rounded-2xl bg-zinc-900">

                {/* Gradient fallback layer (always rendered, behind image) */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e4d7b 100%)',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                </div>

                {/* Photo layer — featured listing OR static fallback */}
                {heroImageSrc && (
                  <Image
                    src={heroImageSrc}
                    alt={heroImageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 460px"
                    className="object-cover opacity-90"
                    priority
                  />
                )}

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                {/* Overlay info card — featured listing */}
                {heroListing && (
                  <Link
                    href={`/ilanlar/${heroListing.id}/${heroListing.slug}`}
                    className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-3 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                          Öne Çıkan İlan
                        </p>
                        <p className="text-sm font-semibold text-white line-clamp-1">
                          {heroListing.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-white">
                            {formatPrice(heroListing.price, heroListing.currency)}
                          </span>
                          {heroListing.district && (
                            <span className="flex items-center gap-1 text-[10px] text-white/60">
                              <MapPin className="h-2.5 w-2.5" />
                              {heroListing.district}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Overlay card — no featured listing */}
                {!heroListing && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">
                      Pozitif Gayrimenkul
                    </p>
                    <p className="text-sm font-medium text-white/80">
                      İzmir&apos;in seçkin lokasyonlarında gayrimenkul danışmanlığı
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ─────────────────────────────────────────── */}
      {featuredListings.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
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

      {/* ── WHY POZITIF ───────────────────────────────────────────────── */}
      <section className="border-y border-zinc-100 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_2fr] md:items-start">

            <div className="md:pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                Neden Biz?
              </p>
              <h2 className="text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl">
                Neden<br />Pozitif Gayrimenkul?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 max-w-xs">
                Doğru mülkü bulmak için doğru ortağa ihtiyacınız var.
              </p>
              <Link
                href="/iletisim"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-900 hover:underline underline-offset-2"
              >
                Bize Ulaşın <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-zinc-100">
              <div className="flex gap-5 py-5 first:pt-0 last:pb-0">
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 mt-0.5">
                  <MapPin className="h-5 w-5 text-blue-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Yerel Uzmanlık</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    İzmir&apos;in her ilçesini, semtini ve değerini bilen, sahada deneyimli bir ekip.
                    Hangi sokağın değer kazandığını biz biliriz.
                  </p>
                </div>
              </div>
              <div className="flex gap-5 py-5 first:pt-0 last:pb-0">
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 mt-0.5">
                  <Star className="h-5 w-5 text-blue-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Seçili Portföy</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    Her mülkü listelemiyoruz. Yalnızca bizzat değerlendirdiğimiz, güvendiğimiz
                    mülkleri portföyümüzde sunuyoruz.
                  </p>
                </div>
              </div>
              <div className="flex gap-5 py-5 first:pt-0 last:pb-0">
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 mt-0.5">
                  <Shield className="h-5 w-5 text-blue-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Şeffaf Süreç</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    Fiyat, tapu, hukuki durum — tüm detayları baştan paylaşıyoruz.
                    Sürecin her adımında yanınızdayız.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COASTAL DISTRICTS ─────────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
              Bölgeler
            </p>
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Yazlık Bölgeler</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              İzmir&apos;in en gözde sahil ve yazlık bölgelerinde ilan arayın
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {IZMIR_COASTAL_DISTRICTS.map((district) => {
              const cfg = DISTRICT_CONFIG[district] ?? DEFAULT_DISTRICT
              return (
                <Link
                  key={district}
                  href={`/ilanlar?district=${encodeURIComponent(district)}`}
                  className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${cfg.bg} ${cfg.border}`}
                >
                  {/* Future: if cfg.imageUrl render a background <Image> here */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60">
                    <Waves className={`h-4 w-4 ${cfg.text}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${cfg.text}`}>{district}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">İlan ara</p>
                  </div>
                  <ArrowUpRight
                    className={`absolute top-3 right-3 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${cfg.text}`}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="mx-4 mb-10 overflow-hidden rounded-3xl bg-blue-900 sm:mx-6 md:mx-auto md:max-w-6xl">
        <div className="relative px-8 py-12 text-center md:py-14">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300 mb-3">
              Satmak İstiyorsanız
            </p>
            <h2 className="text-xl font-bold text-white sm:text-2xl max-w-lg mx-auto">
              Gayrimenkulünüzü Satmak mı İstiyorsunuz?
            </h2>
            <p className="mt-2.5 text-blue-200 text-sm leading-relaxed max-w-sm mx-auto">
              Profesyonel ekibimizle doğru fiyatlandırma ve hızlı satış için hemen iletişime geçin.
            </p>
            <Link
              href="/iletisim"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
            >
              Bizimle İletişime Geçin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="h-2" />
    </div>
  )
}