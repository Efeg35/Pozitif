'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES_PER_LISTING,
} from '@/lib/constants'
import type { ListingImage } from '@/lib/types'

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

async function verifyListingOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  const { data } = await supabase
    .from('listings')
    .select('agent_id')
    .eq('id', listingId)
    .single()

  if (!data) return false
  if (isAdmin) return true
  return data.agent_id === userId
}

/** Sanitize filename: lowercase, replace unsafe chars with dashes */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
}

// ── Actions ───────────────────────────────────────────────────

export async function uploadListingImage(
  listingId: string,
  file: File
): Promise<ActionResult<ListingImage>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Server-side validation
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return {
        success: false,
        error: 'Geçersiz dosya türü. Yalnızca JPEG, PNG ve WebP yüklenebilir.',
      }
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return {
        success: false,
        error: `Dosya boyutu ${MAX_IMAGE_SIZE_MB} MB'dan küçük olmalıdır.`,
      }
    }

    // Verify listing ownership
    const owns = await verifyListingOwnership(supabase, listingId, user.id, isAdmin)
    if (!owns) return { success: false, error: 'Bu ilanın görsellerini düzenleme yetkiniz yok' }

    // Count existing images
    const { count } = await supabase
      .from('listing_images')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)

    const currentCount = count ?? 0
    if (currentCount >= MAX_IMAGES_PER_LISTING) {
      return {
        success: false,
        error: `En fazla ${MAX_IMAGES_PER_LISTING} görsel yükleyebilirsiniz.`,
      }
    }

    // Build storage path
    const safeName = sanitizeFilename(file.name)
    const storagePath = `${listingId}/${Date.now()}-${safeName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) return { success: false, error: uploadError.message }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('listing-images').getPublicUrl(storagePath)

    // First image is always the cover
    const isCover = currentCount === 0

    // Insert into listing_images
    const { data: image, error: insertError } = await supabase
      .from('listing_images')
      .insert({
        listing_id: listingId,
        url: publicUrl,
        storage_path: storagePath,
        display_order: currentCount,
        is_cover: isCover,
      })
      .select()
      .single()

    if (insertError) {
      // Clean up the uploaded file on insert failure
      await supabase.storage.from('listing-images').remove([storagePath])
      return { success: false, error: insertError.message }
    }

    return { success: true, data: image as unknown as ListingImage }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteListingImage(
  imageId: string
): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Fetch image row
    const { data: image } = await supabase
      .from('listing_images')
      .select('id, storage_path, listing_id, is_cover, display_order')
      .eq('id', imageId)
      .single()

    if (!image) return { success: false, error: 'Görsel bulunamadı' }

    // Verify listing ownership
    const owns = await verifyListingOwnership(supabase, image.listing_id, user.id, isAdmin)
    if (!owns) return { success: false, error: 'Bu ilanın görsellerini düzenleme yetkiniz yok' }

    // Delete from Storage first
    await supabase.storage.from('listing-images').remove([image.storage_path])

    // Delete DB row
    const { error } = await supabase.from('listing_images').delete().eq('id', imageId)
    if (error) return { success: false, error: error.message }

    // If deleted image was cover, promote the image with lowest display_order
    if (image.is_cover) {
      const { data: remaining } = await supabase
        .from('listing_images')
        .select('id')
        .eq('listing_id', image.listing_id)
        .order('display_order', { ascending: true })
        .limit(1)

      if (remaining && remaining.length > 0) {
        await supabase
          .from('listing_images')
          .update({ is_cover: true })
          .eq('id', remaining[0].id)
      }
    }

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function setCoverImage(imageId: string): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Fetch image to get listing_id
    const { data: image } = await supabase
      .from('listing_images')
      .select('id, listing_id')
      .eq('id', imageId)
      .single()

    if (!image) return { success: false, error: 'Görsel bulunamadı' }

    // Verify listing ownership
    const owns = await verifyListingOwnership(supabase, image.listing_id, user.id, isAdmin)
    if (!owns) return { success: false, error: 'Bu ilanın görsellerini düzenleme yetkiniz yok' }

    // Clear all covers for this listing, then set new one
    await supabase
      .from('listing_images')
      .update({ is_cover: false })
      .eq('listing_id', image.listing_id)

    const { error } = await supabase
      .from('listing_images')
      .update({ is_cover: true })
      .eq('id', imageId)

    if (error) return { success: false, error: error.message }
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function reorderImages(
  listingId: string,
  imageIds: string[]
): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Verify listing ownership
    const owns = await verifyListingOwnership(supabase, listingId, user.id, isAdmin)
    if (!owns) return { success: false, error: 'Bu ilanın görsellerini düzenleme yetkiniz yok' }

    // Update display_order for each image in parallel
    await Promise.all(
      imageIds.map((id, index) =>
        supabase
          .from('listing_images')
          .update({ display_order: index })
          .eq('id', id)
          .eq('listing_id', listingId)
      )
    )

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}