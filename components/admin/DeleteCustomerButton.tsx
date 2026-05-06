'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteCustomer } from '@/app/actions/customer.actions'

interface DeleteCustomerButtonProps {
  id: string
  name: string
}

export default function DeleteCustomerButton({ id, name }: DeleteCustomerButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setPending(true)
    setError(null)
    const result = await deleteCustomer(id)
    if (!result.success) {
      setError(result.error)
      setPending(false)
    } else {
      router.push('/admin/musteriler')
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Sil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Müşteriyi Sil</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-700">
              <span className="font-medium">&quot;{name}&quot;</span> adlı müşteri ve bu müşteriye
              ait tüm <span className="font-medium">bağlı randevular</span> kalıcı olarak
              silinecektir.
            </p>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {pending ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                disabled={pending}
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