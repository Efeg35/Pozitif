'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const inquirySchema = z
  .object({
    name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
    phone: z.string().optional(),
    email: z.string().email('Geçerli bir e-posta girin').optional().or(z.literal('')),
    message: z.string().max(500, 'Mesaj en fazla 500 karakter olabilir').optional(),
    listingId: z.string().uuid().optional().nullable(),
    honeypot: z.string().optional(),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: 'Telefon veya e-posta adresinden en az biri zorunludur',
    path: ['phone'],
  })

export type InquiryResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
  const raw = {
    name: formData.get('name') as string,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    message: (formData.get('message') as string) || undefined,
    listingId: formData.get('listingId') as string | null,
    honeypot: (formData.get('honeypot') as string) || undefined,
  }

  // Spam check — honeypot must be empty
  if (raw.honeypot) {
    return { success: true }
  }

  const parsed = inquirySchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    const firstError = Object.values(fieldErrors).flat()[0] ?? 'Lütfen formu kontrol edin'
    return { success: false, error: firstError, fieldErrors }
  }

  const { name, phone, email, message, listingId } = parsed.data

  const supabase = await createClient()

  const { error } = await supabase.from('inquiries').insert({
    name,
    phone: phone || null,
    email: email || null,
    message: message || null,
    listing_id: listingId || null,
    honeypot: null,
    status: 'yeni',
  })

  if (error) {
    console.error('submitInquiry error:', error)
    return { success: false, error: 'Talebiniz gönderilemedi. Lütfen tekrar deneyin.' }
  }

  return { success: true }
}