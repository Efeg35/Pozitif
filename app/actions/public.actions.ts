'use server'

import { createClient } from '@/lib/supabase/server'
import type { Listing, ListingImage, Agent, OfficeSettings } from '@/lib/types'

// ── Shared joined type for public listing queries ──────────────
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
  listing_type?: string
  property_type?: string
  district?: string
  min_price?: number
  max_price?: number
  rooms?: number
  page?: number
  per_page?: number
}

// ── getFeaturedListings ────────────────────────────────────────
// Returns up to 6 featured active listings with cover image + agent name.
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

// ── getPublicListings ──────────────────────────────────────────
// Returns paginated active listings with optional filters.
export async function getPublicListings(
  filters: PublicListingFilters = {}
): Promise<PublicListingsResult> {
  const supabase = await createClient()
  const {
    listing_type,
    property_type,
    district,
    min_price,
    max_price,
    rooms,
    page = 1,
    per_page = 12,
  } = filters

  const from = (page - 1) * per_page
  const to = from + per_page - 1

  // Single query — returns both data and count in one round-trip
  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_images(id, url, storage_path, display_order, is_cover, listing_id, created_at),
      agents(full_name, title, phone, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'aktif')

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

  const { data, count, error } = await query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

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

// ── getPublicListing ───────────────────────────────────────────
// Returns a single active listing with all images and full agent info.
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

  // Sort images by display_order
  return {
    ...data,
    listing_images: (data.listing_images as PublicListing['listing_images']).sort(
      (a, b) => a.display_order - b.display_order
    ),
  } as PublicListing
}

// ── getRelatedListings ─────────────────────────────────────────
// Returns up to 3 active listings in the same district + type (excluding current).
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

// ── getDistrictsWithListings ───────────────────────────────────
// Returns unique districts that have at least one active listing.
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

// ── getOfficeSettings ──────────────────────────────────────────
// Returns the first (and only) office_settings row, or null if none.
export async function getOfficeSettings(): Promise<OfficeSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('office_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getOfficeSettings error:', error)
    return null
  }

  return data as OfficeSettings | null
}