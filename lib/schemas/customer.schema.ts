import { z } from 'zod'
import { CUSTOMER_STATUSES, INTEREST_TYPES, PROPERTY_TYPES } from '@/lib/constants'

// ── Typed tuples from constants ────────────────────────────────
const customerStatusEnum = [...CUSTOMER_STATUSES] as [string, ...string[]]
const interestTypeEnum   = [...INTEREST_TYPES]    as [string, ...string[]]
const propertyTypeEnum   = [...PROPERTY_TYPES]    as [string, ...string[]]

// ── Form values type (what RHF sees — all strings/primitives) ──
// Used as generic for useForm<CustomerFormValues>
export type CustomerFormValues = {
  full_name:                string
  phone:                    string
  email:                    string
  notes:                    string
  status:                   string
  interest_type:            string
  budget_min:               string
  budget_max:               string
  preferred_districts:      string    // comma-separated string in form
  preferred_property_types: string[]  // checkbox array
}

// ── Schemas ────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),

  phone: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().min(10, 'Geçerli bir telefon numarası giriniz').nullable().optional()
  ),

  email: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().email('Geçerli bir e-posta giriniz').nullable().optional()
  ),

  notes: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().nullable().optional()
  ),

  status: z.enum(customerStatusEnum).default('aktif'),

  interest_type: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(interestTypeEnum).nullable().optional()
  ),

  budget_min: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
    z.number().int().min(0, 'Bütçe negatif olamaz').nullable().optional()
  ),

  budget_max: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
    z.number().int().min(0, 'Bütçe negatif olamaz').nullable().optional()
  ),

  // Stored as text[] in DB — form sends comma-separated string
  preferred_districts: z.preprocess(
    (v) => {
      if (!v || v === '') return null
      if (Array.isArray(v)) return (v as string[]).length === 0 ? null : v
      return (v as string).split(',').map((s: string) => s.trim()).filter(Boolean)
    },
    z.array(z.string()).nullable().optional()
  ),

  // Stored as text[] in DB — form sends string[]
  preferred_property_types: z.preprocess(
    (v) => {
      if (!v || (Array.isArray(v) && (v as unknown[]).length === 0)) return null
      return v
    },
    z.array(z.enum(propertyTypeEnum)).nullable().optional()
  ),
})

export const updateCustomerSchema = createCustomerSchema.partial().required({
  full_name: true,
  status:    true,
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>