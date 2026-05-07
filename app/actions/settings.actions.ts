'use server'

// app/actions/settings.actions.ts
// Server actions for office settings.
// getOfficeSettings: public (anon can read via RLS)
// updateOfficeSettings: admin-only

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { settingsSchema } from '@/lib/schemas/settings.schema'
import type { OfficeSettings } from '@/lib/types'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── getOfficeSettings ────────────────────────────────────────────────────────
// Readable by everyone (anon SELECT on office_settings).
// Returns the single row (upsert ensures exactly one exists).
export async function getOfficeSettings(): Promise<OfficeSettings | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('office_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getOfficeSettings]', error.message)
    return null
  }
  return data
}

// ─── updateOfficeSettings ─────────────────────────────────────────────────────
// Admin-only. Updates or inserts the single office_settings row.
export async function updateOfficeSettings(
  formData: unknown
): Promise<ActionResult<OfficeSettings>> {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!agent?.is_admin) {
    return { success: false, error: 'Yetkisiz erişim.' }
  }

  // Validate
  const parsed = settingsSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Geçersiz form verisi.'
    return { success: false, error: firstError }
  }

  const values = parsed.data

  // Normalize empty strings to null
  const payload = {
    office_name: values.office_name,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    email: values.email || null,
    address: values.address || null,
    city: values.city || null,
    district: values.district || null,
    logo_url: values.logo_url || null,
    instagram_url: values.instagram_url || null,
    facebook_url: values.facebook_url || null,
    updated_at: new Date().toISOString(),
  }

  // Fetch existing row id
  const { data: existing } = await supabase
    .from('office_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  let result
  if (existing?.id) {
    const { data, error } = await supabase
      .from('office_settings')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()
    result = { data, error }
  } else {
    const { data, error } = await supabase
      .from('office_settings')
      .insert(payload)
      .select('*')
      .single()
    result = { data, error }
  }

  if (result.error || !result.data) {
    console.error('[updateOfficeSettings]', result.error?.message)
    return { success: false, error: result.error?.message ?? 'Kayıt başarısız.' }
  }

  return { success: true, data: result.data as OfficeSettings }
}