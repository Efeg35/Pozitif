import { z } from 'zod'
import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  LISTING_STATUSES,
  CURRENCIES,
  IZMIR_DISTRICTS,
} from '@/lib/constants'

// ── Typed tuples from constants ────────────────────────────────

const districtValues = IZMIR_DISTRICTS as readonly string[]

// z.enum in Zod v4 takes a plain array — spread from typed readonly tuples
const listingTypeEnum   = [...LISTING_TYPES]    as [string, ...string[]]
const propertyTypeEnum  = [...PROPERTY_TYPES]   as [string, ...string[]]
const listingStatusEnum = [...LISTING_STATUSES] as [string, ...string[]]
const currencyEnum      = [...CURRENCIES]        as [string, ...string[]]

// ── Schemas ────────────────────────────────────────────────────

export const createListingSchema = z.object({
  title:        z.string().min(5, 'Başlık en az 5 karakter olmalıdır'),
  slug:         z.string().min(3, 'Slug en az 3 karakter olmalıdır'),
  description:  z.string().optional(),

  price:    z.coerce.number().positive("Fiyat 0'dan büyük olmalıdır"),
  currency: z.enum(currencyEnum),

  listing_type:  z.enum(listingTypeEnum),
  property_type: z.enum(propertyTypeEnum),
  status:        z.enum(listingStatusEnum),

  rooms:        z.coerce.number().int().positive().optional().nullable(),
  living_rooms: z.coerce.number().int().positive().optional().nullable(),
  bathrooms:    z.coerce.number().int().positive().optional().nullable(),
  area_m2:      z.coerce.number().positive("Alan 0'dan büyük olmalıdır").optional().nullable(),
  floor:        z.coerce.number().int().optional().nullable(),
  total_floors: z.coerce.number().int().positive().optional().nullable(),
  building_age: z.coerce.number().int().min(0, 'Bina yaşı negatif olamaz').optional().nullable(),
  heating_type: z.string().optional().nullable(),

  is_furnished:  z.boolean().default(false),
  has_balcony:   z.boolean().default(false),
  has_elevator:  z.boolean().default(false),
  has_parking:   z.boolean().default(false),
  is_in_complex: z.boolean().default(false),

  dues:    z.coerce.number().min(0, 'Aidat negatif olamaz').default(0),
  deposit: z.coerce.number().min(0, 'Depozito negatif olamaz').default(0),

  address:  z.string().optional().nullable(),
  district: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || districtValues.includes(val), {
      message: 'Geçersiz ilçe seçimi',
    }),
  city:      z.string().default('İzmir'),
  latitude:  z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),

  is_featured: z.boolean().default(false),
})

// updateListingSchema: all fields partial EXCEPT the required core fields
export const updateListingSchema = createListingSchema.partial().required({
  title:         true,
  price:         true,
  listing_type:  true,
  property_type: true,
  status:        true,
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>