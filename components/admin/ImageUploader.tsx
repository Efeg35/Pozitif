'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Star, Trash2, Upload, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_IMAGES_PER_LISTING } from '@/lib/constants'
import { uploadListingImage, deleteListingImage, setCoverImage, reorderImages } from '@/app/actions/image.actions'
import type { ListingImage } from '@/lib/types'

interface ImageUploaderProps {
  listingId: string
  initialImages: ListingImage[]
  onImagesChange?: (images: ListingImage[]) => void
}

export default function ImageUploader({
  listingId,
  initialImages,
  onImagesChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ListingImage[]>(
    [...initialImages].sort((a, b) => a.display_order - b.display_order)
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateImages = useCallback(
    (next: ListingImage[]) => {
      setImages(next)
      onImagesChange?.(next)
    },
    [onImagesChange]
  )

  // ── Client-side file validation ───────────────────────────────

  function validateFiles(files: File[]): string | null {
    for (const file of files) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        return `"${file.name}" geçersiz dosya türü. Yalnızca JPEG, PNG ve WebP kabul edilir.`
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        return `"${file.name}" çok büyük. Maksimum ${MAX_IMAGE_SIZE_MB} MB olmalıdır.`
      }
    }
    return null
  }

  // ── Upload handler ────────────────────────────────────────────

  async function handleFiles(files: File[]) {
    setError(null)

    const remaining = MAX_IMAGES_PER_LISTING - images.length
    if (files.length > remaining) {
      setError(`Yalnızca ${remaining} görsel daha ekleyebilirsiniz (maksimum ${MAX_IMAGES_PER_LISTING}).`)
      return
    }

    const validationError = validateFiles(files)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    let current = images
    for (const file of files) {
      const result = await uploadListingImage(listingId, file)
      if (!result.success) {
        setError(result.error)
        break
      }
      current = [...current, result.data]
      updateImages(current)
    }
    setUploading(false)
  }

  // ── Drop zone handlers ────────────────────────────────────────

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFiles(files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  // ── Image actions ─────────────────────────────────────────────

  async function handleDelete(imageId: string) {
    setError(null)
    const result = await deleteListingImage(imageId)
    if (!result.success) {
      setError(result.error)
      return
    }
    const next = images.filter((img) => img.id !== imageId)
    // If the deleted image was cover and there are remaining images, promote the first
    const deletedWasCover = images.find((img) => img.id === imageId)?.is_cover
    if (deletedWasCover && next.length > 0) {
      next[0] = { ...next[0], is_cover: true }
    }
    updateImages(next)
  }

  async function handleSetCover(imageId: string) {
    setError(null)
    const result = await setCoverImage(imageId)
    if (!result.success) {
      setError(result.error)
      return
    }
    updateImages(images.map((img) => ({ ...img, is_cover: img.id === imageId })))
  }

  // ── Drag-to-reorder handlers ──────────────────────────────────

  function handleItemDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleItemDragOver(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.preventDefault()
    if (id !== draggingId) setDragOverId(id)
  }

  async function handleItemDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    if (!draggingId || draggingId === targetId) return

    const fromIdx = images.findIndex((img) => img.id === draggingId)
    const toIdx = images.findIndex((img) => img.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const next = [...images]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const reordered = next.map((img, i) => ({ ...img, display_order: i }))

    updateImages(reordered)
    await reorderImages(listingId, reordered.map((img) => img.id))
    setDraggingId(null)
  }

  function handleItemDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  const atLimit = images.length >= MAX_IMAGES_PER_LISTING

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">Fotoğraflar</h3>
        <span className="text-xs text-zinc-400">
          {images.length} / {MAX_IMAGES_PER_LISTING} fotoğraf
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Drop zone */}
      {!atLimit && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50/50'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs">Yükleniyor…</span>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-zinc-400" />
              <p className="text-sm text-zinc-500 text-center">
                Görsel sürükleyin veya{' '}
                <span className="text-blue-600 font-medium">seçin</span>
              </p>
              <p className="text-xs text-zinc-400">
                JPEG, PNG, WebP · Maks. {MAX_IMAGE_SIZE_MB} MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length > 0) handleFiles(files)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleItemDragStart(e, image.id)}
              onDragOver={(e) => handleItemDragOver(e, image.id)}
              onDrop={(e) => handleItemDrop(e, image.id)}
              onDragEnd={handleItemDragEnd}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2 transition-all',
                image.is_cover ? 'border-blue-500' : 'border-transparent',
                draggingId === image.id ? 'opacity-40' : 'opacity-100',
                dragOverId === image.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
              )}
            >
              {/* Image */}
              <div className="aspect-square relative bg-zinc-100">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>

              {/* Cover badge */}
              {image.is_cover && (
                <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Kapak
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab bg-black/50 rounded p-0.5">
                <GripVertical className="h-3.5 w-3.5 text-white" />
              </div>

              {/* Action buttons overlay */}
              <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {!image.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(image.id)}
                    title="Kapak yap"
                    className="flex-1 flex items-center justify-center gap-1 rounded bg-white/20 hover:bg-white/30 py-1 text-white transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">Kapak</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  title="Sil"
                  className="flex items-center justify-center rounded bg-red-500/70 hover:bg-red-600/90 p-1 text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <p className="text-center text-xs text-zinc-400 py-2">
          Henüz fotoğraf eklenmedi
        </p>
      )}
    </div>
  )
}