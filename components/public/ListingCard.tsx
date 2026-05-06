import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Home, Maximize2, BedDouble } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { PROPERTY_TYPE_LABELS, STATUS_LABELS, LISTING_TYPE_LABELS } from '@/lib/constants'
import type { PublicListing } from '@/app/actions/public.actions'

interface ListingCardProps {
  listing: PublicListing
  priority?: boolean
}

export default function ListingCard({ listing, priority = false }: ListingCardProps) {
  const coverImage = listing.listing_images.find((img) => img.is_cover) ?? listing.listing_images[0]
  const roomsLabel =
    listing.rooms != null && listing.living_rooms != null
      ? `${listing.rooms}+${listing.living_rooms}`
      : listing.rooms != null
        ? `${listing.rooms} oda`
        : null

  const showStatusBadge = listing.status === 'satildi' || listing.status === 'kiralandi'

  return (
    <Link
      href={`/ilanlar/${listing.id}/${listing.slug}`}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100">
            <Home className="h-12 w-12 text-zinc-300" />
          </div>
        )}

        {/* Status badge — only for sold/rented */}
        {showStatusBadge && (
          <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {STATUS_LABELS[listing.status]}
          </span>
        )}

        {/* Featured badge */}
        {listing.is_featured && (
          <span className="absolute top-2 right-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            Öne Çıkan
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Price */}
        <p className="text-xl font-bold text-blue-700">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {/* Title */}
        <p className="text-sm font-medium text-zinc-800 line-clamp-1">{listing.title}</p>

        {/* Location */}
        {(listing.district || listing.city) && (
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {[listing.district, listing.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs text-zinc-600 mt-1">
          {roomsLabel && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {roomsLabel}
            </span>
          )}
          {listing.area_m2 != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {listing.area_m2} m²
            </span>
          )}
          {listing.floor != null &&
            (listing.property_type === 'daire' || listing.property_type === 'ofis') && (
              <span>{listing.floor}. kat</span>
            )}
        </div>

        {/* Type badges row */}
        <div className="flex items-center gap-2 mt-1">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
            {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
          </span>
        </div>
      </div>
    </Link>
  )
}