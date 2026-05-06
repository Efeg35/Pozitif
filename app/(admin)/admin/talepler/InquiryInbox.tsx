'use client'

import { useState } from 'react'
import { MessageSquare, UserPlus, Check, AlertCircle } from 'lucide-react'
import { updateInquiryStatus, convertInquiryToCustomer } from '@/app/actions/crm.actions'
import type { InquiryWithListing, InquiryStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props {
  inquiries: InquiryWithListing[]
  statusLabels: Record<InquiryStatus, string>
}

interface ConvertDialogState {
  inquiry: InquiryWithListing
  fullName: string
  phone: string
  email: string
  notes: string
}

export default function InquiryInbox({ inquiries, statusLabels }: Props) {
  const router = useRouter()
  const [converting, setConverting] = useState<ConvertDialogState | null>(null)
  const [convertPending, setConvertPending] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    await updateInquiryStatus(id, status)
    setUpdatingId(null)
    router.refresh()
  }

  const openConvert = (inquiry: InquiryWithListing) => {
    setConverting({
      inquiry,
      fullName: inquiry.name,
      phone: inquiry.phone ?? '',
      email: inquiry.email ?? '',
      notes: inquiry.message ?? '',
    })
    setConvertError(null)
    setDuplicateWarning(null)
  }

  const handleConvert = async () => {
    if (!converting) return
    if (!converting.phone.trim() || converting.phone.trim().length < 10) {
      setConvertError('Geçerli bir telefon numarası giriniz')
      return
    }
    setConvertPending(true)
    setConvertError(null)
    setDuplicateWarning(null)

    const result = await convertInquiryToCustomer({
      inquiry_id: converting.inquiry.id,
      full_name: converting.fullName,
      phone: converting.phone,
      email: converting.email || undefined,
      notes: converting.notes || undefined,
      status: 'aktif',
    })

    setConvertPending(false)
    if (!result.success) {
      // Surface duplicate phone/email as a warning (non-blocking hint) vs hard error
      if (
        result.error.toLowerCase().includes('duplicate') ||
        result.error.toLowerCase().includes('already') ||
        result.error.toLowerCase().includes('unique')
      ) {
        setDuplicateWarning(
          'Bu telefon veya e-posta adresiyle kayıtlı bir müşteri zaten var. Bilgileri kontrol edip tekrar deneyin.'
        )
      } else {
        setConvertError(result.error)
      }
    } else {
      setConverting(null)
      router.push('/admin/musteriler')
      router.refresh()
    }
  }

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <MessageSquare className="h-12 w-12 mb-3" />
        <p className="font-medium">Gelen kutusu boş</p>
        <p className="text-sm mt-1">Yeni talepler burada görünecek.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border divide-y">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            className={`px-4 py-4 ${inquiry.status === 'yeni' ? 'bg-blue-50/30' : ''}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900 text-sm">{inquiry.name}</p>
                  {inquiry.status === 'yeni' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Yeni
                    </span>
                  )}
                </div>
                {inquiry.phone && <p className="text-xs text-zinc-500">📞 {inquiry.phone}</p>}
                {inquiry.email && <p className="text-xs text-zinc-500">✉ {inquiry.email}</p>}
                {inquiry.message && (
                  <p className="text-sm text-zinc-700 mt-1 line-clamp-2">{inquiry.message}</p>
                )}
                {inquiry.listings && (
                  <p className="text-xs text-blue-600 mt-1">
                    İlan:{' '}
                    <span className="font-medium">{inquiry.listings.title}</span>
                    {inquiry.listings.district ? ` — ${inquiry.listings.district}` : ''}
                    {inquiry.listings.city ? `, ${inquiry.listings.city}` : ''}
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  {new Date(inquiry.created_at).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    inquiry.status === 'yeni'
                      ? 'bg-blue-100 text-blue-700'
                      : inquiry.status === 'yanitlandi'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {statusLabels[inquiry.status as InquiryStatus]}
                </span>
                {inquiry.status === 'yeni' && (
                  <button
                    onClick={() => handleStatusChange(inquiry.id, 'incelendi')}
                    disabled={updatingId === inquiry.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    İncele
                  </button>
                )}
                {inquiry.status !== 'yanitlandi' && (
                  <button
                    onClick={() => openConvert(inquiry)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Müşteriye Dönüştür
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {converting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-zinc-900">Müşteriye Dönüştür</h2>

            {/* Listing context */}
            {converting.inquiry.listings && (
              <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-700">
                İlan:{' '}
                <span className="font-medium">{converting.inquiry.listings.title}</span>
                {converting.inquiry.listings.district
                  ? ` — ${converting.inquiry.listings.district}`
                  : ''}
              </div>
            )}

            <p className="text-sm text-zinc-500">Bu talebi müşteri kaydına dönüştürün.</p>

            {duplicateWarning && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {convertError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {convertError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  value={converting.fullName}
                  onChange={(e) => setConverting({ ...converting, fullName: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  value={converting.phone}
                  onChange={(e) => setConverting({ ...converting, phone: e.target.value })}
                  type="tel"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700">E-posta</label>
                <input
                  value={converting.email}
                  onChange={(e) => setConverting({ ...converting, email: e.target.value })}
                  type="email"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700">Notlar</label>
                <textarea
                  value={converting.notes}
                  onChange={(e) => setConverting({ ...converting, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleConvert}
                disabled={convertPending}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {convertPending ? 'Kaydediliyor...' : 'Müşteri Oluştur'}
              </button>
              <button
                onClick={() => setConverting(null)}
                disabled={convertPending}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md border text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}