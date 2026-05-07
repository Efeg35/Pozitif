// app/robots.ts
// Next.js 14 App Router robots.txt generator.
// Allows all crawlers on public pages; disallows /admin and /login.

import { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/login'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}