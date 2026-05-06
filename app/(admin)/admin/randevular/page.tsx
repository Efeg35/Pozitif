import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import { getAppointments } from '@/app/actions/appointment.actions'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants'
import type { AppointmentStatus } from '@/lib/types'

export default async function RandevularPage() {
  const result = await getAppointments()
  const appointments = result.success ? result.data : []

  const now = new Date()
  const upcoming = appointments.filter(
    (a) => a.status === 'bekliyor' && new Date(a.appointment_date) >= now
  )
  const past = appointments.filter(
    (a) => a.status !== 'bekliyor' || new Date(a.appointment_date) < now
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Randevular</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {upcoming.length} yaklaşan, {past.length} geçmiş
          </p>
        </div>
        <Link
          href="/admin/randevular/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Randevu
        </Link>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <CalendarDays className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Henüz randevu yok</p>
          <p className="text-sm mt-1">İlk randevuyu oluşturmak için butona tıklayın.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-700">Yaklaşan Randevular</h2>
              <div className="bg-white rounded-lg border divide-y">
                {upcoming.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/admin/randevular/${appt.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-zinc-900">
                        {appt.customers?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(appt.appointment_date).toLocaleString('tr-TR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {appt.listings && ` — ${appt.listings.title}`}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-700">Geçmiş Randevular</h2>
              <div className="bg-white rounded-lg border divide-y">
                {past.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/admin/randevular/${appt.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-zinc-900">
                        {appt.customers?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(appt.appointment_date).toLocaleString('tr-TR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {appt.listings && ` — ${appt.listings.title}`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      appt.status === 'tamamlandi' ? 'bg-green-100 text-green-700' :
                      appt.status === 'iptal' ? 'bg-red-100 text-red-700' :
                      'bg-zinc-100 text-zinc-600'
                    }`}>
                      {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}