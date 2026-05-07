# Deployment Checklist — Pozitif Gayrimenkul

## Pre-Deployment

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `NEXT_PUBLIC_SITE_URL` — Production domain, e.g. `https://pozitifgayrimenkul.com` (no trailing slash)

### Supabase
- [ ] Run all migrations in order: `001_initial_schema.sql`, `002_public_filter_indexes.sql`
- [ ] Confirm RLS policies are active:
  - `office_settings`: anon can SELECT, authenticated (is_admin) can INSERT/UPDATE/DELETE
  - `listings`: anon can SELECT aktif listings, authenticated agents can INSERT/UPDATE/DELETE
  - `inquiries`: anon can INSERT, authenticated can SELECT/UPDATE
  - `agents`: authenticated can SELECT own row
- [ ] Create at least one admin agent in `agents` table with `is_admin = true`
- [ ] Seed `office_settings` row via `/admin/ayarlar` (at minimum set `office_name`)
- [ ] Confirm `listings` has `latitude` and `longitude` columns (from 001_initial_schema.sql)
- [ ] Confirm `inquiries` has `source` column (text, nullable) — add if missing:
  ```sql
  ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source text;
  ```

### Supabase Storage
- [ ] Create a public bucket named `listing-images`
- [ ] Set bucket to public read

### Next.js / Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL in Vercel environment variables
- [ ] `next.config.mjs` `images.remotePatterns` includes your Supabase storage domain

## Build Verification
- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — successful production build
- [ ] `npm run start` — smoke test locally

## SEO Checklist
- [ ] `/sitemap.xml` returns correct URLs after deploy
- [ ] `/robots.txt` blocks `/admin` and `/login`
- [ ] Home page has Organization JSON-LD in page source
- [ ] Listing detail pages have RealEstateListing JSON-LD
- [ ] All public pages have `<title>` and `<meta name="description">`
- [ ] Listing detail pages have canonical URL set

## WhatsApp Integration
- [ ] Office settings: enter WhatsApp number in `/admin/ayarlar`
- [ ] Verify WhatsApp button appears on listing detail pages
- [ ] Verify WhatsApp button appears on `/iletisim`
- [ ] Verify WhatsApp button appears on customer detail pages in admin CRM

## Maps
- [ ] OpenStreetMap iframe loads on `/iletisim` when office address is set
- [ ] OpenStreetMap iframe loads on listing detail pages when lat/lng or address set
- [ ] No API key needed — uses free OSM embed

## Admin
- [ ] `/admin/ayarlar` accessible only to `is_admin = true` agents
- [ ] Office settings save/load correctly
- [ ] CRM: customers, appointments, inquiries all functional

## Post-Deployment
- [ ] Submit sitemap to Google Search Console: `https://yourdomain.com/sitemap.xml`
- [ ] Verify structured data with Google Rich Results Test
- [ ] Test contact form submissions end-to-end
- [ ] Test WhatsApp links on mobile device