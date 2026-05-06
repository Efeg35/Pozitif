'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { APPOINTMENT_STATUSES } from '@/lib/constants'
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from '@/lib/schemas/appointment.schema'
import type { Appointment, AppointmentWithRelations } from '@/lib/types'

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

interface AppointmentFilters {
  status?: string
  customer_id?: string
  date_from?: string
  date_to?: string
}

export async function getAppointments(
  filters?: AppointmentFilters
): Promise<ActionResult<AppointmentWithRelations[]>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('appointments')
      .select('*, customers(id, full_name, phone, email), listings(id, title, slug, district, city), agents(id, full_name)')
      .order('appointment_date', { ascending: true })

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    if (filters?.status)      query = query.eq('status', filters.status)
    if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id)
    if (filters?.date_from)   query = query.gte('appointment_date', filters.date_from)
    if (filters?.date_to)     query = query.lte('appointment_date', filters.date_to)

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as AppointmentWithRelations[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getAppointment(
  id: string
): Promise<ActionResult<AppointmentWithRelations>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    let query = supabase
      .from('appointments')
      .select('*, customers(id, full_name, phone, email), listings(id, title, slug, district, city), agents(id, full_name)')
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('agent_id', user.id)
    }

    const { data, error } = await query.single()

    if (error || !data) return { success: false, error: 'Randevu bulunamadı' }
    return { success: true, data: data as unknown as AppointmentWithRelations }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Mutations ─────────────────────────────────────────────────

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    const { supabase, user } = await getAuthenticatedAgent()

    const parsed = createAppointmentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({ ...parsed.data, agent_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/randevular')
    return { success: true, data: appointment as unknown as Appointment }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    const parsed = updateAppointmentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('appointments')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Randevu bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/randevular')
    revalidatePath(`/admin/randevular/${id}`)
    return { success: true, data: appointment as unknown as Appointment }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteAppointment(id: string): Promise<ActionResult<void>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    // Verify ownership
    const { data: existing } = await supabase
      .from('appointments')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Randevu bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { error } = await supabase.from('appointments').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/randevular')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<ActionResult<Appointment>> {
  try {
    const { supabase, user, isAdmin } = await getAuthenticatedAgent()

    if (!(APPOINTMENT_STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: 'Geçersiz durum değeri' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('appointments')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Randevu bulunamadı' }
    if (!isAdmin && existing.agent_id !== user.id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/randevular')
    revalidatePath(`/admin/randevular/${id}`)
    return { success: true, data: appointment as unknown as Appointment }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}