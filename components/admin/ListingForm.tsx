'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createListingSchema,
  updateListingSchema,
  type CreateListingInput,
  type UpdateListingInput,
} from '@/lib/schemas/listing.schema'
import { createListing, updateListing } from '@/app/actions/listing.actions'
import { slugify } from '@/lib/utils'
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  CURRENCY_LABELS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  LISTING_STATUSES,
  CURRENCIES,
  IZMIR_DISTRICTS,
} from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────

interface ListingFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Listing>
  listingId?: string
  isAdmin?: boolean
  onSuccess?: (listing: Listing) => void
}

type FormValues = CreateListingInput

// ── Field helpers ─────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600 mt-1">{message}</p>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-zinc-800 border-b pb-2 mb-4">{children}</h3>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function ListingForm({
  mode,
  initialData,
  listingId,
  isAdmin = false,
  onSuccess,
}: ListingFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Always type form as CreateListingInput; both schemas share the same fields.
  // Cast resolver to avoid union type mismatch in react-hook-form.
  const schema = mode === 'create' ? createListingSchema : updateListingSchema
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title:         initialData?.title ?? '',
      slug:          initialData?.slug ?? '',
      description:   initialData?.description ?? '',
      price:         initialData?.price ?? (undefined as unknown as number),
      currency:      initialData?.currency ?? 'TRY',
      listing_type:  initialData?.listing_type ?? 'satilik',
      property_type: initialData?.property_type ?? 'daire',
      status:        initialData?.status ?? 'taslak',
      rooms:         initialData?.rooms ?? null,
      living_rooms:  initialData?.living_rooms ?? null,
      bathrooms:     initialData?.bathrooms ?? null,
      area_m2:       initialData?.area_m2 ?? null,
      floor:         initialData?.floor ?? null,
      total_floors:  initialData?.total_floors ?? null,
      building_age:  initialData?.building_age ?? null,
      heating_type:  initialData?.heating_type ?? '',
      is_furnished:  initialData?.is_furnished ?? false,
      has_balcony:   initialData?.has_balcony ?? false,
      has_elevator:  initialData?.has_elevator ?? false,
      has_parking:   initialData?.has_parking ?? false,
      is_in_complex: initialData?.is_in_complex ?? false,
      dues:          initialData?.dues ?? 0,
      deposit:       initialData?.deposit ?? 0,
      address:       initialData?.address ?? '',
      district:      initialData?.district ?? '',
      city:          initialData?.city ?? 'İzmir',
      latitude:      initialData?.latitude ?? null,
      longitude:     initialData?.longitude ?? null,
      is_featured:   initialData?.is_featured ?? false,
    },
  })

  // Auto-generate slug from title (only if user hasn't manually edited it)
  const titleValue = watch('title')
  const slugValue  = watch('slug')

  useEffect(() => {
    if (mode === 'create' && !slugManuallyEdited && titleValue) {
      setValue('slug', slugify(titleValue), { shouldValidate: false })
    }
  }, [titleValue, mode, slugManuallyEdited, setValue])

  // ── Submit ────────────────────────────────────────────────────

  async function onSubmit(data: FormValues) {
    setServerError(null)

    if (mode === 'create') {
      const result = await createListing(data as CreateListingInput)
      if (!result.success) {
        setServerError(result.error)
        return
      }
      onSuccess?.(result.data)
      router.push(`/admin/ilanlar/${result.data.id}`)
    } else {
      if (!listingId) return
      const result = await updateListing(listingId, data as UpdateListingInput)
      if (!result.success) {
        setServerError(result.error)
        return
      }
      onSuccess?.(result.data)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Server error */}
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* ── SECTION 1: Temel Bilgiler ─────────────────────────── */}
      <div>
        <SectionHeading>Temel Bilgiler</SectionHeading>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="ör. İzmir Karşıyaka 3+1 Satılık Daire"
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="izmir-karsiyaka-3-1-satilik-daire"
              onChange={(e) => {
                setSlugManuallyEdited(true)
                setValue('slug', e.target.value)
              }}
            />
            {slugValue && (
              <p className="text-xs text-zinc-400 mt-1">
                Önizleme: /ilanlar/{listingId ?? '[yeni-id]'}/{slugValue}
              </p>
            )}
            <FieldError message={errors.slug?.message} />
          </div>

          {/* listing_type */}
          <div>
            <Label>İlan Türü *</Label>
            <div className="flex gap-4 mt-1">
              {LISTING_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={type}
                    {...register('listing_type')}
                    className="accent-blue-700"
                  />
                  <span className="text-sm">{LISTING_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
            <FieldError message={errors.listing_type?.message} />
          </div>

          {/* property_type */}
          <div>
            <Label htmlFor="property_type">Mülk Türü *</Label>
            <select
              id="property_type"
              {...register('property_type')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>{PROPERTY_TYPE_LABELS[pt]}</option>
              ))}
            </select>
            <FieldError message={errors.property_type?.message} />
          </div>

          {/* status */}
          <div>
            <Label htmlFor="status">Durum *</Label>
            <select
              id="status"
              {...register('status')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LISTING_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <FieldError message={errors.status?.message} />
          </div>

          {/* is_featured — admin only */}
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="is_featured"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 accent-blue-700"
                  />
                )}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">Öne çıkan ilan</Label>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Fiyat ─────────────────────────────────── */}
      <div>
        <SectionHeading>Fiyat</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Fiyat *</Label>
            <Input id="price" type="number" min={0} step="any" {...register('price')} />
            <FieldError message={errors.price?.message} />
          </div>
          <div>
            <Label htmlFor="currency">Para Birimi</Label>
            <select
              id="currency"
              {...register('currency')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="dues">Aidat (₺/ay)</Label>
            <Input id="dues" type="number" min={0} step="any" {...register('dues')} />
            <FieldError message={errors.dues?.message} />
          </div>
          <div>
            <Label htmlFor="deposit">Depozito</Label>
            <Input id="deposit" type="number" min={0} step="any" {...register('deposit')} />
            <FieldError message={errors.deposit?.message} />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Özellikler ─────────────────────────────── */}
      <div>
        <SectionHeading>Özellikler</SectionHeading>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="area_m2">Alan (m²)</Label>
            <Input id="area_m2" type="number" min={0} step="any" {...register('area_m2')} />
            <FieldError message={errors.area_m2?.message} />
          </div>
          <div>
            <Label htmlFor="rooms">Oda Sayısı</Label>
            <Input id="rooms" type="number" min={1} step={1} {...register('rooms')} />
          </div>
          <div>
            <Label htmlFor="living_rooms">Salon</Label>
            <Input id="living_rooms" type="number" min={0} step={1} {...register('living_rooms')} />
          </div>
          <div>
            <Label htmlFor="bathrooms">Banyo</Label>
            <Input id="bathrooms" type="number" min={0} step={1} {...register('bathrooms')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="floor">Bulunduğu Kat</Label>
            <Input id="floor" type="number" step={1} {...register('floor')} />
          </div>
          <div>
            <Label htmlFor="total_floors">Toplam Kat</Label>
            <Input id="total_floors" type="number" min={1} step={1} {...register('total_floors')} />
          </div>
          <div>
            <Label htmlFor="building_age">Bina Yaşı</Label>
            <Input id="building_age" type="number" min={0} step={1} {...register('building_age')} />
            <FieldError message={errors.building_age?.message} />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="heating_type">Isıtma Tipi</Label>
          <Input
            id="heating_type"
            {...register('heating_type')}
            placeholder="ör. Kombi, Doğalgaz, Merkezi"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { name: 'is_furnished',  label: 'Eşyalı' },
              { name: 'has_balcony',   label: 'Balkon' },
              { name: 'has_elevator',  label: 'Asansör' },
              { name: 'has_parking',   label: 'Otopark' },
              { name: 'is_in_complex', label: 'Site içinde' },
            ] as const
          ).map(({ name, label }) => (
            <div key={name} className="flex items-center gap-2">
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id={name}
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 accent-blue-700"
                  />
                )}
              />
              <Label htmlFor={name} className="cursor-pointer font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: Konum ─────────────────────────────────── */}
      <div>
        <SectionHeading>Konum</SectionHeading>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input id="city" {...register('city')} placeholder="İzmir" />
            </div>
            <div>
              <Label htmlFor="district">İlçe</Label>
              <select
                id="district"
                {...register('district')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Seçiniz —</option>
                {IZMIR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <FieldError message={errors.district?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adres</Label>
            <textarea
              id="address"
              {...register('address')}
              rows={2}
              placeholder="Sokak, mahalle, bina bilgisi…"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Enlem</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude')}
                placeholder="38.4237"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Boylam</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude')}
                placeholder="27.1428"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Açıklama ───────────────────────────────── */}
      <div>
        <SectionHeading>Açıklama</SectionHeading>
        <textarea
          id="description"
          {...register('description')}
          rows={6}
          placeholder="İlan hakkında detaylı bilgi…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[120px]"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting
            ? 'Kaydediliyor…'
            : mode === 'create'
              ? 'İlanı Kaydet'
              : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </form>
  )
}