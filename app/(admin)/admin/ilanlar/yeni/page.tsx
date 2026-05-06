import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListingForm from '@/components/admin/ListingForm'

export default async function YeniIlanPage() {
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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Yeni İlan</h1>
        <p className="text-sm text-zinc-500 mt-1">Yeni bir emlak ilanı oluşturun</p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <ListingForm mode="create" isAdmin={agent?.is_admin ?? false} />
      </div>
    </div>
  )
}