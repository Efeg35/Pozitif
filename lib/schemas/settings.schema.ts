// lib/schemas/settings.schema.ts
import { z } from 'zod'

export const settingsSchema = z.object({
  office_name: z.string().min(1, 'Ofis adı zorunludur').max(200),
  phone: z.string().max(30).nullable().optional(),
  whatsapp: z.string().max(30).nullable().optional(),
  email: z.string().email('Geçerli bir e-posta girin').nullable().optional().or(z.literal('')),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  logo_url: z.string().url('Geçerli bir URL girin').nullable().optional().or(z.literal('')),
  instagram_url: z.string().url('Geçerli bir URL girin').nullable().optional().or(z.literal('')),
  facebook_url: z.string().url('Geçerli bir URL girin').nullable().optional().or(z.literal('')),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>