'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { INQUIRY_STATUSES } from '@/lib/constants'
import {
  convertInquiryToCustomerSchema,
  type ConvertInquiryToCustomerInput,
} from '@/lib/schemas/inquiry.schema'
import type { Customer, InquiryWithListing } from '@/lib/types'

// ── Shared types ──────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── Helper ────────────────────────────────────────────────────

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

// ── Queries ───────────────────────────────────────────────────

interface InquiryFilters {
  status?: string
  listing_id?: string
}

export async function getInquiries(
  filters?: InquiryFilters
): Promise<ActionResult<InquiryWithListing[]>> {
  try {
    const { supabase } = await getAuthenticatedAgent()

    // Shared inbox — all authenticated agents see all inquiries
    let query = supabase
      .from('inquiries')
      .select('*, listings(id, title, slug, district, city, agent_id)')
      .order('created_at', { ascending: false })

    if (filters?.status)     query = query.eq('status', filters.status)
    if (filters?.listing_id) query = query.eq('listing_id', filters.listing_id)

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as InquiryWithListing[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getUnreadInquiryCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'yeni')

    return count ?? 0
  } catch {
    return 0
  }
}

// ── Mutations ─────────────────────────────────────────────────

export async function updateInquiryStatus(
  id: string,
  status: string
): Promise<ActionResult<void>> {
  try {
    const { supabase } = await getAuthenticatedAgent()

    if (!(INQUIRY_STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: 'Geçersiz durum değeri' }
    }

    const { error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/talepler')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function convertInquiryToCustomer(
  input: ConvertInquiryToCustomerInput
): Promise<ActionResult<Customer>> {
  try {
    const { supabase, user } = await getAuthenticatedAgent()

    const parsed = convertInquiryToCustomerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    const { inquiry_id, ...customerData } = parsed.data

    // Verify the inquiry exists
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, status')
      .eq('id', inquiry_id)
      .single()

    if (inquiryError || !inquiry) {
      return { success: false, error: 'Talep bulunamadı' }
    }

    // Create the customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ ...customerData, agent_id: user.id })
      .select()
      .single()

    if (customerError) return { success: false, error: customerError.message }

    // Mark the inquiry as responded
    await supabase
      .from('inquiries')
      .update({ status: 'yanitlandi' })
      .eq('id', inquiry_id)

    revalidatePath('/admin/talepler')
    revalidatePath('/admin/musteriler')
    return { success: true, data: customer as unknown as Customer }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}