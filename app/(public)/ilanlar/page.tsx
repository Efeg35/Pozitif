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
import type { BuildingAgeRange, FloorRange, HeatingType, SortOption } from '@/lib/types'

interface SearchParams {
  listing_type?: string
  property_type?: string
  district?: string
  min_price?: string
  max_price?: string
  rooms?: string
  min_area?: string
  max_area?: string
  building_age?: string
  floor_range?: string
  bathrooms?: string
  heating_type?: string
  is_furnished?: string
  has_balcony?: string
  has_elevator?: string
  has_parking?: string
  is_in_complex?: string
  max_dues?: string
  max_deposit?: string
  sort?: string
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
  if (searchParams.district) parts.push(searchParams.district)

  return {
    title:
      parts.length > 0
        ? `${parts.join(' ')} İlanları | Pozitif Gayrimenkul`
        : 'İlanlar | Pozitif Gayrimenkul',
  }
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const filters = {
    listing_type:  searchParams.listing_type,
    property_type: searchParams.property_type,
    district:      searchParams.district,
    min_price:     searchParams.min_price    ? parseFloat(searchParams.min_price)    : undefined,
    max_price:     searchParams.max_price    ? parseFloat(searchParams.max_price)    : undefined,
    rooms:         searchParams.rooms        ? parseInt(searchParams.rooms, 10)       : undefined,
    min_area:      searchParams.min_area     ? parseFloat(searchParams.min_area)     : undefined,
    max_area:      searchParams.max_area     ? parseFloat(searchParams.max_area)     : undefined,
    building_age:  searchParams.building_age as BuildingAgeRange | undefined,
    floor_range:   searchParams.floor_range  as FloorRange | undefined,
    bathrooms:     searchParams.bathrooms    ? parseInt(searchParams.bathrooms, 10)  : undefined,
    heating_type:  searchParams.heating_type as HeatingType | undefined,
    is_furnished:  searchParams.is_furnished  === 'true' ? true : undefined,
    has_balcony:   searchParams.has_balcony   === 'true' ? true : undefined,
    has_elevator:  searchParams.has_elevator  === 'true' ? true : undefined,
    has_parking:   searchParams.has_parking   === 'true' ? true : undefined,
    is_in_complex: searchParams.is_in_complex === 'true' ? true : undefined,
    max_dues:      searchParams.max_dues     ? parseFloat(searchParams.max_dues)     : undefined,
    max_deposit:   searchParams.max_deposit  ? parseFloat(searchParams.max_deposit)  : undefined,
    sort:          (searchParams.sort as SortOption | undefined),
    page,
    per_page: 12,
  }

  const [result, availableDistricts] = await Promise.all([
    getPublicListings(filters),
    getDistrictsWithListings(),
  ])

  const { listings, total, total_pages } = result

  // Page title summary
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
  if (searchParams.district) filterParts.push(searchParams.district)
  const pageTitle =
    filterParts.filter(Boolean).length > 0
      ? filterParts.filter(Boolean).join(' ') + ' İlanları'
      : 'Tüm İlanlar'

  // Build a URL for a given page number, preserving all current filters
  function buildPageUrl(p: number): string {
    const params = new URLSearchParams()
    const sp = searchParams
    if (sp.listing_type)  params.set('listing_type',  sp.listing_type)
    if (sp.property_type) params.set('property_type', sp.property_type)
    if (sp.district)      params.set('district',      sp.district)
    if (sp.min_price)     params.set('min_price',     sp.min_price)
    if (sp.max_price)     params.set('max_price',     sp.max_price)
    if (sp.rooms)         params.set('rooms',         sp.rooms)
    if (sp.min_area)      params.set('min_area',      sp.min_area)
    if (sp.max_area)      params.set('max_area',      sp.max_area)
    if (sp.building_age)  params.set('building_age',  sp.building_age)
    if (sp.floor_range)   params.set('floor_range',   sp.floor_range)
    if (sp.bathrooms)     params.set('bathrooms',     sp.bathrooms)
    if (sp.heating_type)  params.set('heating_type',  sp.heating_type)
    if (sp.is_furnished === 'true')  params.set('is_furnished',  'true')
    if (sp.has_balcony  === 'true')  params.set('has_balcony',   'true')
    if (sp.has_elevator === 'true')  params.set('has_elevator',  'true')
    if (sp.has_parking  === 'true')  params.set('has_parking',   'true')
    if (sp.is_in_complex === 'true') params.set('is_in_complex', 'true')
    if (sp.max_dues)      params.set('max_dues',      sp.max_dues)
    if (sp.max_deposit)   params.set('max_deposit',   sp.max_deposit)
    if (sp.sort)          params.set('sort',          sp.sort)
    params.set('page', String(p))
    return `/ilanlar?${params.toString()}`
  }

  const hasActiveFilters = Object.entries(searchParams).some(
    ([k, v]) => k !== 'page' && Boolean(v)
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Heading */}
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
            listing_type:  searchParams.listing_type,
            property_type: searchParams.property_type,
            district:      searchParams.district,
            min_price:     searchParams.min_price,
            max_price:     searchParams.max_price,
            rooms:         searchParams.rooms,
            min_area:      searchParams.min_area,
            max_area:      searchParams.max_area,
            building_age:  searchParams.building_age,
            floor_range:   searchParams.floor_range,
            bathrooms:     searchParams.bathrooms,
            heating_type:  searchParams.heating_type,
            is_furnished:  searchParams.is_furnished,
            has_balcony:   searchParams.has_balcony,
            has_elevator:  searchParams.has_elevator,
            has_parking:   searchParams.has_parking,
            is_in_complex: searchParams.is_in_complex,
            max_dues:      searchParams.max_dues,
            max_deposit:   searchParams.max_deposit,
            sort:          searchParams.sort,
          }}
          availableDistricts={availableDistricts}
          totalCount={total}
        />
      </div>

      {/* Listings or empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-base font-medium text-zinc-600">
            Bu kriterlere uygun ilan bulunamadı.
          </p>
          {hasActiveFilters && (
            <Link
              href="/ilanlar"
              className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
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