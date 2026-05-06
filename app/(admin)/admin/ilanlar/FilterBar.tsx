'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  STATUS_LABELS,
  LISTING_TYPE_LABELS,
  LISTING_STATUSES,
  LISTING_TYPES,
  IZMIR_DISTRICTS,
} from '@/lib/constants'

interface FilterBarProps {
  currentStatus?: string
  currentType?: string
  currentDistrict?: string
}

function buildFilterUrl(
  base: { status?: string; listing_type?: string; district?: string },
  key: string,
  value: string
) {
  const merged = { ...base, [key]: value || undefined }
  const p = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
  const s = p.toString()
  return `/admin/ilanlar${s ? `?${s}` : ''}`
}

export default function FilterBar({
  currentStatus,
  currentType,
  currentDistrict,
}: FilterBarProps) {
  const router = useRouter()
  const base = {
    status: currentStatus,
    listing_type: currentType,
    district: currentDistrict,
  }

  return (
    <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-zinc-500">Durum:</span>
        <Link
          href={buildFilterUrl(base, 'status', '')}
          className={`text-xs px-2 py-1 rounded-full transition-colors ${!currentStatus ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
        >
          Tümü
        </Link>
        {LISTING_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildFilterUrl(base, 'status', s)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${currentStatus === s ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-zinc-500">Tür:</span>
        <Link
          href={buildFilterUrl(base, 'listing_type', '')}
          className={`text-xs px-2 py-1 rounded-full transition-colors ${!currentType ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
        >
          Tümü
        </Link>
        {LISTING_TYPES.map((t) => (
          <Link
            key={t}
            href={buildFilterUrl(base, 'listing_type', t)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${currentType === t ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {LISTING_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* District filter — router.push instead of window.location.href */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">İlçe:</span>
        <select
          defaultValue={currentDistrict ?? ''}
          onChange={(e) => router.push(buildFilterUrl(base, 'district', e.target.value))}
          className="text-xs rounded-md border border-input px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tüm İlçeler</option>
          {IZMIR_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  )
}