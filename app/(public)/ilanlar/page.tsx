import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPublicListings, getDistrictsWithListings } from '@/app/actions/public.actions'
import FilterBar from '@/components/public/FilterBar'
import ListingGrid from '@/components/public/ListingGrid'
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/lib/constants'

interface SearchParams {
  listing_type?: string
  property_type?: string
  district?: string
  min_price?: string
  max_price?: string
  rooms?: string
  page?: string
}

interface ListingsPageProps {
  searchParams: SearchParams
}

export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
  const parts: string[] = []

  if (searchParams.listing_type) {
    const lt = (LISTING_TYPE_LABELS as Record<string, string>)[searchParams.listing_type]
    if (lt) parts.push(lt)
  }
  if (searchParams.property_type) {
    const pt = PROPERTY_TYPE_LABELS[searchParams.property_type as keyof typeof PROPERTY_TYPE_LABELS]
    if (pt) parts.push(`${pt}ler`)
  }
  if (searchParams.district) {
    parts.push(searchParams.district)
  }

  const title =
    parts.length > 0
      ? `${parts.join(' ')} İlanları | Pozitif Emlak`
      : 'İlanlar | Pozitif Emlak'

  return { title }
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const filters = {
    listing_type: searchParams.listing_type,
    property_type: searchParams.property_type,
    district: searchParams.district,
    min_price: searchParams.min_price ? parseFloat(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? parseFloat(searchParams.max_price) : undefined,
    rooms: searchParams.rooms ? parseInt(searchParams.rooms, 10) : undefined,
    page,
    per_page: 12,
  }

  const [result, availableDistricts] = await Promise.all([
    getPublicListings(filters),
    getDistrictsWithListings(),
  ])

  const { listings, total, total_pages } = result

  // Build page title summary
  const filterParts: string[] = []
  if (searchParams.listing_type) {
    filterParts.push(
      (LISTING_TYPE_LABELS as Record<string, string>)[searchParams.listing_type] ?? ''
    )
  }
  if (searchParams.property_type) {
    filterParts.push(
      PROPERTY_TYPE_LABELS[searchParams.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? ''
    )
  }
  if (searchParams.district) {
    filterParts.push(searchParams.district)
  }
  const pageTitle =
    filterParts.length > 0 ? filterParts.filter(Boolean).join(' ') + ' İlanları' : 'Tüm İlanlar'

  function buildPageUrl(p: number) {
    const params = new URLSearchParams()
    if (searchParams.listing_type) params.set('listing_type', searchParams.listing_type)
    if (searchParams.property_type) params.set('property_type', searchParams.property_type)
    if (searchParams.district) params.set('district', searchParams.district)
    if (searchParams.min_price) params.set('min_price', searchParams.min_price)
    if (searchParams.max_price) params.set('max_price', searchParams.max_price)
    if (searchParams.rooms) params.set('rooms', searchParams.rooms)
    params.set('page', String(p))
    return `/ilanlar?${params.toString()}`
  }

  const hasActiveFilters = Object.entries(searchParams).some(
    ([k, v]) => k !== 'page' && Boolean(v)
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{pageTitle}</h1>
        {total > 0 && (
          <p className="mt-1 text-sm text-zinc-500">
            {total} ilan bulundu
            {page > 1 && ` — Sayfa ${page} / ${total_pages}`}
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-8">
        <FilterBar
          currentFilters={{
            listing_type: searchParams.listing_type,
            property_type: searchParams.property_type,
            district: searchParams.district,
            min_price: searchParams.min_price,
            max_price: searchParams.max_price,
            rooms: searchParams.rooms,
          }}
          availableDistricts={availableDistricts}
          totalCount={total}
        />
      </div>

      {/* Listings grid or empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-base font-medium text-zinc-600">
            Bu kriterlere uygun ilan bulunamadı.
          </p>
          {hasActiveFilters && (
            <Link
              href="/ilanlar"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Filtreleri Temizle
            </Link>
          )}
        </div>
      ) : (
        <ListingGrid listings={listings} priorityCount={3} />
      )}

      {/* Pagination */}
      {total_pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-300 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </span>
          )}

          <span className="text-sm text-zinc-600">
            {page} / {total_pages}
          </span>

          {page < total_pages ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-300 cursor-not-allowed">
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}