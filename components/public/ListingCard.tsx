import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Home, Maximize2, BedDouble } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from '@/lib/constants'
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

  const isSoldOrRented = listing.status === 'satildi' || listing.status === 'kiralandi'

  return (
    <Link
      href={`/ilanlar/${listing.id}/${listing.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white overflow-hidden shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] overflow-hidden bg-zinc-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50">
            <Home className="h-10 w-10 text-zinc-300" />
          </div>
        )}

        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Listing type pill */}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
          {LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
        </span>

        {/* Sold/rented overlay */}
        {isSoldOrRented && (
          <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
              {listing.status === 'satildi' ? 'Satıldı' : 'Kiralındı'}
            </span>
          </div>
        )}

        {/* Featured indicator */}
        {listing.is_featured && !isSoldOrRented && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Öne Çıkan
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-4">
        {/* Price */}
        <p className="text-lg font-bold text-zinc-900">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {/* Title */}
        <p className="text-sm font-medium text-zinc-700 line-clamp-1 leading-snug">{listing.title}</p>

        {/* Location */}
        {(listing.district || listing.city) && (
          <p className="flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {[listing.district, listing.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Specs row */}
        <div className="flex items-center gap-3 pt-1 border-t border-zinc-50 text-xs text-zinc-500">
          {roomsLabel && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-zinc-400" />
              {roomsLabel}
            </span>
          )}
          {listing.area_m2 != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
              {listing.area_m2} m²
            </span>
          )}
          <span className="ml-auto text-zinc-400 text-[11px]">
            {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
          </span>
        </div>
      </div>
    </Link>
  )
}