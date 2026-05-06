'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerFormValues } from '@/lib/schemas/customer.schema'
import type { CreateCustomerInput } from '@/lib/schemas/customer.schema'
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  INTEREST_TYPES,
  INTEREST_TYPE_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from '@/lib/constants'
import type { Customer, PropertyType } from '@/lib/types'

interface CustomerFormProps {
  mode: 'create' | 'edit'
  initial?: Customer
  onSubmit: (data: CreateCustomerInput) => Promise<{ success: boolean; error?: string }>
}

export default function CustomerForm({ mode, initial, onSubmit }: CustomerFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const { register, handleSubmit, formState: { errors }, setError } =
    useForm<CustomerFormValues>({
      defaultValues: {
        full_name:  initial?.full_name ?? '',
        phone:      initial?.phone ?? '',
        email:      initial?.email ?? '',
        notes:      initial?.notes ?? '',
        status:     initial?.status ?? 'aktif',
        interest_type: initial?.interest_type ?? '',
        budget_min: initial?.budget_min != null ? String(initial.budget_min) : '',
        budget_max: initial?.budget_max != null ? String(initial.budget_max) : '',
        preferred_districts: Array.isArray(initial?.preferred_districts)
          ? (initial.preferred_districts as string[]).join(', ')
          : (initial?.preferred_districts ?? ''),
        preferred_property_types: Array.isArray(initial?.preferred_property_types)
          ? (initial.preferred_property_types as string[])
          : [],
      },
    })

  const handleFormSubmit = (values: CustomerFormValues) => {
    if (!values.full_name?.trim()) {
      setError('full_name', { message: 'Ad soyad zorunludur' })
      return
    }

    const payload: CreateCustomerInput = {
      full_name:   values.full_name.trim(),
      phone:       values.phone?.trim() || undefined,
      email:       values.email?.trim() || undefined,
      notes:       values.notes?.trim() || undefined,
      status:      values.status as CreateCustomerInput['status'],
      interest_type: (values.interest_type as CreateCustomerInput['interest_type']) || undefined,
      budget_min:  values.budget_min ? parseInt(values.budget_min, 10) : undefined,
      budget_max:  values.budget_max ? parseInt(values.budget_max, 10) : undefined,
      preferred_districts: values.preferred_districts?.trim()
        ? values.preferred_districts.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      preferred_property_types: values.preferred_property_types?.length
        ? (values.preferred_property_types as CreateCustomerInput['preferred_property_types'])
        : undefined,
    }

    setPending(true)
    setServerError(null)
    onSubmit(payload).then((result) => {
      if (!result.success) {
        setServerError(result.error ?? 'Bir hata oluştu')
        setPending(false)
      } else {
        router.push('/admin/musteriler')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Ad Soyad + Telefon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input
            {...register('full_name')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Adı Soyadı"
          />
          {errors.full_name && (
            <p className="text-xs text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Telefon</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="05xx xxx xx xx"
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* E-posta */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700">E-posta</label>
        <input
          {...register('email')}
          type="email"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ornek@eposta.com"
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Durum + İlgi Türü */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            Durum <span className="text-red-500">*</span>
          </label>
          <select
            {...register('status')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s} value={s}>{CUSTOMER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">İlgi Türü</label>
          <select
            {...register('interest_type')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            {INTEREST_TYPES.map((t) => (
              <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bütçe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Min. Bütçe (₺)</label>
          <input
            {...register('budget_min')}
            type="number"
            min={0}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Max. Bütçe (₺)</label>
          <input
            {...register('budget_max')}
            type="number"
            min={0}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Tercih Edilen İlçeler */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700">Tercih Edilen İlçeler</label>
        <input
          {...register('preferred_districts')}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Bornova, Karşıyaka, Konak..."
        />
        <p className="text-xs text-zinc-500">Virgülle ayırarak birden fazla ilçe girebilirsiniz.</p>
      </div>

      {/* Tercih Edilen Emlak Türleri */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">Tercih Edilen Emlak Türleri</label>
        <div className="flex flex-wrap gap-3">
          {PROPERTY_TYPES.map((pt) => (
            <label key={pt} className="inline-flex items-center gap-1.5 text-sm text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                value={pt}
                {...register('preferred_property_types')}
                className="rounded border-zinc-300"
              />
              {PROPERTY_TYPE_LABELS[pt as PropertyType]}
            </label>
          ))}
        </div>
      </div>

      {/* Notlar */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700">Notlar</label>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Müşteri hakkında notlar..."
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-5 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Kaydediliyor...' : mode === 'create' ? 'Müşteri Ekle' : 'Değişiklikleri Kaydet'}
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