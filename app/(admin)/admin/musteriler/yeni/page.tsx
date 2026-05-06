import CustomerForm from '@/components/admin/CustomerForm'
import { createCustomer } from '@/app/actions/customer.actions'
import type { CreateCustomerInput } from '@/lib/schemas/customer.schema'

export default function YeniMusteriPage() {
  async function handleCreate(data: CreateCustomerInput) {
    'use server'
    return createCustomer(data)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Yeni Müşteri</h1>
        <p className="text-sm text-zinc-500 mt-1">Yeni bir müşteri kaydı oluşturun.</p>
      </div>
      <CustomerForm mode="create" onSubmit={handleCreate} />
    </div>
  )
}