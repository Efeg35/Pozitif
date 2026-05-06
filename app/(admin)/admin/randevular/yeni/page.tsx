import { getCustomers } from '@/app/actions/customer.actions'
import { createAppointment, getListingOptionsForAppointment } from '@/app/actions/appointment.actions'
import AppointmentForm from '@/components/admin/AppointmentForm'
import type { CreateAppointmentInput } from '@/lib/schemas/appointment.schema'

interface Props {
  searchParams: Promise<{ customer_id?: string }>
}

export default async function YeniRandevuPage({ searchParams }: Props) {
  const { customer_id } = await searchParams

  const [customersResult, listingsResult] = await Promise.all([
    getCustomers(),
    getListingOptionsForAppointment(),
  ])

  const customers = customersResult.success ? customersResult.data.customers : []
  const listings = listingsResult.success ? listingsResult.data : []

  async function handleCreate(data: CreateAppointmentInput) {
    'use server'
    return createAppointment(data)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Yeni Randevu</h1>
        <p className="text-sm text-zinc-500 mt-1">Bir müşteri için randevu oluşturun.</p>
      </div>
      <AppointmentForm
        mode="create"
        customers={customers}
        listings={listings}
        defaultCustomerId={customer_id}
        onSubmit={handleCreate}
      />
    </div>
  )
}