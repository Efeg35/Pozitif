import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import { getUnreadInquiryCount } from '@/app/actions/crm.actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, title, avatar_url, is_admin')
    .eq('id', user.id)
    .single()

  // If no agents row exists for this user, they have no access
  if (!agent) {
    redirect('/login')
  }

  const unreadInquiryCount = await getUnreadInquiryCount()

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        agent={agent}
        is_admin={agent.is_admin ?? false}
        unreadInquiryCount={unreadInquiryCount}
      />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  )
}