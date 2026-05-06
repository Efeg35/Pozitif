'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from '@/lib/constants'

interface FilterBarProps {
  currentFilters: {
    listing_type?: string
    property_type?: string
    district?: string
    min_price?: string
    max_price?: string
    rooms?: string
  }
  availableDistricts: string[]
  totalCount: number
}

const ROOMS_OPTIONS = [
  { label: 'Tümü', value: '' },
  { label: '1+1', value: '1' },
  { label: '2+1', value: '2' },
  { label: '3+1', value: '3' },
  { label: '4+1', value: '4' },
  { label: '4+', value: '5' },
]

const LISTING_TYPE_OPTIONS = [
  { label: 'Tümü', value: '' },
  { label: LISTING_TYPE_LABELS['satilik'], value: 'satilik' },
  { label: LISTING_TYPE_LABELS['kiralik'], value: 'kiralik' },
]

export default function FilterBar({
  currentFilters,
  availableDistricts,
  totalCount,
}: FilterBarProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const [localFilters, setLocalFilters] = useState({
    listing_type: currentFilters.listing_type ?? '',
    property_type: currentFilters.property_type ?? '',
    district: currentFilters.district ?? '',
    min_price: currentFilters.min_price ?? '',
    max_price: currentFilters.max_price ?? '',
    rooms: currentFilters.rooms ?? '',
  })

  function handleApply() {
    const params = new URLSearchParams()
    if (localFilters.listing_type) params.set('listing_type', localFilters.listing_type)
    if (localFilters.property_type) params.set('property_type', localFilters.property_type)
    if (localFilters.district) params.set('district', localFilters.district)
    if (localFilters.min_price) params.set('min_price', localFilters.min_price)
    if (localFilters.max_price) params.set('max_price', localFilters.max_price)
    if (localFilters.rooms) params.set('rooms', localFilters.rooms)
    const qs = params.toString()
    router.push(`/ilanlar${qs ? `?${qs}` : ''}`)
    setExpanded(false)
  }

  function handleClear() {
    setLocalFilters({
      listing_type: '',
      property_type: '',
      district: '',
      min_price: '',
      max_price: '',
      rooms: '',
    })
    router.push('/ilanlar')
    setExpanded(false)
  }

  const hasActiveFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">Filtreler</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{totalCount} ilan bulundu</span>
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 md:hidden"
          >
            {expanded ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            {expanded ? 'Kapat' : 'Filtrele'}
          </button>
        </div>
      </div>

      {/* Filters body — always visible on md+, collapsible on mobile */}
      <div className={`${expanded ? 'block' : 'hidden'} md:block border-t border-zinc-100`}>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* İlan Türü */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">İlan Türü</label>
            <div className="flex gap-1">
              {LISTING_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalFilters((f) => ({ ...f, listing_type: opt.value }))}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    localFilters.listing_type === opt.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mülk Türü */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Mülk Türü</label>
            <select
              value={localFilters.property_type}
              onChange={(e) => setLocalFilters((f) => ({ ...f, property_type: e.target.value }))}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {PROPERTY_TYPE_LABELS[pt]}
                </option>
              ))}
            </select>
          </div>

          {/* İlçe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">İlçe</label>
            <select
              value={localFilters.district}
              onChange={(e) => setLocalFilters((f) => ({ ...f, district: e.target.value }))}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tüm İlçeler</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Fiyat */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Fiyat Aralığı</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min ₺"
                value={localFilters.min_price}
                onChange={(e) => setLocalFilters((f) => ({ ...f, min_price: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max ₺"
                value={localFilters.max_price}
                onChange={(e) => setLocalFilters((f) => ({ ...f, max_price: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Oda Sayısı */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Oda Sayısı</label>
            <div className="flex flex-wrap gap-1.5">
              {ROOMS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalFilters((f) => ({ ...f, rooms: opt.value }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    localFilters.rooms === opt.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-4 py-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-zinc-500 hover:text-zinc-700 underline underline-offset-2"
            >
              Temizle
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Filtrele
          </button>
        </div>
      </div>
    </div>
  )
}