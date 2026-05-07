// app/sitemap.ts
// Next.js 14 App Router sitemap generator.
// Includes static pages + all active listings.

import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const supabase = await createClient()

  // Fetch active listing IDs + slugs for dynamic URLs
  const { data: listings } = await supabase
    .from('listings')
    .select('id, slug, updated_at')
    .eq('status', 'aktif')
    .order('updated_at', { ascending: false })

  const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${siteUrl}/ilanlar/${l.id}/${l.slug ?? l.id}`,
    lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/ilanlar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...listingUrls,
  ]
}