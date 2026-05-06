import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import { getAppointments } from '@/app/actions/appointment.actions'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUSES } from '@/lib/constants'
import type { AppointmentStatus } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{
    period?: string // 'today' | 'week' | 'month' | 'all'
    status?: string
  }>
}

function getPeriodRange(period?: string): { date_from?: string; date_to?: string } {
  if (!period || period === 'all') return {}
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (period === 'today') {
    const today = fmt(now)
    return { date_from: `${today}T00:00:00`, date_to: `${today}T23:59:59` }
  }
  if (period === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1 // Mon=0
    const mon = new Date(now)
    mon.setDate(now.getDate() - day)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { date_from: `${fmt(mon)}T00:00:00`, date_to: `${fmt(sun)}T23:59:59` }
  }
  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { date_from: `${fmt(first)}T00:00:00`, date_to: `${fmt(last)}T23:59:59` }
  }
  return {}
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  all: 'Tümü',
}

export default async function RandevularPage({ searchParams }: PageProps) {
  const { period, status } = await searchParams
  const activePeriod = period ?? 'all'

  const { date_from, date_to } = getPeriodRange(activePeriod)
  const result = await getAppointments({
    status: status || undefined,
    date_from,
    date_to,
  })
  const appointments = result.success ? result.data : []

  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { period: activePeriod, status, ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== 'all') sp.set(k, v)
    })
    const qs = sp.toString()
    return `/admin/randevular${qs ? `?${qs}` : ''}`
  }

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Period quick-filter */}
        <div className="flex gap-2 items-center flex-wrap">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={buildUrl({ period: key === 'all' ? undefined : key })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                activePeriod === key
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 items-center flex-wrap">
          <Link
            href={buildUrl({ status: undefined })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !status
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            Durum: Tümü
          </Link>
          {(APPOINTMENT_STATUSES as readonly string[]).map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                status === s
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {APPOINTMENT_STATUS_LABELS[s as AppointmentStatus]}
            </Link>
          ))}
        </div>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <CalendarDays className="h-12 w-12 mb-3" />
          {status || period ? (
            <>
              <p className="text-lg font-medium">Sonuç bulunamadı</p>
              <p className="text-sm mt-1">Farklı filtreler deneyin.</p>
              <Link
                href="/admin/randevular"
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Filtreleri temizle
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Henüz randevu yok</p>
              <p className="text-sm mt-1">İlk randevuyu oluşturmak için butona tıklayın.</p>
            </>
          )}
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
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
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
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {appt.listings && ` — ${appt.listings.title}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        appt.status === 'tamamlandi'
                          ? 'bg-green-100 text-green-700'
                          : appt.status === 'iptal'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
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