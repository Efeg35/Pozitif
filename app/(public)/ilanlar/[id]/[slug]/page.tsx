import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Maximize2, BedDouble, Bath, Layers, Calendar, Flame, ChevronRight, MessageCircle } from 'lucide-react'
import { getPublicListing, getRelatedListings, getOfficeSettings } from '@/app/actions/public.actions'
import ListingGallery from '@/components/public/ListingGallery'
import InquiryForm from '@/components/public/InquiryForm'
import ListingGrid from '@/components/public/ListingGrid'
import { formatPrice } from '@/lib/utils'
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, STATUS_LABELS } from '@/lib/constants'

interface Params {
  id: string
  slug: string
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const listing = await getPublicListing(params.id)
  if (!listing) return { title: 'İlan bulunamadı | Pozitif Gayrimenkul' }

  const coverImage = listing.listing_images.find((img) => img.is_cover) ?? listing.listing_images[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pozitifemiak.com'

  return {
    title: `${listing.title} | Pozitif Gayrimenkul`,
    description:
      listing.description?.slice(0, 160) ??
      `${LISTING_TYPE_LABELS[listing.listing_type] ?? ''} ${PROPERTY_TYPE_LABELS[listing.property_type] ?? ''} — ${listing.district ?? ''} ${listing.city}`,
    openGraph: {
      title: listing.title,
      images: coverImage ? [coverImage.url] : [],
      url: `${siteUrl}/ilanlar/${listing.id}/${listing.slug}`,
    },
    robots: { index: true, follow: true },
  }
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const [listing, settings] = await Promise.all([
    getPublicListing(params.id),
    getOfficeSettings(),
  ])

  if (!listing) notFound()

  const relatedListings =
    listing.district
      ? await getRelatedListings(listing.id, listing.district, listing.listing_type)
      : []

  const agent = listing.agents
  const showStatusBadge = listing.status === 'satildi' || listing.status === 'kiralandi'

  const waPhone = settings?.whatsapp ?? settings?.phone
  const waMessage = encodeURIComponent(
    `Merhaba, "${listing.title}" ilanı hakkında bilgi almak istiyorum.`
  )
  const waLink = waPhone
    ? `https://wa.me/${waPhone.replace(/\D/g, '')}?text=${waMessage}`
    : null

  const roomsLabel =
    listing.rooms != null && listing.living_rooms != null
      ? `${listing.rooms}+${listing.living_rooms}`
      : listing.rooms != null
        ? `${listing.rooms} oda`
        : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-700">Ana Sayfa</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/ilanlar" className="hover:text-zinc-700">İlanlar</Link>
        {listing.district && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/ilanlar?district=${encodeURIComponent(listing.district)}`} className="hover:text-zinc-700">
              {listing.district}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-700 line-clamp-1">{listing.title}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          {/* Gallery */}
          <ListingGallery images={listing.listing_images} title={listing.title} />

          {/* Title + status */}
          <div>
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="flex-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
                {listing.title}
              </h1>
              {showStatusBadge && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                  {STATUS_LABELS[listing.status]}
                </span>
              )}
            </div>
            <p className="mt-2 text-3xl font-extrabold text-blue-700">
              {formatPrice(listing.price, listing.currency)}
            </p>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listing.area_m2 != null && (
              <SpecItem icon={<Maximize2 className="h-4 w-4" />} label="Alan" value={`${listing.area_m2} m²`} />
            )}
            {roomsLabel && (
              <SpecItem icon={<BedDouble className="h-4 w-4" />} label="Oda" value={roomsLabel} />
            )}
            {listing.bathrooms != null && (
              <SpecItem icon={<Bath className="h-4 w-4" />} label="Banyo" value={String(listing.bathrooms)} />
            )}
            {listing.floor != null && (
              <SpecItem icon={<Layers className="h-4 w-4" />} label="Kat" value={`${listing.floor}${listing.total_floors ? ` / ${listing.total_floors}` : ''}`} />
            )}
            {listing.building_age != null && (
              <SpecItem icon={<Calendar className="h-4 w-4" />} label="Bina Yaşı" value={listing.building_age === 0 ? 'Sıfır' : `${listing.building_age} yıl`} />
            )}
            {listing.heating_type && (
              <SpecItem icon={<Flame className="h-4 w-4" />} label="Isıtma" value={listing.heating_type} />
            )}
          </div>

          {/* Boolean features */}
          {(listing.is_furnished || listing.has_balcony || listing.has_elevator || listing.has_parking || listing.is_in_complex) && (
            <div className="flex flex-wrap gap-2">
              {listing.is_furnished && <FeatureChip label="Eşyalı" />}
              {listing.has_balcony && <FeatureChip label="Balkon" />}
              {listing.has_elevator && <FeatureChip label="Asansör" />}
              {listing.has_parking && <FeatureChip label="Otopark" />}
              {listing.is_in_complex && <FeatureChip label="Site İçinde" />}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">Açıklama</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">
                {listing.description}
              </p>
            </div>
          )}

          {/* Location */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-800">Konum</h2>
            <div className="flex items-start gap-2 text-sm text-zinc-600">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <div>
                {listing.address && <p>{listing.address}</p>}
                <p>
                  {[listing.district, listing.city].filter(Boolean).join(' / ')}
                </p>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50">
              <p className="text-xs text-zinc-400">Harita yakında eklenecek</p>
            </div>
          </div>

          {/* Related listings */}
          {relatedListings.length > 0 && (
            <div>
              <h2 className="mb-5 text-lg font-semibold text-zinc-800">Benzer İlanlar</h2>
              <ListingGrid listings={relatedListings} priorityCount={0} />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — sticky */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="sticky top-24 flex flex-col gap-5">
            {/* Price card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-extrabold text-blue-700">
                {formatPrice(listing.price, listing.currency)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-500">
                  {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
                </span>
              </div>
            </div>

            {/* Agent card */}
            {agent && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 flex-shrink-0">
                    {agent.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.avatar_url}
                        alt={agent.full_name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      agent.full_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-800">{agent.full_name}</p>
                    {agent.title && <p className="text-xs text-zinc-500">{agent.title}</p>}
                  </div>
                </div>
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-blue-500" />
                    {agent.phone}
                  </a>
                )}
              </div>
            )}

            {/* Inquiry form card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-zinc-800">Bilgi Al</h3>
              <InquiryForm listingId={listing.id} listingTitle={listing.title} />
            </div>

            {/* WhatsApp button */}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp ile İletişim
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small helper components ────────────────────────────────────

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
      <span className="text-blue-500">{icon}</span>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-800">{value}</p>
      </div>
    </div>
  )
}

function FeatureChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
      ✓ {label}
    </span>
  )
}