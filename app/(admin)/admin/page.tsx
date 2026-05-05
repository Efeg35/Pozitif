import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/admin/StatsCard'
import { Home, CheckCircle, Users, CalendarDays, MessageSquare } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch real counts (will return 0 initially)
  const [
    { count: totalListings },
    { count: activeListings },
    { count: totalCustomers },
    { count: thisMonthAppointments },
    { count: newInquiries },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'aktif'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'yeni'),
  ])

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
          value={totalListings ?? 0}
          icon={Home}
          description="Tüm durumlardaki ilanlar"
        />
        <StatsCard
          title="Aktif İlan"
          value={activeListings ?? 0}
          icon={CheckCircle}
          description="Sitede yayında"
        />
        <StatsCard
          title="Toplam Müşteri"
          value={totalCustomers ?? 0}
          icon={Users}
          description="Kayıtlı müşteriler"
        />
        <StatsCard
          title="Bu Ay Randevu"
          value={thisMonthAppointments ?? 0}
          icon={CalendarDays}
          description="Bu aydaki randevular"
        />
      </div>

      {/* Recent Inquiries Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900">Son Talepler</h2>
          {(newInquiries ?? 0) > 0 && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
              {newInquiries} yeni
            </span>
          )}
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
          <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Henüz talep yok</p>
          <p className="text-xs mt-1">Ziyaretçi talepleri burada görünecek</p>
        </div>
      </div>
    </div>
  )
}