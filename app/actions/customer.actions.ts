'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CUSTOMER_STATUSES } from '@/lib/constants'
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from '@/lib/schemas/customer.schema'
import type { Customer } from '@/lib/types'
import type { CustomerWithRelations } from '@/lib/types'

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

interface CustomerFilters {
  status?: string
  search?: string
}

export async function getCustomers(
  filters?: CustomerFilters
): Promise<ActionResult<CustomerWithRelations[]>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('customers')
      .select('*, agents(full_name, title)')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as CustomerWithRelations[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getCustomer(
  id: string
): Promise<ActionResult<CustomerWithRelations>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('customers')
      .select(
        '*, agents(full_name, title), appointments(*, listings(id, title, slug, district, city), agents(id, full_name))'
      )
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    const { data, error } = await query.single()

    if (error || !data) return { success: false, error: 'Müşteri bulunamadı' }
    return { success: true, data: data as unknown as CustomerWithRelations }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Mutations ─────────────────────────────────────────────────

export async function createCustomer(
  input: CreateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
    const { supabase, user } = await getAuthenticatedAgent()

    const parsed = createCustomerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({ ...parsed.data, agent_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/musteriler')
    return { success: true, data: customer as unknown as Customer }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput
): Promise<ActionResult<Customer>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    const parsed = updateCustomerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('customers')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Müşteri bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/musteriler')
    revalidatePath(`/admin/musteriler/${id}`)
    return { success: true, data: customer as unknown as Customer }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Verify ownership
    const { data: existing } = await supabase
      .from('customers')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Müşteri bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { error } = await supabase.from('customers').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/musteriler')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateCustomerStatus(
  id: string,
  status: string
): Promise<ActionResult<Customer>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: 'Geçersiz durum değeri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('customers')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Müşteri bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/musteriler')
    revalidatePath(`/admin/musteriler/${id}`)
    return { success: true, data: customer as unknown as Customer }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}