'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { LISTING_TYPE_LABELS } from '@/lib/constants'

interface HeroSearchProps {
  districts: string[]
}

export default function HeroSearch({ districts }: HeroSearchProps) {
  const router = useRouter()
  const [listingType, setListingType] = useState('')
  const [district, setDistrict] = useState('')

  function handleSearch() {
    const params = new URLSearchParams()
    if (listingType) params.set('listing_type', listingType)
    if (district) params.set('district', district)
    const qs = params.toString()
    router.push(`/ilanlar${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Satılık / Kiralık */}
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="flex-1 rounded-xl border-0 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
        >
          <option value="">Satılık veya Kiralık</option>
          <option value="satilik">{LISTING_TYPE_LABELS['satilik']}</option>
          <option value="kiralik">{LISTING_TYPE_LABELS['kiralik']}</option>
        </select>

        {/* İlçe */}
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="flex-1 rounded-xl border-0 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
        >
          <option value="">Tüm İlçeler</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          <Search className="h-4 w-4" />
          Ara
        </button>
      </div>
    </div>
  )
}