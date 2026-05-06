import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getListings } from '@/app/actions/listing.actions'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  STATUS_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  LISTING_STATUSES,
  LISTING_TYPES,
  IZMIR_DISTRICTS,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Home } from 'lucide-react'
import DeleteListingButton from './DeleteListingButton'
import type { ListingStatus } from '@/lib/types'

// ── Status badge colours ───────────────────────────────────────

const STATUS_VARIANT: Record<ListingStatus, string> = {
  aktif:     'bg-green-100 text-green-800',
  taslak:    'bg-zinc-100 text-zinc-700',
  satildi:   'bg-blue-100 text-blue-800',
  kiralandi: 'bg-purple-100 text-purple-800',
  pasif:     'bg-red-100 text-red-700',
}

// ── Page ──────────────────────────────────────────────────────

interface PageProps {
  searchParams: { status?: string; listing_type?: string; district?: string }
}

export default async function IlanlarPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const listingsResult = await getListings({
    status:       searchParams.status,
    listing_type: searchParams.listing_type,
    district:     searchParams.district,
  })

  type ListingRow = {
    id: string
    title: string
    slug: string
    price: number
    currency: string
    listing_type: string
    property_type: string
    status: string
    district: string | null
    city: string
    created_at: string
    agents: { full_name: string } | null
    listing_images: { url: string; is_cover: boolean; display_order: number }[]
  }

  const rows: ListingRow[] = listingsResult.success
    ? (listingsResult.data as unknown as ListingRow[])
    : []

  // Build filter URL helper
  function filterUrl(key: string, value: string) {
    const p = new URLSearchParams(searchParams as Record<string, string>)
    if (value) p.set(key, value); else p.delete(key)
    const s = p.toString()
    return `/admin/ilanlar${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">İlanlar</h1>
          <p className="text-sm text-zinc-500 mt-1">Tüm emlak ilanlarını yönetin</p>
        </div>
        <Link href="/admin/ilanlar/yeni">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni İlan
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Durum:</span>
          <Link
            href={filterUrl('status', '')}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${!searchParams.status ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            Tümü
          </Link>
          {LISTING_STATUSES.map((s) => (
            <Link
              key={s}
              href={filterUrl('status', s)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${searchParams.status === s ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Tür:</span>
          <Link
            href={filterUrl('listing_type', '')}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${!searchParams.listing_type ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            Tümü
          </Link>
          {LISTING_TYPES.map((t) => (
            <Link
              key={t}
              href={filterUrl('listing_type', t)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${searchParams.listing_type === t ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {LISTING_TYPE_LABELS[t]}
            </Link>
          ))}
        </div>

        {/* District filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">İlçe:</span>
          <select
            defaultValue={searchParams.district ?? ''}
            onChange={(e) => {
              window.location.href = filterUrl('district', e.target.value)
            }}
            className="text-xs rounded-md border border-input px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tüm İlçeler</option>
            {IZMIR_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border rounded-lg py-16 gap-4 text-zinc-400">
          <Home className="h-12 w-12 opacity-30" />
          <p className="font-medium text-sm">Henüz ilan yok</p>
          <Link href="/admin/ilanlar/yeni">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Yeni İlan Ekle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 w-14">Foto</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Fiyat</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Tür</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Danışman</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Tarih</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((listing) => {
                const coverImg = listing.listing_images
                  ?.sort((a, b) => a.display_order - b.display_order)
                  .find((img) => img.is_cover) ?? listing.listing_images?.[0]

                return (
                  <tr key={listing.id} className="hover:bg-zinc-50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-zinc-100 shrink-0 relative">
                        {coverImg ? (
                          <Image
                            src={coverImg.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <Home className="h-5 w-5 text-zinc-300" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title + location */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-zinc-900 truncate">{listing.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {[listing.district, listing.city].filter(Boolean).join(', ')}
                      </p>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-800">
                      {formatPrice(listing.price, listing.currency as 'TRY' | 'USD' | 'EUR')}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      <span>{LISTING_TYPE_LABELS[listing.listing_type as keyof typeof LISTING_TYPE_LABELS]}</span>
                      <span className="mx-1 text-zinc-300">·</span>
                      <span>{PROPERTY_TYPE_LABELS[listing.property_type as keyof typeof PROPERTY_TYPE_LABELS]}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_VARIANT[listing.status as ListingStatus] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {STATUS_LABELS[listing.status as ListingStatus] ?? listing.status}
                      </span>
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      {listing.agents?.full_name ?? '—'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {formatDate(listing.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/ilanlar/${listing.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </Link>
                        <DeleteListingButton id={listing.id} title={listing.title} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}