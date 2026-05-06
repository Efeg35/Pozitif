import { z } from 'zod'
import { CUSTOMER_STATUSES, INTEREST_TYPES } from '@/lib/constants'

// ── Typed tuples from constants ────────────────────────────────
const customerStatusEnum = [...CUSTOMER_STATUSES] as [string, ...string[]]
const interestTypeEnum   = [...INTEREST_TYPES]    as [string, ...string[]]

// ── Schemas ────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
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
    z.coerce.number().int().min(0, 'Bütçe negatif olamaz').nullable().optional()
  ),
  budget_max:    z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.number().int().min(0, 'Bütçe negatif olamaz').nullable().optional()
  ),
  preferred_districts: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
})

export const updateCustomerSchema = createCustomerSchema.partial().required({
  full_name: true,
  phone:     true,
  status:    true,
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>