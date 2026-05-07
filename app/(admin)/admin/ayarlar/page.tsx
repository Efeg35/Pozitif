// app/(admin)/admin/ayarlar/page.tsx
// Admin office settings page — admin-only, fetches current settings SSR.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOfficeSettings } from '@/app/actions/settings.actions'
import OfficeSettingsForm from '@/components/admin/OfficeSettingsForm'

export const metadata = {
  title: 'Ofis Ayarları | Admin',
}

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

  const settings = await getOfficeSettings()

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ofis Ayarları</h1>
        <p className="mt-1 text-sm text-gray-500">
          İletişim bilgileri, sosyal medya ve logo ayarlarını buradan yönetin.
        </p>
      </div>
      <OfficeSettingsForm initial={settings} />
    </div>
  )
}