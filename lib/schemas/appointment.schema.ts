import { z } from 'zod'
import { APPOINTMENT_STATUSES } from '@/lib/constants'

// ── Typed tuples from constants ────────────────────────────────
const appointmentStatusEnum = [...APPOINTMENT_STATUSES] as [string, ...string[]]

// ── Schemas ────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  customer_id:      z.string().uuid('Geçerli bir müşteri seçiniz'),
  listing_id:       z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().uuid('Geçerli bir ilan seçiniz').nullable().optional()
  ),
  appointment_date: z.string().min(1, 'Randevu tarihi zorunludur'),
  duration_minutes: z.preprocess(
    (val) => (val === '' || val === undefined ? 60 : val),
    z.coerce.number().int().min(15).default(60)
  ),
  status:           z.enum(appointmentStatusEnum).default('bekliyor'),
  notes:            z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
})

export const updateAppointmentSchema = createAppointmentSchema.partial().required({
  customer_id:      true,
  appointment_date: true,
  status:           true,
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
