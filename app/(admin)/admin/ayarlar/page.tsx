import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AyarlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!agent?.is_admin) redirect('/admin')

  return <div className="text-zinc-700">Ayarlar (Phase 5)</div>
}