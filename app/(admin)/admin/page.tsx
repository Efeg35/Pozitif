import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/admin/StatsCard'
import Link from 'next/link'
import { Home, CheckCircle, Users, CalendarDays, MessageSquare, ArrowRight, Clock } from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

type UpcomingAppointment = {
  id: string
  appointment_date: string
  duration_minutes: number | null
  title: string | null
  customers: any
}

function getCustomerName(customers: any): string {
  if (!customers) return '—'
  if (Array.isArray(customers)) return customers[0]?.full_name ?? '—'
  return customers.full_name ?? '—'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let totalListings = 0
  let activeListings = 0
  let totalCustomers = 0
  let thisMonthAppointments = 0
  let newInquiries = 0
  let draftListings = 0
  let upcomingAppointments: UpcomingAppointment[] = []

  try {
    const now = new Date().toISOString()
    const results = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'aktif'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'yeni'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'taslak'),
      supabase
        .from('appointments')
        .select('id, appointment_date, duration_minutes, title, customers(full_name)')
        .gte('appointment_date', now)
        .order('appointment_date', { ascending: true })
        .limit(5),
    ])

    results.slice(0, 6).forEach(({ error }, i) => {
      if (error) console.error(`Dashboard count query [${i}] failed:`, error.message)
    })

    totalListings         = results[0].count ?? 0
    activeListings        = results[1].count ?? 0
    totalCustomers        = results[2].count ?? 0
    thisMonthAppointments = results[3].count ?? 0
    newInquiries          = results[4].count ?? 0
    draftListings         = results[5].count ?? 0

    const apptResult = results[6]
    if (!apptResult.error && apptResult.data) {
      upcomingAppointments = apptResult.data as UpcomingAppointment[]
    }
  } catch (err) {
    console.error('Dashboard count queries failed:', err)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Genel bakış</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Toplam İlan"
          value={totalListings}
          icon={Home}
          description="Tüm durumlardaki ilanlar"
        />
        <StatsCard
          title="Aktif İlan"
          value={activeListings}
          icon={CheckCircle}
          description="Sitede yayında"
        />
        <StatsCard
          title="Toplam Müşteri"
          value={totalCustomers}
          icon={Users}
          description="Kayıtlı müşteriler"
        />
        <StatsCard
          title="Bu Ay Randevu"
          value={thisMonthAppointments}
          icon={CalendarDays}
          description="Bu aydaki randevular"
        />
      </div>

      {/* Draft listings alert */}
      {draftListings > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {draftListings} ilan taslak durumunda — yayınlamayı unutmayın
          </p>
          <Link
            href="/admin/ilanlar?status=taslak"
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap"
          >
            Görüntüle
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-900">Yaklaşan Randevular</h2>
            <Link
              href="/admin/randevular"
              className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Tümü
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcomingAppointments.length > 0 ? (
            <ul className="divide-y">
              {upcomingAppointments.map((appt) => {
                const dt = new Date(appt.appointment_date)
                return (
                  <li key={appt.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {getCustomerName(appt.customers)}
                      </p>
                      {appt.title && (
                        <p className="text-xs text-zinc-500 truncate">{appt.title}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-zinc-700">
                        {dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {appt.duration_minutes ? ` · ${appt.duration_minutes} dk` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
              <CalendarDays className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Yaklaşan randevu yok</p>
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-900">Son Talepler</h2>
            {newInquiries > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                {newInquiries} yeni
              </span>
            )}
          </div>

          {newInquiries > 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">{newInquiries}</span> adet yeni talep yanıt bekliyor.
              </p>
              <Link
                href="/admin/talepler"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Talepleri görüntüle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
              <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Yeni talep yok</p>
              <p className="text-xs mt-1">Ziyaretçi talepleri burada görünecek</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}