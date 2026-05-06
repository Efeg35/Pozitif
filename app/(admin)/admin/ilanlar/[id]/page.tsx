import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getListing } from '@/app/actions/listing.actions'
import ListingForm from '@/components/admin/ListingForm'
import ImageUploader from '@/components/admin/ImageUploader'
import DeleteListingButton from '../DeleteListingButton'
import { STATUS_LABELS } from '@/lib/constants'
import type { Listing, ListingImage, ListingStatus } from '@/lib/types'

const STATUS_VARIANT: Record<ListingStatus, string> = {
  aktif:     'bg-green-100 text-green-800',
  taslak:    'bg-zinc-100 text-zinc-700',
  satildi:   'bg-blue-100 text-blue-800',
  kiralandi: 'bg-purple-100 text-purple-800',
  pasif:     'bg-red-100 text-red-700',
}

interface PageProps {
  params: { id: string }
}

export default async function EditIlanPage({ params }: PageProps) {
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

  const result = await getListing(params.id)
  if (!result.success) redirect('/admin/ilanlar')

  const listingData = result.data as unknown as Listing & { listing_images: ListingImage[] }
  const images: ListingImage[] = (listingData.listing_images ?? [])
    .slice()
    .sort((a: ListingImage, b: ListingImage) => a.display_order - b.display_order)

  const status = listingData.status as ListingStatus

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 truncate">{listingData.title}</h1>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_VARIANT[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">İlanı düzenleyin</p>
        </div>
        <DeleteListingButton
          id={listingData.id}
          title={listingData.title}
          redirectAfter="/admin/ilanlar"
        />
      </div>

      {/* Two-column layout on lg screens */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form — takes 60% */}
        <div className="lg:col-span-3 bg-white border rounded-lg p-6">
          <ListingForm
            mode="edit"
            initialData={listingData}
            listingId={listingData.id}
            isAdmin={agent?.is_admin ?? false}
          />
        </div>

        {/* Image uploader — takes 40% */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6 sticky top-6">
          <ImageUploader
            listingId={listingData.id}
            initialImages={images}
          />
        </div>
      </div>
    </div>
  )
}