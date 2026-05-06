'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Home } from 'lucide-react'
import type { ListingImage } from '@/lib/types'

interface ListingGalleryProps {
  images: Pick<ListingImage, 'id' | 'url' | 'display_order' | 'is_cover'>[]
  title: string
}

export default function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, goNext, goPrev])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-100">
        <Home className="h-16 w-16 text-zinc-300" />
      </div>
    )
  }

  const active = images[activeIndex]

  return (
    <>
      {/* Main image */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-100">
        <div
          className="relative aspect-video cursor-zoom-in w-full"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={active.url}
            alt={`${title} — ${activeIndex + 1}. fotoğraf`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            priority
          />
          {/* Counter */}
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        {/* Arrows on main image */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Önceki fotoğraf"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Sonraki fotoğraf"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                idx === activeIndex
                  ? 'border-blue-600 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <Image
                src={img.url}
                alt={`${title} — küçük resim ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            if (delta > 50) goPrev()
            else if (delta < -50) goNext()
            touchStartX.current = null
          }}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <span className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
            {activeIndex + 1} / {images.length}
          </span>

          {/* Prev arrow */}
          {images.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Önceki"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex].url}
              alt={`${title} — ${activeIndex + 1}. fotoğraf`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Sonraki"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
        </div>
      )}
    </>
  )
}