import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getAppointment,
  updateAppointment,
  getListingOptionsForAppointment,
} from '@/app/actions/appointment.actions'
import { getCustomers } from '@/app/actions/customer.actions'
import AppointmentForm from '@/components/admin/AppointmentForm'
import DeleteAppointmentButton from '@/components/admin/DeleteAppointmentButton'
import type { CreateAppointmentInput } from '@/lib/schemas/appointment.schema'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants'
import type { AppointmentStatus } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RandevuDetayPage({ params }: Props) {
  const { id } = await params

  // Get the appointment first so we can pass its listing_id to
  // getListingOptionsForAppointment — ensuring a pasif/sold listing
  // still appears in the edit dropdown.
  const result = await getAppointment(id)
  if (!result.success) notFound()

  const appt = result.data

  const [customersResult, listingsResult] = await Promise.all([
    getCustomers(),
    getListingOptionsForAppointment(appt.listing_id ?? undefined),
  ])

  const customers = customersResult.success ? customersResult.data.customers : []
  const listings = listingsResult.success ? listingsResult.data : []

  async function handleUpdate(data: CreateAppointmentInput) {
    'use server'
    return updateAppointment(id, data)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/randevular"
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {appt.customers?.full_name ?? 'Randevu Detayı'}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {new Date(appt.appointment_date).toLocaleString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              appt.status === 'tamamlandi'
                ? 'bg-green-100 text-green-700'
                : appt.status === 'iptal'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
          </span>
          <DeleteAppointmentButton id={appt.id} />
        </div>
      </div>

      {appt.listings && (
        <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-blue-700">
          İlan: <span className="font-medium">{appt.listings.title}</span>
          {appt.listings.district && ` — ${appt.listings.district}`}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-800">Randevuyu Düzenle</h2>
        <AppointmentForm
          mode="edit"
          initial={appt}
          customers={customers}
          listings={listings}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  )
}