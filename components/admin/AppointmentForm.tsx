'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CreateAppointmentInput } from '@/lib/schemas/appointment.schema'
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants'
import type { AppointmentWithRelations, CustomerWithRelations } from '@/lib/types'

interface AppointmentFormProps {
  mode: 'create' | 'edit'
  initial?: AppointmentWithRelations
  customers: Pick<CustomerWithRelations, 'id' | 'full_name' | 'phone'>[]
  defaultCustomerId?: string
  onSubmit: (data: CreateAppointmentInput) => Promise<{ success: boolean; error?: string }>
}

export default function AppointmentForm({
  mode,
  initial,
  customers,
  defaultCustomerId,
  onSubmit,
}: AppointmentFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Format datetime-local value from ISO string
  const toDatetimeLocal = (iso: string | null | undefined) => {
    if (!iso) return ''
    try {
      return new Date(iso).toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    defaultValues: {
      customer_id:      initial?.customers?.id ?? defaultCustomerId ?? '',
      listing_id:       initial?.listings?.id ?? '',
      appointment_date: toDatetimeLocal(initial?.appointment_date),
      status:           initial?.status ?? 'bekliyor',
      notes:            initial?.notes ?? '',
    },
  })

  const handleFormSubmit = async (values: any) => {
    if (!values.customer_id) {
      setError('customer_id', { message: 'Müşteri seçimi zorunludur' })
      return
    }
    if (!values.appointment_date) {
      setError('appointment_date', { message: 'Randevu tarihi zorunludur' })
      return
    }

    const payload: CreateAppointmentInput = {
      customer_id:      values.customer_id,
      listing_id:       values.listing_id || undefined,
      appointment_date: new Date(values.appointment_date).toISOString(),
      duration_minutes: 60,
      status:           values.status,
      notes:            values.notes || undefined,
    }

    setPending(true)
    setServerError(null)
    const result = await onSubmit(payload)
    if (!result.success) {
      setServerError(result.error ?? 'Bir hata oluştu')
      setPending(false)
    } else {
      router.push('/admin/randevular')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Müşteri */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700">
          Müşteri <span className="text-red-500">*</span>
        </label>
        <select
          {...register('customer_id')}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Müşteri seçiniz</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} — {c.phone}
            </option>
          ))}
        </select>
        {errors.customer_id && (
          <p className="text-xs text-red-600">{errors.customer_id.message as string}</p>
        )}
      </div>

      {/* Tarih & Saat + Durum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            Tarih ve Saat <span className="text-red-500">*</span>
          </label>
          <input
            {...register('appointment_date')}
            type="datetime-local"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.appointment_date && (
            <p className="text-xs text-red-600">{errors.appointment_date.message as string}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            Durum <span className="text-red-500">*</span>
          </label>
          <select
            {...register('status')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notlar */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700">Notlar</label>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Randevu hakkında notlar..."
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-5 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Kaydediliyor...' : mode === 'create' ? 'Randevu Oluştur' : 'Değişiklikleri Kaydet'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  )
}