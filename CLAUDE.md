# CLAUDE.md — Real Estate Office Web Application

> This file provides full project context to Claude Code. Read it entirely before making any changes.

---

## Project Overview

A modern real estate office web application built for a Turkish real estate agency. The platform serves two audiences:

- **Public visitors** — browse listings, filter by criteria, view details, submit inquiries
- **Office staff (agents/admins)** — manage listings, track customers, schedule appointments, handle inquiries (CRM)

The UI is in **Turkish**. Code, variables, comments, and this file are in **English**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| File Storage | Supabase Storage |
| Styling | Tailwind CSS + shadcn/ui |
| Form handling | React Hook Form + Zod |
| Deployment | Vercel |
| Language | TypeScript (strict mode, never use `any`) |

---

## Project Structure

```
/app
  /(public)/                    # Public-facing pages (no auth required)
    layout.tsx                  # Public layout (navbar, footer)
    page.tsx                    # Home page — featured listings
    /ilanlar/
      page.tsx                  # All listings with filters
      [id]/[slug]/page.tsx      # Single listing detail page (SEO-friendly URL)
    /iletisim/page.tsx          # Contact page

  /(admin)/                     # Admin panel (auth required)
    layout.tsx                  # Admin layout (sidebar, topbar)
    /admin/
      page.tsx                  # Dashboard — stats overview
      /ilanlar/
        page.tsx                # Listings list + management
        /yeni/page.tsx          # Create new listing
        [id]/page.tsx           # Edit listing
      /musteriler/
        page.tsx                # Customer list
        /yeni/page.tsx          # Add customer
        [id]/page.tsx           # Customer detail + history
      /randevular/
        page.tsx                # Appointment calendar + list
        /yeni/page.tsx          # Schedule appointment
      /talepler/page.tsx        # Visitor inquiries inbox
      /ayarlar/page.tsx         # Office settings (is_admin only)

  /login/page.tsx               # Agent login page

/components
  /ui/                          # shadcn/ui primitives (DO NOT edit manually)
  /public/                      # Public site components
    ListingCard.tsx
    ListingGrid.tsx
    FilterBar.tsx
    ListingGallery.tsx
    InquiryForm.tsx
    MapView.tsx
  /admin/                       # Admin panel components
    Sidebar.tsx
    TopBar.tsx
    ListingForm.tsx
    ImageUploader.tsx
    CustomerForm.tsx
    AppointmentForm.tsx
    StatsCard.tsx
    DataTable.tsx

/lib
  /supabase/
    client.ts                   # Browser-side Supabase client
    server.ts                   # Server-side Supabase client (for Server Components)
  /schemas/
    listing.schema.ts           # Zod schema for listing forms
    customer.schema.ts
    appointment.schema.ts
    inquiry.schema.ts
  types.ts                      # All database types
  utils.ts                      # Shared helper functions
  constants.ts                  # App-wide constants (cities, districts, enums, labels)

/middleware.ts                  # Route protection for /admin/*
```

---

## Database Schema

### `agents` (extends Supabase auth.users)
```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id)
full_name       text NOT NULL
phone           text
title           text              -- e.g. "Satış Danışmanı"
avatar_url      text
is_admin        boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

### `listings`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
title           text NOT NULL
slug            text UNIQUE NOT NULL   -- e.g. "izmir-karsiyaka-3-1-satilik-daire"
description     text
price           numeric NOT NULL CHECK (price > 0)
currency        text DEFAULT 'TRY'   -- TRY | USD | EUR
listing_type    text NOT NULL        -- satilik | kiralik
property_type   text NOT NULL        -- daire | villa | arsa | dukkan | ofis
status          text DEFAULT 'taslak' -- taslak | aktif | satildi | kiralandi | pasif
rooms           integer
bathrooms       integer
living_rooms    integer
area_m2         numeric
floor           integer
total_floors    integer
building_age    integer
heating_type    text
is_furnished    boolean DEFAULT false
has_balcony     boolean DEFAULT false
has_elevator    boolean DEFAULT false
has_parking     boolean DEFAULT false
is_in_complex   boolean DEFAULT false
dues            numeric DEFAULT 0
deposit         numeric DEFAULT 0
address         text
district        text
city            text DEFAULT 'İzmir'
latitude        numeric
longitude       numeric
is_featured     boolean DEFAULT false
agent_id        uuid REFERENCES agents(id)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `listing_images`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE
url             text NOT NULL
storage_path    text NOT NULL        -- required for deletion from Supabase Storage
display_order   integer DEFAULT 0
is_cover        boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

### `customers`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
full_name       text NOT NULL
phone           text
email           text
notes           text
interest_type   text                 -- satilik | kiralik | her_ikisi
budget_min      numeric
budget_max      numeric
preferred_districts  text[]
preferred_property_types  text[]
status          text DEFAULT 'aktif' -- aktif | pasif
agent_id        uuid REFERENCES agents(id)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `appointments`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
listing_id      uuid REFERENCES listings(id) ON DELETE SET NULL
customer_id     uuid REFERENCES customers(id) ON DELETE CASCADE
agent_id        uuid REFERENCES agents(id)
appointment_date  timestamptz NOT NULL
duration_minutes  integer DEFAULT 60
status          text DEFAULT 'bekliyor'  -- bekliyor | tamamlandi | iptal
notes           text
created_at      timestamptz DEFAULT now()
```

### `inquiries`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
listing_id      uuid REFERENCES listings(id) ON DELETE SET NULL
name            text NOT NULL
phone           text
email           text
message         text
honeypot        text                 -- must always be empty; non-empty = spam, reject silently
status          text DEFAULT 'yeni'  -- yeni | incelendi | yanitlandi
created_at      timestamptz DEFAULT now()
```

### `office_settings`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
office_name     text
phone           text
whatsapp        text
email           text
address         text
city            text
district        text
logo_url        text
instagram_url   text
facebook_url    text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

---

## Row Level Security (RLS) Rules

| Table | Public (anon) | Agent (own rows) | Admin |
|---|---|---|---|
| listings | SELECT where status = 'aktif' | Full CRUD where agent_id = auth.uid() | Full CRUD |
| listing_images | SELECT | Full CRUD on own listings | Full CRUD |
| customers | — | Full CRUD where agent_id = auth.uid() | Full CRUD |
| appointments | — | Full CRUD where agent_id = auth.uid() | Full CRUD |
| inquiries | INSERT only (honeypot must be empty) | SELECT, UPDATE | Full CRUD |
| agents | SELECT (name, title, avatar only) | UPDATE own row | Full CRUD |
| office_settings | SELECT | SELECT | Full CRUD |

**Ownership rule:** Agents can only modify their own listings and customers.
RLS policy condition: `agent_id = auth.uid()`
Admin bypass: separate permissive policy where `(SELECT is_admin FROM agents WHERE id = auth.uid()) = true`

---

## Auth & Agent Creation Flow

1. Agent signs up or is added via Supabase Auth (email + password)
2. A **PostgreSQL trigger** fires on `INSERT INTO auth.users`:
   - Inserts a row into `public.agents` using the new user's `id`
   - If no other agents exist yet → sets `is_admin = true` automatically
3. Login page: `/login` — on success, redirect to `/admin`
4. All `/admin/*` routes protected by `middleware.ts` using `@supabase/ssr`
5. `/admin/ayarlar` additionally checks `is_admin = true` server-side at the page level

---

## Listing Status Flow

```
taslak → aktif → satildi
                → kiralandi
       → pasif  (temporarily unlisted, can return to aktif)
```

- New listings start as `taslak` — not visible to the public
- Agent manually promotes to `aktif` when ready
- `satildi` and `kiralandi` remain visible on public site with a status badge

---

## Image Upload Rules

```
MAX_IMAGE_SIZE: 5 MB
ALLOWED_TYPES: image/jpeg, image/png, image/webp
MAX_PER_LISTING: 20
```

**Flow:**
1. Validate file type and size **client-side** for UX feedback
2. Re-validate **server-side** before upload — never trust client alone
3. Sanitize filename: strip special characters, replace spaces with dashes, lowercase
4. Storage path: `listing-images/{listing_id}/{timestamp}-{sanitized-name}`
5. Save both `url` (public URL) and `storage_path` in `listing_images`
6. On delete: remove from Storage first, then delete DB row
7. First image auto-set as `is_cover = true`

---

## Enum Values — ASCII Only

All DB enum values are ASCII-safe. Turkish display labels live in `constants.ts`.

```typescript
// lib/constants.ts

export const LISTING_TYPES        = ['satilik', 'kiralik'] as const
export const PROPERTY_TYPES       = ['daire', 'villa', 'arsa', 'dukkan', 'ofis'] as const
export const LISTING_STATUSES     = ['taslak', 'aktif', 'satildi', 'kiralandi', 'pasif'] as const
export const APPOINTMENT_STATUSES = ['bekliyor', 'tamamlandi', 'iptal'] as const
export const INQUIRY_STATUSES     = ['yeni', 'incelendi', 'yanitlandi'] as const
export const INTEREST_TYPES       = ['satilik', 'kiralik', 'her_ikisi'] as const
export const CURRENCIES           = ['TRY', 'USD', 'EUR'] as const

export const MAX_IMAGES_PER_LISTING = 20
export const MAX_IMAGE_SIZE_MB      = 5
export const ALLOWED_IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp']
export const DEFAULT_CITY           = 'İzmir'

// Turkish display labels — always map from DB value, never hardcode in UI
export const LISTING_TYPE_LABELS: Record<string, string> = {
  satilik:  'Satılık',
  kiralik:  'Kiralık',
}
export const STATUS_LABELS: Record<string, string> = {
  taslak:    'Taslak',
  aktif:     'Aktif',
  satildi:   'Satıldı',
  kiralandi: 'Kiralandı',
  pasif:     'Pasif',
}
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  daire:   'Daire',
  villa:   'Villa',
  arsa:    'Arsa',
  dukkan:  'Dükkan',
  ofis:    'Ofis',
}
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  bekliyor:    'Bekliyor',
  tamamlandi:  'Tamamlandı',
  iptal:       'İptal',
}

// All İzmir districts (official)
export const IZMIR_DISTRICTS = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama',
  'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
  'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar',
  'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz',
  'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş',
  'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla',
]

// Coastal/resort areas — shown as a quick-filter on public site
// Note: Alaçatı is a sub-district of Çeşme but listed separately for UX
export const IZMIR_COASTAL_DISTRICTS = [
  'Çeşme',
  'Alaçatı',
  'Urla',
  'Karaburun',
  'Seferihisar',
  'Foça',
  'Güzelbahçe',
  'Menderes',   // covers Gümüldür coastline
  'Dikili',
  'Selçuk',     // covers Pamucak beach area
]
```

---

## SEO Requirements

Every listing detail page must have dynamic metadata:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const listing = await getListing(params.id)
  return {
    title: `${listing.title} | ${OFFICE_NAME}`,
    description: listing.description?.slice(0, 160),
    openGraph: {
      title: listing.title,
      images: [coverImage.url],
      url: `${SITE_URL}/ilanlar/${listing.id}/${listing.slug}`,
    },
  }
}
```

**Slug generation:** Turkish chars → ASCII equivalent, spaces → dashes, lowercase.
`"İzmir Karşıyaka 3+1 Satılık Daire"` → `"izmir-karsiyaka-3-1-satilik-daire"`
Use a `slugify` utility in `lib/utils.ts`.

---

## Inquiry Spam Protection

- **Honeypot:** Hidden input named `honeypot`. If non-empty on submission → reject silently, return fake success
- **Server-side validation:** Always validate name presence, phone or email required, message max length
- No CAPTCHA in MVP — honeypot is sufficient for initial launch

---

## UI / Design Guidelines

- **Component library**: shadcn/ui — use existing components, never reinvent
- **Icons**: `lucide-react`
- **Color scheme**: Zinc base, deep blue (`blue-700`) as accent
- **Prices**: Always `toLocaleString('tr-TR')` — e.g. `₺2.500.000`
- **Dates**: Always `tr-TR` locale
- **Empty states**: Every list/table must have a proper illustrated empty state
- **Loading states**: Skeleton loaders for page-level content, not spinners
- **Error states**: Every async operation must show a visible, user-friendly error
- **Success states**: Every mutation must confirm success (toast or inline message)

---

## Development Rules for Claude Code

- Before implementing anything, inspect the existing file structure first
- Do not overwrite working files unless explicitly asked
- Use **Server Actions** for all data mutations — not API routes
- Use **Zod** schemas for all validation (in `/lib/schemas/`)
- Use **React Hook Form** with Zod resolver for all forms
- Every mutation must handle errors visibly — no silent failures
- Never use `any` in TypeScript
- Never trust client-side validation alone — always re-validate server-side
- UI labels are Turkish, code/variables/comments are English
- DB enum values are ASCII-safe; Turkish display labels come from `constants.ts`
- All admin pages must verify authentication server-side (not just middleware)
- `/admin/ayarlar` must additionally verify `is_admin = true`
- Use `@supabase/ssr` — do NOT use deprecated `@supabase/auth-helpers-nextjs`
- Use the server Supabase client in Server Components, never the browser client
- Never store images as base64 — always use Supabase Storage
- Always persist `storage_path` alongside `url` in `listing_images`

---

## Common Patterns

### Fetching listings (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data: listings } = await supabase
  .from('listings')
  .select('*, listing_images(*), agents(full_name, title)')
  .eq('status', 'aktif')
  .order('created_at', { ascending: false })
```

### Server Action with Zod validation
```typescript
'use server'
import { listingSchema } from '@/lib/schemas/listing.schema'

export async function createListing(formData: FormData) {
  const parsed = listingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }
  // supabase insert
}
```

### Image upload (server-side)
```typescript
if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Geçersiz dosya türü')
if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) throw new Error('Dosya çok büyük')

const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase()
const storagePath = `${listingId}/${Date.now()}-${safeName}`

await supabase.storage.from('listing-images').upload(storagePath, file)
const { data: { publicUrl } } = supabase.storage
  .from('listing-images').getPublicUrl(storagePath)

// Save both publicUrl and storagePath to listing_images table
```

### Protecting an admin route
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

// For is_admin-only pages:
const { data: agent } = await supabase
  .from('agents').select('is_admin').eq('id', user.id).single()
if (!agent?.is_admin) redirect('/admin')
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Server-side only — never expose to client
NEXT_PUBLIC_SITE_URL=
```

---

## Current Development Status

- [x] Phase 1: Project setup, Supabase schema, auth, admin layout
- [ ] Phase 2: Listing CRUD + image upload
- [ ] Phase 3: Public site (home, listing list, listing detail + SEO)
- [ ] Phase 4: CRM (customers, appointments)
- [ ] Phase 5: Inquiries + WhatsApp integration

**Currently working on: Phase 2**

> Update this checklist as phases are completed.
