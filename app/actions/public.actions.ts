'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Listing, ListingImage, Agent, HeatingType, BuildingAgeRange, FloorRange, SortOption } from '@/lib/types'

// ── Shared joined type for public listing queries ──────────
export type PublicListing = Listing & {
  listing_images: Pick<
    ListingImage,
    'id' | 'url' | 'is_cover' | 'display_order' | 'storage_path' | 'listing_id' | 'created_at'
  >[]
  agents: Pick<Agent, 'full_name' | 'title' | 'phone' | 'avatar_url'> | null
}

export type PublicListingsResult = {
  listings: PublicListing[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type PublicListingFilters = {
  // Basic filters
  listing_type?: string
  property_type?: string
  district?: string
  min_price?: number
  max_price?: number
  rooms?: number
  // Advanced filters
  min_area?: number
  max_area?: number
  building_age?: BuildingAgeRange
  floor_range?: FloorRange
  bathrooms?: number
  heating_type?: HeatingType
  is_furnished?: boolean
  has_balcony?: boolean
  has_elevator?: boolean
  has_parking?: boolean
  is_in_complex?: boolean
  max_dues?: number
  max_deposit?: number
  // Sorting & pagination
  sort?: SortOption
  page?: number
  per_page?: number
}

// ── applyPublicListingFilters ──────────────────────────────
// Single source of truth for filter logic — used by both
// the data query and (implicitly) any future count-only query.
// Returns the mutated query builder.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPublicListingFilters(query: any, filters: PublicListingFilters): any {
  const {
    listing_type,
    property_type,
    district,
    min_price,
    max_price,
    rooms,
    min_area,
    max_area,
    building_age,
    floor_range,
    bathrooms,
    heating_type,
    is_furnished,
    has_balcony,
    has_elevator,
    has_parking,
    is_in_complex,
    max_dues,
    max_deposit,
  } = filters

  // Basic filters
  if (listing_type) query = query.eq('listing_type', listing_type)
  if (property_type) query = query.eq('property_type', property_type)
  if (district) query = query.eq('district', district)
  if (min_price != null) query = query.gte('price', min_price)
  if (max_price != null) query = query.lte('price', max_price)
  if (rooms != null) {
    if (rooms >= 4) {
      query = query.gte('rooms', 4)
    } else {
      query = query.eq('rooms', rooms)
    }
  }

  // Area filter
  if (min_area != null) query = query.gte('area_m2', min_area)
  if (max_area != null) query = query.lte('area_m2', max_area)

  // Building age range
  if (building_age != null) {
    if (building_age === '0') {
      query = query.eq('building_age', 0)
    } else if (building_age === '26+') {
      query = query.gte('building_age', 26)
    } else {
      const [minAge, maxAge] = building_age.split('-').map(Number)
      query = query.gte('building_age', minAge).lte('building_age', maxAge)
    }
  }

  // Floor range
  if (floor_range != null) {
    if (floor_range === '0') {
      query = query.eq('floor', 0)
    } else if (floor_range === '8+') {
      query = query.gte('floor', 8)
    } else {
      const [minFloor, maxFloor] = floor_range.split('-').map(Number)
      query = query.gte('floor', minFloor).lte('floor', maxFloor)
    }
  }

  // Bathrooms (minimum)
  if (bathrooms != null) query = query.gte('bathrooms', bathrooms)

  // Heating type
  if (heating_type) query = query.eq('heating_type', heating_type)

  // Boolean feature filters (only filter when true)
  if (is_furnished === true) query = query.eq('is_furnished', true)
  if (has_balcony === true) query = query.eq('has_balcony', true)
  if (has_elevator === true) query = query.eq('has_elevator', true)
  if (has_parking === true) query = query.eq('has_parking', true)
  if (is_in_complex === true) query = query.eq('is_in_complex', true)

  // Dues & deposit maximums
  if (max_dues != null) query = query.lte('dues', max_dues)
  if (max_deposit != null) query = query.lte('deposit', max_deposit)

  return query
}

// ── applySorting ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySorting(query: any, sort: SortOption = 'featured'): any {
  switch (sort) {
    case 'price_asc':
      return query.order('price', { ascending: true })
    case 'price_desc':
      return query.order('price', { ascending: false })
    case 'area_desc':
      return query.order('area_m2', { ascending: false })
    case 'newest':
      return query.order('created_at', { ascending: false })
    case 'featured':
    default:
      return query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
  }
}

// ── getFeaturedListings ────────────────────────────────────
export async function getFeaturedListings(): Promise<PublicListing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images(id, url, storage_path, display_order, is_cover, listing_id, created_at),
      agents(full_name, title, phone, avatar_url)
    `)
    .eq('status', 'aktif')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('getFeaturedListings error:', error)
    return []
  }

  return (data ?? []).map((listing) => ({
    ...listing,
    listing_images: (
      listing.listing_images as PublicListing['listing_images']
    ).filter((img) => img.is_cover),
  })) as PublicListing[]
}

// ── getPublicListings ──────────────────────────────────────
export async function getPublicListings(
  filters: PublicListingFilters = {}
): Promise<PublicListingsResult> {
  const supabase = await createClient() as SupabaseClient
  const {
    sort = 'featured',
    page = 1,
    per_page = 12,
  } = filters

  const from = (page - 1) * per_page
  const to = from + per_page - 1

  // Build base query — same filters applied to both data+count in a single round-trip
  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_images(id, url, storage_path, display_order, is_cover, listing_id, created_at),
      agents(full_name, title, phone, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'aktif')

  // Apply all filters via shared helper (guarantees count & data use identical predicates)
  query = applyPublicListingFilters(query, filters)

  // Apply sorting
  query = applySorting(query, sort)

  // Paginate
  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('getPublicListings error:', error)
    return { listings: [], total: 0, page, per_page, total_pages: 0 }
  }

  const total = count ?? 0
  const total_pages = Math.ceil(total / per_page)

  const listings = (data ?? []).map((listing) => ({
    ...listing,
    listing_images: (
      listing.listing_images as PublicListing['listing_images']
    ).filter((img) => img.is_cover),
  })) as PublicListing[]

  return { listings, total, page, per_page, total_pages }
}

// ── getPublicListing ───────────────────────────────────────
export async function getPublicListing(id: string): Promise<PublicListing | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images(id, url, storage_path, display_order, is_cover, listing_id, created_at),
      agents(full_name, title, phone, avatar_url)
    `)
    .eq('id', id)
    .eq('status', 'aktif')
    .single()

  if (error) {
    console.error('getPublicListing error:', error)
    return null
  }

  if (!data) return null

  return {
    ...data,
    listing_images: (data.listing_images as PublicListing['listing_images']).sort(
      (a, b) => a.display_order - b.display_order
    ),
  } as PublicListing
}

// ── getRelatedListings ─────────────────────────────────────
export async function getRelatedListings(
  listingId: string,
  district: string,
  listing_type: string
): Promise<PublicListing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images(id, url, storage_path, display_order, is_cover, listing_id, created_at),
      agents(full_name, title, phone, avatar_url)
    `)
    .eq('status', 'aktif')
    .eq('district', district)
    .eq('listing_type', listing_type)
    .neq('id', listingId)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('getRelatedListings error:', error)
    return []
  }

  return (data ?? []).map((listing) => ({
    ...listing,
    listing_images: (
      listing.listing_images as PublicListing['listing_images']
    ).filter((img) => img.is_cover),
  })) as PublicListing[]
}

// ── getDistrictsWithListings ───────────────────────────────
export async function getDistrictsWithListings(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('district')
    .eq('status', 'aktif')
    .not('district', 'is', null)

  if (error) {
    console.error('getDistrictsWithListings error:', error)
    return []
  }

  const unique = Array.from(
    new Set(
      (data ?? [])
        .map((row: { district: string | null }) => row.district)
        .filter((d): d is string => Boolean(d))
    )
  ).sort() as string[]

  return unique
}
