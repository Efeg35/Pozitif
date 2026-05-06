'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteAppointment } from '@/app/actions/appointment.actions'

interface DeleteAppointmentButtonProps {
  id: string
}

export default function DeleteAppointmentButton({ id }: DeleteAppointmentButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setPending(true)
    setError(null)
    const result = await deleteAppointment(id)
    if (!result.success) {
      setError(result.error)
      setPending(false)
      setConfirming(false)
    } else {
      router.push('/admin/randevular')
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <span className="text-sm text-zinc-600">Randevu silinsin mi?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Siliniyor...' : 'Evet, Sil'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-3 py-1.5 rounded-md border text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          İptal
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Sil
    </button>
  )
}