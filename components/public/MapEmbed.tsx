// components/public/MapEmbed.tsx
// OpenStreetMap iframe embed — no API key needed, SSR-safe.
// Priority: lat/lng iframe > address "Haritada Aç" placeholder > "yakında eklenecek" placeholder

interface MapEmbedProps {
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  className?: string
}

export default function MapEmbed({
  latitude,
  longitude,
  address,
  className = 'w-full h-64 rounded-lg border border-gray-200',
}: MapEmbedProps) {
  // Prefer precise lat/lng embed
  if (latitude != null && longitude != null) {
    const bbox = 0.005
    const left = longitude - bbox
    const right = longitude + bbox
    const top = latitude + bbox
    const bottom = latitude - bbox
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${latitude},${longitude}`

    return (
      <div className={className}>
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 'inherit' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={address ?? 'Konum haritası'}
        />
      </div>
    )
  }

  // Address available but no coordinates — show polished placeholder + "Haritada Aç" link
  if (address) {
    const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
    return (
      <div
        className={`${className} flex flex-col items-center justify-center gap-3 bg-zinc-50`}
        style={{ minHeight: 80 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-zinc-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p className="text-xs text-zinc-500 text-center px-4 line-clamp-2">{address}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Haritada Aç
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    )
  }

  // No location data at all — render a neutral placeholder
  return (
    <div
      className={`${className} flex items-center justify-center bg-zinc-50`}
      style={{ minHeight: 80 }}
    >
      <p className="text-xs text-zinc-400">Konum bilgisi yakında eklenecek.</p>
    </div>
  )
}