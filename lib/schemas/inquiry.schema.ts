import { z } from 'zod'
import { INQUIRY_STATUSES, CUSTOMER_STATUSES, INTEREST_TYPES } from '@/lib/constants'

// ── Typed tuples from constants ────────────────────────────────
const inquiryStatusEnum  = [...INQUIRY_STATUSES]  as [string, ...string[]]
const customerStatusEnum = [...CUSTOMER_STATUSES] as [string, ...string[]]
const interestTypeEnum   = [...INTEREST_TYPES]    as [string, ...string[]]

// ── Schemas ────────────────────────────────────────────────────

export const updateInquiryStatusSchema = z.object({
  status: z.enum(inquiryStatusEnum),
})

export const convertInquiryToCustomerSchema = z.object({
  inquiry_id:    z.string().uuid('Geçersiz talep ID'),
  full_name:     z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  phone:         z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  email:         z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().email('Geçerli bir e-posta giriniz').nullable().optional()
  ),
  notes:         z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  status:        z.enum(customerStatusEnum).default('aktif'),
  interest_type: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.enum(interestTypeEnum).nullable().optional()
  ),
  budget_min:    z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
  ),
  budget_max:    z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
  ),
  preferred_districts: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
})

export type UpdateInquiryStatusInput  = z.infer<typeof updateInquiryStatusSchema>
export type ConvertInquiryToCustomerInput = z.infer<typeof convertInquiryToCustomerSchema>