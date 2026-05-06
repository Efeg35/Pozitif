'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { submitInquiry } from '@/app/actions/inquiry.actions'
import type { Resolver } from 'react-hook-form'

const formSchema = z
  .object({
    name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
    phone: z.string().optional(),
    email: z.string().email('Geçerli bir e-posta girin').optional().or(z.literal('')),
    message: z.string().max(500, 'Mesaj en fazla 500 karakter olabilir').optional(),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: 'Telefon veya e-posta adresinden en az biri zorunludur',
    path: ['phone'],
  })

type FormValues = z.infer<typeof formSchema>

interface InquiryFormProps {
  listingId: string | null
  listingTitle: string
}

export default function InquiryForm({ listingId, listingTitle }: InquiryFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
  })

  async function onSubmit(values: FormValues) {
    setStatus('loading')
    setErrorMessage('')

    const formData = new FormData()
    formData.set('name', values.name)
    if (values.phone) formData.set('phone', values.phone)
    if (values.email) formData.set('email', values.email)
    if (values.message) formData.set('message', values.message)
    if (listingId) formData.set('listingId', listingId)
    // Honeypot stays empty — bots fill it, humans don't see it
    formData.set('honeypot', '')

    const result = await submitInquiry(formData)

    if (result.success) {
      setStatus('success')
      reset()
    } else {
      setStatus('error')
      setErrorMessage(result.error)
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-green-800">Talebiniz alındı!</p>
        <p className="text-sm text-green-700">En kısa sürede dönüş yapacağız.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-2 text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
        >
          Yeni talep gönder
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Honeypot field — hidden from real users, traps bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="hp_field">Leave this blank</label>
        <input type="text" id="hp_field" name="honeypot" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Hidden listing title (informational, not submitted to action directly) */}
      <input type="hidden" value={listingTitle} readOnly aria-hidden="true" />

      {/* Ad Soyad */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Ad Soyad <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="Ad Soyad"
          className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Telefon */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Telefon</label>
        <input
          {...register('phone')}
          type="tel"
          placeholder="0532 000 00 00"
          className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      {/* E-posta */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">E-posta</label>
        <input
          {...register('email')}
          type="email"
          placeholder="ornek@email.com"
          className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Mesaj */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Mesaj</label>
        <textarea
          {...register('message')}
          rows={3}
          placeholder="Bu ilan hakkında bilgi almak istiyorum..."
          className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      {/* Error state */}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Gönderiliyor...' : 'Bilgi Al'}
      </button>
    </form>
  )
}