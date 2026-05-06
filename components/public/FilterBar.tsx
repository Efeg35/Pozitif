'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  HEATING_TYPES,
  HEATING_TYPE_LABELS,
  BUILDING_AGE_RANGES,
  FLOOR_RANGES,
  SORT_OPTIONS,
} from '@/lib/constants'
import type { BuildingAgeRange, FloorRange, HeatingType } from '@/lib/types'

interface FilterBarProps {
  currentFilters: {
    listing_type?: string
    property_type?: string
    district?: string
    min_price?: string
    max_price?: string
    rooms?: string
    min_area?: string
    max_area?: string
    building_age?: string
    floor_range?: string
    bathrooms?: string
    heating_type?: string
    is_furnished?: string
    has_balcony?: string
    has_elevator?: string
    has_parking?: string
    is_in_complex?: string
    max_dues?: string
    max_deposit?: string
    sort?: string
  }
  availableDistricts: string[]
  totalCount: number
}

type LocalFilters = {
  listing_type: string
  property_type: string
  district: string
  min_price: string
  max_price: string
  rooms: string
  min_area: string
  max_area: string
  building_age: string
  floor_range: string
  bathrooms: string
  heating_type: string
  is_furnished: boolean
  has_balcony: boolean
  has_elevator: boolean
  has_parking: boolean
  is_in_complex: boolean
  max_dues: string
  max_deposit: string
  sort: string
}

const EMPTY_FILTERS: LocalFilters = {
  listing_type: '',  property_type: '', district: '',
  min_price: '',     max_price: '',     rooms: '',
  min_area: '',      max_area: '',      building_age: '',
  floor_range: '',   bathrooms: '',     heating_type: '',
  is_furnished: false, has_balcony: false, has_elevator: false,
  has_parking: false,  is_in_complex: false,
  max_dues: '',      max_deposit: '',   sort: '',
}

const ROOMS_OPTIONS = [
  { label: 'Tümü', value: '' },
  { label: '1+1',  value: '1' },
  { label: '2+1',  value: '2' },
  { label: '3+1',  value: '3' },
  { label: '4+1',  value: '4' },
  { label: '5+',   value: '5' },
]

const BATHROOMS_OPTIONS = [
  { label: 'Tümü', value: '' },
  { label: '1+',   value: '1' },
  { label: '2+',   value: '2' },
  { label: '3+',   value: '3' },
]

const LISTING_TYPE_OPTIONS = [
  { label: 'Tümü',    value: '' },
  { label: LISTING_TYPE_LABELS['satilik'], value: 'satilik' },
  { label: LISTING_TYPE_LABELS['kiralik'], value: 'kiralik' },
]

function selectCls() {
  return 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
}

function inputCls() {
  return 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
}

function pillBtn(active: boolean) {
  return `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
  }`
}

function countAdvanced(f: LocalFilters): number {
  return [
    f.min_area, f.max_area, f.building_age, f.floor_range,
    f.bathrooms, f.heating_type, f.max_dues, f.max_deposit,
    f.is_furnished, f.has_balcony, f.has_elevator, f.has_parking, f.is_in_complex,
  ].filter(Boolean).length
}

export default function FilterBar({ currentFilters, availableDistricts, totalCount }: FilterBarProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [f, setF] = useState<LocalFilters>({
    listing_type:  currentFilters.listing_type  ?? '',
    property_type: currentFilters.property_type ?? '',
    district:      currentFilters.district      ?? '',
    min_price:     currentFilters.min_price     ?? '',
    max_price:     currentFilters.max_price     ?? '',
    rooms:         currentFilters.rooms         ?? '',
    min_area:      currentFilters.min_area      ?? '',
    max_area:      currentFilters.max_area      ?? '',
    building_age:  currentFilters.building_age  ?? '',
    floor_range:   currentFilters.floor_range   ?? '',
    bathrooms:     currentFilters.bathrooms     ?? '',
    heating_type:  currentFilters.heating_type  ?? '',
    is_furnished:  currentFilters.is_furnished  === 'true',
    has_balcony:   currentFilters.has_balcony   === 'true',
    has_elevator:  currentFilters.has_elevator  === 'true',
    has_parking:   currentFilters.has_parking   === 'true',
    is_in_complex: currentFilters.is_in_complex === 'true',
    max_dues:      currentFilters.max_dues      ?? '',
    max_deposit:   currentFilters.max_deposit   ?? '',
    sort:          currentFilters.sort          ?? '',
  })

  function set(key: keyof LocalFilters, value: string | boolean) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  function handleApply() {
    const p = new URLSearchParams()
    if (f.listing_type)  p.set('listing_type',  f.listing_type)
    if (f.property_type) p.set('property_type', f.property_type)
    if (f.district)      p.set('district',      f.district)
    if (f.min_price)     p.set('min_price',     f.min_price)
    if (f.max_price)     p.set('max_price',     f.max_price)
    if (f.rooms)         p.set('rooms',         f.rooms)
    if (f.min_area)      p.set('min_area',      f.min_area)
    if (f.max_area)      p.set('max_area',      f.max_area)
    if (f.building_age)  p.set('building_age',  f.building_age)
    if (f.floor_range)   p.set('floor_range',   f.floor_range)
    if (f.bathrooms)     p.set('bathrooms',     f.bathrooms)
    if (f.heating_type)  p.set('heating_type',  f.heating_type)
    if (f.is_furnished)  p.set('is_furnished',  'true')
    if (f.has_balcony)   p.set('has_balcony',   'true')
    if (f.has_elevator)  p.set('has_elevator',  'true')
    if (f.has_parking)   p.set('has_parking',   'true')
    if (f.is_in_complex) p.set('is_in_complex', 'true')
    if (f.max_dues)      p.set('max_dues',      f.max_dues)
    if (f.max_deposit)   p.set('max_deposit',   f.max_deposit)
    if (f.sort)          p.set('sort',          f.sort)
    const qs = p.toString()
    router.push(`/ilanlar${qs ? `?${qs}` : ''}`)
    setMobileOpen(false)
  }

  function handleClear() {
    setF(EMPTY_FILTERS)
    router.push('/ilanlar')
    setMobileOpen(false)
    setAdvancedOpen(false)
  }

  const hasActiveFilters =
    Object.values({ ...f, is_furnished: f.is_furnished ? 'true' : '', has_balcony: f.has_balcony ? 'true' : '', has_elevator: f.has_elevator ? 'true' : '', has_parking: f.has_parking ? 'true' : '', is_in_complex: f.is_in_complex ? 'true' : '' }).some(Boolean)

  const advancedCount = countAdvanced(f)

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-700">Filtreler</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{totalCount} ilan</span>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 md:hidden"
          >
            {mobileOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            {mobileOpen ? 'Kapat' : 'Filtrele'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} md:block border-t border-zinc-100`}>

        {/* Basic filters */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">İlan Türü</label>
            <div className="flex gap-1">
              {LISTING_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => set('listing_type', opt.value)}
                  className={`${pillBtn(f.listing_type === opt.value)} flex-1`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Mülk Türü</label>
            <select value={f.property_type} onChange={(e) => set('property_type', e.target.value)} className={selectCls()}>
              <option value="">Tümü</option>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>{PROPERTY_TYPE_LABELS[pt]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">İlçe</label>
            <select value={f.district} onChange={(e) => set('district', e.target.value)} className={selectCls()}>
              <option value="">Tüm İlçeler</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Sıralama</label>
            <select value={f.sort} onChange={(e) => set('sort', e.target.value)} className={selectCls()}>
              <option value="">Varsayılan</option>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-400">Fiyat Aralığı</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min ₺" value={f.min_price}
                onChange={(e) => set('min_price', e.target.value)} className={inputCls()} />
              <input type="number" placeholder="Max ₺" value={f.max_price}
                onChange={(e) => set('max_price', e.target.value)} className={inputCls()} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-400">Oda Sayısı</label>
            <div className="flex flex-wrap gap-1.5">
              {ROOMS_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => set('rooms', opt.value)}
                  className={pillBtn(f.rooms === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced accordion */}
        <div className="border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <span>
              Detaylı Filtreler
              {advancedCount > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {advancedCount}
                </span>
              )}
            </span>
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {advancedOpen && (
            <div className="grid grid-cols-1 gap-3 border-t border-zinc-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-400">Metrekare (m²)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min m²" value={f.min_area}
                    onChange={(e) => set('min_area', e.target.value)} className={inputCls()} />
                  <input type="number" placeholder="Max m²" value={f.max_area}
                    onChange={(e) => set('max_area', e.target.value)} className={inputCls()} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Bina Yaşı</label>
                <select value={f.building_age}
                  onChange={(e) => set('building_age', e.target.value as BuildingAgeRange | '')}
                  className={selectCls()}>
                  <option value="">Tümü</option>
                  {BUILDING_AGE_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Bulunduğu Kat</label>
                <select value={f.floor_range}
                  onChange={(e) => set('floor_range', e.target.value as FloorRange | '')}
                  className={selectCls()}>
                  <option value="">Tümü</option>
                  {FLOOR_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Banyo Sayısı</label>
                <div className="flex flex-wrap gap-1.5">
                  {BATHROOMS_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => set('bathrooms', opt.value)}
                      className={pillBtn(f.bathrooms === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Isıtma</label>
                <select value={f.heating_type}
                  onChange={(e) => set('heating_type', e.target.value as HeatingType | '')}
                  className={selectCls()}>
                  <option value="">Tümü</option>
                  {HEATING_TYPES.map((ht) => (
                    <option key={ht} value={ht}>{HEATING_TYPE_LABELS[ht]}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Maks. Aidat (₺)</label>
                <input type="number" placeholder="Örn. 1000" value={f.max_dues}
                  onChange={(e) => set('max_dues', e.target.value)} className={inputCls()} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Maks. Depozito (₺)</label>
                <input type="number" placeholder="Örn. 5000" value={f.max_deposit}
                  onChange={(e) => set('max_deposit', e.target.value)} className={inputCls()} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                <label className="text-xs font-medium text-zinc-400">Özellikler</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['is_furnished',  'Eşyalı'],
                    ['has_balcony',   'Balkon'],
                    ['has_elevator',  'Asansör'],
                    ['has_parking',   'Otopark'],
                    ['is_in_complex', 'Site İçi'],
                  ] as [keyof LocalFilters, string][]).map(([key, label]) => (
                    <button key={key} type="button"
                      onClick={() => set(key, !f[key])}
                      className={pillBtn(Boolean(f[key]))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-4 py-3">
          {hasActiveFilters && (
            <button type="button" onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-zinc-700 underline underline-offset-2">
              Temizle
            </button>
          )}
          <button type="button" onClick={handleApply}
            className="flex items-center gap-1.5 rounded-xl bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors">
            <Search className="h-3.5 w-3.5" />
            Filtrele
          </button>
        </div>
      </div>
    </div>
  )
}