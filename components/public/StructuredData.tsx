// components/public/StructuredData.tsx
// JSON-LD structured data component for SEO.
// Renders a <script type="application/ld+json"> tag in the <head> or inline.
// Usage: <StructuredData data={jsonLdObject} />

interface StructuredDataProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ─── Helper builders ──────────────────────────────────────────────────────────

/** JSON-LD for a RealEstateListing / Product page */
export function buildListingJsonLd(params: {
  title: string
  description: string
  url: string
  imageUrl?: string | null
  price?: number | null
  currency?: string
  address?: string | null
  city?: string | null
  district?: string | null
  offerType?: 'satılık' | 'kiralık'
}): Record<string, unknown> {
  const {
    title,
    description,
    url,
    imageUrl,
    price,
    currency = 'TRY',
    address,
    city,
    district,
    offerType,
  } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description,
    url,
  }

  if (imageUrl) ld.image = imageUrl
  if (price) {
    ld.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      ...(offerType ? { description: offerType } : {}),
    }
  }

  if (address || city || district) {
    ld.address = {
      '@type': 'PostalAddress',
      ...(address ? { streetAddress: address } : {}),
      ...(district ? { addressLocality: district } : {}),
      ...(city ? { addressRegion: city } : {}),
      addressCountry: 'TR',
    }
  }

  return ld
}

/** JSON-LD for the office/organization (used on home + contact pages) */
export function buildOrganizationJsonLd(params: {
  name: string
  url: string
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  logoUrl?: string | null
  instagram?: string | null
  facebook?: string | null
}): Record<string, unknown> {
  const { name, url, phone, email, address, city, logoUrl, instagram, facebook } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name,
    url,
  }

  if (phone) ld.telephone = phone
  if (email) ld.email = email
  if (logoUrl) ld.logo = logoUrl

  if (address || city) {
    ld.address = {
      '@type': 'PostalAddress',
      ...(address ? { streetAddress: address } : {}),
      ...(city ? { addressRegion: city } : {}),
      addressCountry: 'TR',
    }
  }

  const sameAs: string[] = []
  if (instagram) sameAs.push(instagram)
  if (facebook) sameAs.push(facebook)
  if (sameAs.length) ld.sameAs = sameAs

  return ld
}