'use client'

// components/admin/OfficeSettingsForm.tsx
// Admin form to view/edit office settings.
// Uses React Hook Form + zodResolver (typed cast for Zod v4 compatibility).

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useState } from 'react'
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas/settings.schema'
import { updateOfficeSettings } from '@/app/actions/settings.actions'
import type { OfficeSettings } from '@/lib/types'

interface OfficeSettingsFormProps {
  initial: OfficeSettings | null
}

export default function OfficeSettingsForm({ initial }: OfficeSettingsFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(settingsSchema) as unknown as Resolver<SettingsFormValues>,
    defaultValues: {
      office_name: initial?.office_name ?? '',
      phone: initial?.phone ?? '',
      whatsapp: initial?.whatsapp ?? '',
      email: initial?.email ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      district: initial?.district ?? '',
      logo_url: initial?.logo_url ?? '',
      instagram_url: initial?.instagram_url ?? '',
      facebook_url: initial?.facebook_url ?? '',
    },
  })

  async function onSubmit(data: SettingsFormValues) {
    setServerError(null)
    setSuccess(false)
    const result = await updateOfficeSettings(data)
    if (!result.success) {
      setServerError(result.error)
    } else {
      setSuccess(true)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          Ayarlar başarıyla kaydedildi.
        </div>
      )}

      {/* Office Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ofis Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('office_name')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Örn: ABC Gayrimenkul"
        />
        {errors.office_name && (
          <p className="mt-1 text-xs text-red-600">{errors.office_name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
        <input
          type="tel"
          {...register('phone')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0212 123 45 67"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Numarası</label>
        <input
          type="tel"
          {...register('whatsapp')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0532 123 45 67"
        />
        <p className="mt-1 text-xs text-gray-500">
          Türkiye numarası: 05xx ile başlayabilir, otomatik dönüştürülür.
        </p>
        {errors.whatsapp && (
          <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
        <input
          type="email"
          {...register('email')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="info@ofis.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
        <textarea
          {...register('address')}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cadde, sokak, bina no…"
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* City + District */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
          <input
            type="text"
            {...register('city')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="İstanbul"
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
          <input
            type="text"
            {...register('district')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kadıköy"
          />
          {errors.district && (
            <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>
          )}
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          type="url"
          {...register('logo_url')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
        {errors.logo_url && (
          <p className="mt-1 text-xs text-red-600">{errors.logo_url.message}</p>
        )}
      </div>

      {/* Instagram URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
        <input
          type="url"
          {...register('instagram_url')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://instagram.com/..."
        />
        {errors.instagram_url && (
          <p className="mt-1 text-xs text-red-600">{errors.instagram_url.message}</p>
        )}
      </div>

      {/* Facebook URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
        <input
          type="url"
          {...register('facebook_url')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://facebook.com/..."
        />
        {errors.facebook_url && (
          <p className="mt-1 text-xs text-red-600">{errors.facebook_url.message}</p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}