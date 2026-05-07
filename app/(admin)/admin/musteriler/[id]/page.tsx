import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import { getCustomer, updateCustomer } from '@/app/actions/customer.actions'
import CustomerForm from '@/components/admin/CustomerForm'
import DeleteCustomerButton from '@/components/admin/DeleteCustomerButton'
import type { CreateCustomerInput } from '@/lib/schemas/customer.schema'
import {
  CUSTOMER_STATUS_LABELS,
  APPOINTMENT_STATUS_LABELS,
  INTEREST_TYPE_LABELS,
} from '@/lib/constants'
import type { CustomerStatus, AppointmentStatus, InterestType } from '@/lib/types'
import { buildWhatsappUrl, buildCustomerWhatsappMessage } from '@/lib/whatsapp'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MusteriDetayPage({ params }: Props) {
  const { id } = await params
  const result = await getCustomer(id)

  if (!result.success) notFound()

  const customer = result.data

  async function handleUpdate(data: CreateCustomerInput) {
    'use server'
    return updateCustomer(id, data)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/musteriler" className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{customer.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                customer.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {CUSTOMER_STATUS_LABELS[customer.status as CustomerStatus]}
              </span>
              {customer.interest_type && (
                <span className="text-xs text-zinc-500">
                  {INTEREST_TYPE_LABELS[customer.interest_type as InterestType]}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/randevular/yeni?customer_id=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Randevu Ekle
          </Link>
          <DeleteCustomerButton id={customer.id} name={customer.full_name} />
        </div>
      </div>

      {/* Quick info */}
      <div className="flex flex-wrap gap-4">
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
            <a href={`tel:${customer.phone}`} className="hover:text-blue-700">{customer.phone}</a>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
            <a href={`mailto:${customer.email}`} className="hover:text-blue-700">{customer.email}</a>
          </div>
        )}
        {customer.preferred_districts && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
            <span>
              {Array.isArray(customer.preferred_districts)
                ? customer.preferred_districts.join(', ')
                : customer.preferred_districts}
            </span>
          </div>
        )}
        {customer.phone && (() => {
          const waLink = buildWhatsappUrl(
            customer.phone,
            buildCustomerWhatsappMessage({ customerName: customer.full_name })
          )
          return waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          ) : null
        })()}
      </div>

      {/* Appointments */}
      {customer.appointments && customer.appointments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Randevular</h2>
          <div className="bg-white rounded-lg border divide-y">
            {customer.appointments.map((appt) => (
              <div key={appt.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {new Date(appt.appointment_date).toLocaleString('tr-TR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {appt.listings && (
                    <p className="text-xs text-zinc-500 mt-0.5">{appt.listings.title}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  appt.status === 'tamamlandi' ? 'bg-green-100 text-green-700' :
                  appt.status === 'iptal' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-800">Bilgileri Düzenle</h2>
        <CustomerForm mode="edit" initial={customer} onSubmit={handleUpdate} />
      </div>
    </div>
  )
}