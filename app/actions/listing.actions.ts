'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { LISTING_STATUSES } from '@/lib/constants'
import {
  createListingSchema,
  updateListingSchema,
  type CreateListingInput,
  type UpdateListingInput,
} from '@/lib/schemas/listing.schema'
import type { Listing } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedAgent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { supabase, user, isAdmin: agent?.is_admin ?? false }
}

/** Ensures a slug is unique in the listings table. Appends -2, -3, ... if needed. Max 50 attempts. */
async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 2

  while (counter <= 50) {
    let query = supabase.from('listings').select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Fallback: append timestamp to guarantee uniqueness
  return `${baseSlug}-${Date.now()}`
}

// ── Queries ───────────────────────────────────────────────────

interface ListingFilters {
  status?: string
  listing_type?: string
  district?: string
}

export async function getListings(
  filters?: ListingFilters
): Promise<ActionResult<Listing[]>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('listings')
      .select('*, listing_images(id, url, is_cover, display_order), agents(full_name)')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.listing_type) query = query.eq('listing_type', filters.listing_type)
    if (filters?.district) query = query.eq('district', filters.district)

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as Listing[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getListing(id: string): Promise<ActionResult<Listing & { listing_images: unknown[]; agents: unknown }>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('listings')
      .select('*, listing_images(*), agents(full_name, title)')
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    const { data, error } = await query.single()

    if (error || !data) return { success: false, error: 'İlan bulunamadı' }
    return { success: true, data: data as unknown as Listing & { listing_images: unknown[]; agents: unknown } }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Mutations ─────────────────────────────────────────────────

export async function createListing(
  input: CreateListingInput
): Promise<ActionResult<Listing>> {
  try {
    const { supabase, user } = await getAuthenticatedAgent()

    const parsed = createListingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    const data = parsed.data

    // Generate slug from title if not provided / too short
    const baseSlug = data.slug?.trim() ? slugify(data.slug) : slugify(data.title)
    const slug = await ensureUniqueSlug(supabase, baseSlug)

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        ...data,
        slug,
        agent_id: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: listing as unknown as Listing }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateListing(
  id: string,
  input: UpdateListingInput
): Promise<ActionResult<Listing>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    const parsed = updateListingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('listings')
      .select('id, agent_id, title, slug')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'İlan bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const updateData = parsed.data

    // If title changed and slug wasn't manually changed, regenerate slug
    if (updateData.title !== existing.title && updateData.slug === existing.slug) {
      const baseSlug = slugify(updateData.title)
      updateData.slug = await ensureUniqueSlug(supabase, baseSlug, id)
    } else if (updateData.slug && updateData.slug !== existing.slug) {
      const baseSlug = slugify(updateData.slug)
      updateData.slug = await ensureUniqueSlug(supabase, baseSlug, id)
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: listing as unknown as Listing }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteListing(id: string): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Verify ownership
    const { data: existing } = await supabase
      .from('listings')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'İlan bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    // Fetch all images to get storage paths
    const { data: images } = await supabase
      .from('listing_images')
      .select('storage_path')
      .eq('listing_id', id)

    // Delete from Storage (bulk)
    if (images && images.length > 0) {
      const paths = images.map((img: { storage_path: string }) => img.storage_path)
      await supabase.storage.from('listing-images').remove(paths)
    }

    // Delete listing row (cascade handles listing_images rows)
    const { error } = await supabase.from('listings').delete().eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateListingStatus(
  id: string,
  status: string
): Promise<ActionResult<Listing>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    if (!(LISTING_STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: 'Geçersiz durum değeri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('listings')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'İlan bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: listing as unknown as Listing }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function toggleFeatured(id: string): Promise<ActionResult<Listing>> {
  try {
    const { supabase, isAdmin } = await getAuthenticatedAgent()

    if (!isAdmin) {
      return { success: false, error: 'Bu işlem yalnızca yöneticiler tarafından yapılabilir' }
    }

    const { data: existing } = await supabase
      .from('listings')
      .select('id, is_featured')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'İlan bulunamadı' }

    const { data: listing, error } = await supabase
      .from('listings')
      .update({ is_featured: !existing.is_featured })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: listing as unknown as Listing }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}