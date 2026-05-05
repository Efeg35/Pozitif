import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, title, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar agent={agent} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  )
}