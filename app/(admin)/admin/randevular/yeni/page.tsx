import { getCustomers } from '@/app/actions/customer.actions'
import { createAppointment } from '@/app/actions/appointment.actions'
import AppointmentForm from '@/components/admin/AppointmentForm'
import type { CreateAppointmentInput } from '@/lib/schemas/appointment.schema'

interface Props {
  searchParams: Promise<{ customer_id?: string }>
}

export default async function YeniRandevuPage({ searchParams }: Props) {
  const { customer_id } = await searchParams
  const customersResult = await getCustomers()
  const customers = customersResult.success ? customersResult.data : []

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
        defaultCustomerId={customer_id}
        onSubmit={handleCreate}
      />
    </div>
  )
}