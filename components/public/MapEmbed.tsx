// components/public/MapEmbed.tsx
// OpenStreetMap iframe embed — no API key needed, SSR-safe.
// Falls back to address-based search if no lat/lng provided.

interface MapEmbedProps {
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  className?: string
  zoom?: number
}

export default function MapEmbed({
  latitude,
  longitude,
  address,
  className = 'w-full h-64 rounded-lg border border-gray-200',
  zoom = 16,
}: MapEmbedProps) {
  // Prefer precise lat/lng embed
  if (latitude && longitude) {
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

  // Fall back to address search on OSM
  if (address) {
    const query = encodeURIComponent(address)
    const src = `https://www.openstreetmap.org/export/embed.html?query=${query}&layer=mapnik&zoom=${zoom}`

    return (
      <div className={className}>
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 'inherit' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={address}
        />
      </div>
    )
  }

  // No location data — render nothing
  return null
}