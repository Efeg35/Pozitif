-- ============================================================
-- 001_initial_schema.sql
-- Production-ready initial schema for the real estate office app
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
-- Safety: ensure extensions schema exists for local Postgres environments.
-- Supabase cloud already has this schema, so this is a no-op there.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- TABLE: agents
-- Extends auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL CHECK (length(trim(full_name)) > 0),
  phone       text,
  title       text,
  avatar_url  text,
  is_admin    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: listings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title           text NOT NULL CHECK (length(trim(title)) > 0),
  slug            text UNIQUE NOT NULL CHECK (
                    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
                  ),
  description     text,

  price           numeric NOT NULL CHECK (price > 0),
  currency        text NOT NULL DEFAULT 'TRY'
                    CHECK (currency IN ('TRY', 'USD', 'EUR')),

  listing_type    text NOT NULL
                    CHECK (listing_type IN ('satilik', 'kiralik')),

  property_type   text NOT NULL
                    CHECK (property_type IN ('daire', 'villa', 'arsa', 'dukkan', 'ofis')),

  status          text NOT NULL DEFAULT 'taslak'
                    CHECK (status IN ('taslak', 'aktif', 'satildi', 'kiralandi', 'pasif')),

  rooms           integer CHECK (rooms IS NULL OR rooms >= 0),
  bathrooms       integer CHECK (bathrooms IS NULL OR bathrooms >= 0),
  living_rooms    integer CHECK (living_rooms IS NULL OR living_rooms >= 0),

  area_m2         numeric CHECK (area_m2 IS NULL OR area_m2 > 0),

  floor           integer,
  total_floors    integer CHECK (total_floors IS NULL OR total_floors >= 0),
  building_age    integer CHECK (building_age IS NULL OR building_age >= 0),

  heating_type    text,

  is_furnished    boolean NOT NULL DEFAULT false,
  has_balcony     boolean NOT NULL DEFAULT false,
  has_elevator    boolean NOT NULL DEFAULT false,
  has_parking     boolean NOT NULL DEFAULT false,
  is_in_complex   boolean NOT NULL DEFAULT false,

  dues            numeric NOT NULL DEFAULT 0 CHECK (dues >= 0),
  deposit         numeric NOT NULL DEFAULT 0 CHECK (deposit >= 0),

  address         text,
  district        text,
  city            text NOT NULL DEFAULT 'İzmir',

  latitude        numeric CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude       numeric CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

  is_featured     boolean NOT NULL DEFAULT false,

  agent_id        uuid REFERENCES public.agents(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: listing_images
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  listing_id     uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  url            text NOT NULL CHECK (length(trim(url)) > 0),
  storage_path   text NOT NULL CHECK (length(trim(storage_path)) > 0),

  display_order  integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_cover       boolean NOT NULL DEFAULT false,

  -- NOTE: Cover image changes MUST be done in a single transaction / RPC:
  --   1. Set is_cover = false for all images of the same listing_id.
  --   2. Set is_cover = true for the chosen image.
  -- Doing it in two separate UPDATE calls will violate the unique partial index.

  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTION: storage_object_listing_id
-- MUST be declared BEFORE the CHECK constraint below.
-- PostgreSQL resolves function references at constraint-definition
-- time — forward-references in CHECK constraints do NOT work.
-- Extract listing_id UUID from storage object path.
-- Expected format: {listing_id}/{timestamp}-{filename}
-- Returns NULL if the first segment is not a valid UUID.
-- ============================================================
CREATE OR REPLACE FUNCTION public.storage_object_listing_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  first_segment text;
BEGIN
  first_segment := split_part(object_name, '/', 1);

  IF first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN first_segment::uuid;
  END IF;

  RETURN NULL;
END;
$$;

-- Enforce that storage_path is actually inside the folder of the owning listing.
-- NULL guard: if storage_object_listing_id() returns NULL the path format is
-- invalid — the row must be rejected, not silently accepted.
-- We use DROP/ADD so this migration is safe to re-run.
ALTER TABLE public.listing_images
  DROP CONSTRAINT IF EXISTS listing_images_storage_path_matches_listing;

ALTER TABLE public.listing_images
  ADD CONSTRAINT listing_images_storage_path_matches_listing
  CHECK (
    public.storage_object_listing_id(storage_path) IS NOT NULL
    AND public.storage_object_listing_id(storage_path) = listing_id
  );

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name                text NOT NULL CHECK (length(trim(full_name)) > 0),
  phone                    text,
  email                    text,
  notes                    text,

  interest_type            text CHECK (
                             interest_type IS NULL
                             OR interest_type IN ('satilik', 'kiralik', 'her_ikisi')
                           ),

  budget_min               numeric CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max               numeric CHECK (budget_max IS NULL OR budget_max >= 0),

  preferred_districts      text[],
  preferred_property_types text[],

  status                   text NOT NULL DEFAULT 'aktif'
                             CHECK (status IN ('aktif', 'pasif')),

  agent_id                 uuid REFERENCES public.agents(id) ON DELETE SET NULL,

  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customers_budget_range_check CHECK (
    budget_min IS NULL
    OR budget_max IS NULL
    OR budget_min <= budget_max
  )
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  listing_id        uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  customer_id       uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id          uuid REFERENCES public.agents(id) ON DELETE SET NULL,

  appointment_date  timestamptz NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 60
                      CHECK (duration_minutes > 0 AND duration_minutes <= 1440),

  status            text NOT NULL DEFAULT 'bekliyor'
                      CHECK (status IN ('bekliyor', 'tamamlandi', 'iptal')),

  notes             text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: inquiries
-- Public visitor inquiries
-- NOTE:
-- Authenticated agents intentionally see all inquiries.
-- This keeps the office-wide shared inbox model.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  listing_id  uuid REFERENCES public.listings(id) ON DELETE SET NULL,

  name        text NOT NULL CHECK (length(trim(name)) > 0),
  phone       text,
  email       text,
  message     text,

  honeypot    text,

  status      text NOT NULL DEFAULT 'yeni'
                CHECK (status IN ('yeni', 'incelendi', 'yanitlandi')),

  source      text NOT NULL DEFAULT 'website',

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: office_settings
-- Singleton table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.office_settings (
  id             uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,

  office_name    text,
  phone          text,
  whatsapp       text,
  email          text,
  address        text,
  city           text DEFAULT 'İzmir',
  district       text,

  logo_url       text,
  instagram_url  text,
  facebook_url   text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT office_settings_singleton_check CHECK (
    id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

INSERT INTO public.office_settings (id, city)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'İzmir')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- Must be created after agents table exists.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT agents.is_admin
      FROM public.agents
      WHERE agents.id = auth.uid()
    ),
    false
  );
$$;

-- ============================================================
-- HELPER FUNCTION: update updated_at column automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS office_settings_updated_at ON public.office_settings;
CREATE TRIGGER office_settings_updated_at
  BEFORE UPDATE ON public.office_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TRIGGER FUNCTION: auto-create agent row on auth.users insert
-- First user ever becomes admin.
-- Advisory lock prevents race condition during first signup.
--
-- SECURITY WARNING — PUBLIC SIGNUP MUST BE DISABLED:
-- This trigger makes the very first registered user an admin.
-- If Supabase Auth "Enable Sign Ups" is left ON, anyone (bot, random
-- visitor, wrong email) can register before you and become the admin.
--
-- ACTION REQUIRED before going live:
--   1. Supabase Dashboard → Authentication → Providers → Email
--      → Disable "Enable Sign Ups" (set to OFF).
--   2. Create the first admin account manually:
--      Dashboard → Authentication → Users → "Invite user"
--      OR via a one-time server script using service_role.
--   3. After the first admin exists, new agents are added only through
--      the admin panel (invite flow), never via a public register page.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_be_admin boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(914829173);

  SELECT NOT EXISTS (
    SELECT 1 FROM public.agents
  )
  INTO should_be_admin;

  INSERT INTO public.agents (
    id,
    full_name,
    phone,
    is_admin
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NEW.email,
      'Ajan'
    ),
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''),
    should_be_admin
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PUBLIC VIEW: public_agents
-- Exposes only safe public fields.
-- Do not expose agents table directly to anon users.
-- ============================================================
CREATE OR REPLACE VIEW public.public_agents
WITH (security_barrier = true)
AS
SELECT
  id,
  full_name,
  title,
  avatar_url
FROM public.agents;

GRANT SELECT ON public.public_agents TO anon, authenticated;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- DECISION: public = true
-- Listing images are inherently public content (shown on the website).
-- This simplifies URL generation — no signed URLs needed for display.
--
-- TRADE-OFF: If a listing is set to 'pasif' or 'taslak', the DB-level
-- RLS policy (listing_images_public_select_active / storage_listing_images_public_select)
-- will block the image rows from being returned via the API.
-- However, if the raw storage URL is already known/cached by a browser or
-- third party, the file remains directly accessible at that URL because
-- Supabase bypasses RLS for public buckets on direct GET requests.
--
-- For MVP / real estate context: acceptable. Listing images are not sensitive.
-- If you require strict "pasif ilan = no image access", set public = false
-- and serve images via signed URLs or a Next.js /api/images/[...path] proxy route.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES
-- Makes this migration safer to re-run during development.
-- ============================================================

-- agents
DROP POLICY IF EXISTS "agents_anon_select" ON public.agents;
DROP POLICY IF EXISTS "agents_self_select" ON public.agents;
DROP POLICY IF EXISTS "agents_self_update" ON public.agents;
DROP POLICY IF EXISTS "agents_admin_all" ON public.agents;
DROP POLICY IF EXISTS "agents_admin_select" ON public.agents;
DROP POLICY IF EXISTS "agents_admin_insert" ON public.agents;
DROP POLICY IF EXISTS "agents_admin_update" ON public.agents;
-- NOTE: agents_admin_delete intentionally not dropped/created.
-- Agent deletion must go through service_role (server action only).

-- listings
DROP POLICY IF EXISTS "listings_anon_select" ON public.listings;
DROP POLICY IF EXISTS "listings_public_select_active" ON public.listings;
DROP POLICY IF EXISTS "listings_agent_select_own" ON public.listings;
DROP POLICY IF EXISTS "listings_agent_insert" ON public.listings;
DROP POLICY IF EXISTS "listings_agent_update" ON public.listings;
DROP POLICY IF EXISTS "listings_agent_delete" ON public.listings;
DROP POLICY IF EXISTS "listings_admin_all" ON public.listings;

-- listing_images
DROP POLICY IF EXISTS "listing_images_anon_select" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_public_select_active" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_agent_select" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_agent_insert" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_agent_update" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_agent_delete" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_admin_all" ON public.listing_images;

-- customers
DROP POLICY IF EXISTS "customers_agent_select" ON public.customers;
DROP POLICY IF EXISTS "customers_agent_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_agent_update" ON public.customers;
DROP POLICY IF EXISTS "customers_agent_delete" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;

-- appointments
DROP POLICY IF EXISTS "appointments_agent_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_agent_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_agent_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_agent_delete" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_all" ON public.appointments;

-- inquiries
DROP POLICY IF EXISTS "inquiries_anon_insert" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_public_insert" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_authenticated_select" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_authenticated_update" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_admin_all" ON public.inquiries;

-- office_settings
DROP POLICY IF EXISTS "office_settings_anon_select" ON public.office_settings;
DROP POLICY IF EXISTS "office_settings_public_select" ON public.office_settings;
DROP POLICY IF EXISTS "office_settings_admin_all" ON public.office_settings;

-- storage.objects
DROP POLICY IF EXISTS "storage_listing_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_listing_images_agent_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_listing_images_agent_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_listing_images_agent_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_listing_images_agent_delete" ON storage.objects;

-- ============================================================
-- RLS POLICIES: agents
-- ============================================================

-- Authenticated agents can read their own profile.
CREATE POLICY "agents_self_select"
  ON public.agents
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Non-admin agents can update their own profile,
-- but cannot promote themselves to admin.
CREATE POLICY "agents_self_update"
  ON public.agents
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin = false
  );

-- Admins can read all agent profiles (e.g., to list team members).
CREATE POLICY "agents_admin_select"
  ON public.agents
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can insert new agent rows (e.g., when inviting a new user).
CREATE POLICY "agents_admin_insert"
  ON public.agents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can update any agent profile (e.g., to toggle is_admin).
CREATE POLICY "agents_admin_update"
  ON public.agents
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INTENTIONALLY NO agents_admin_delete policy.
-- Deleting an agent row removes their access permanently and can corrupt
-- admin sessions if the admin deletes themselves. All agent/user deletions
-- must be performed via a dedicated server action using service_role,
-- which bypasses RLS and handles cleanup atomically.

-- ============================================================
-- RLS POLICIES: listings
-- ============================================================

-- Public visitors and logged-in users can view active listings.
CREATE POLICY "listings_public_select_active"
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'aktif');

-- Agents can view all statuses of their own listings.
CREATE POLICY "listings_agent_select_own"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Agents can create only their own listings.
CREATE POLICY "listings_agent_insert"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Agents can update only their own listings.
CREATE POLICY "listings_agent_update"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Agents can delete only their own listings.
CREATE POLICY "listings_agent_delete"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

-- Admins have full access.
CREATE POLICY "listings_admin_all"
  ON public.listings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: listing_images
-- ============================================================

-- Public can only read images belonging to active listings.
CREATE POLICY "listing_images_public_select_active"
  ON public.listing_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.status = 'aktif'
    )
  );

-- Agents can read images of their own listings.
CREATE POLICY "listing_images_agent_select"
  ON public.listing_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.agent_id = auth.uid()
    )
  );

-- Agents can insert images only for their own listings.
CREATE POLICY "listing_images_agent_insert"
  ON public.listing_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.agent_id = auth.uid()
    )
  );

-- Agents can update images only for their own listings.
CREATE POLICY "listing_images_agent_update"
  ON public.listing_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.agent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.agent_id = auth.uid()
    )
  );

-- Agents can delete images only for their own listings.
CREATE POLICY "listing_images_agent_delete"
  ON public.listing_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND listings.agent_id = auth.uid()
    )
  );

-- Admins have full access.
CREATE POLICY "listing_images_admin_all"
  ON public.listing_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: customers
-- ============================================================

CREATE POLICY "customers_agent_select"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "customers_agent_insert"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "customers_agent_update"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "customers_agent_delete"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "customers_admin_all"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: appointments
-- ============================================================

CREATE POLICY "appointments_agent_select"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "appointments_agent_insert"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "appointments_agent_update"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "appointments_agent_delete"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "appointments_admin_all"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: inquiries
-- ============================================================

-- Public visitors can insert inquiries.
-- Honeypot must be empty.
CREATE POLICY "inquiries_public_insert"
  ON public.inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    honeypot IS NULL
    OR honeypot = ''
  );

-- INTENTIONALLY LEFT AS SHARED OFFICE INBOX:
-- All authenticated agents can read all inquiries.
CREATE POLICY "inquiries_authenticated_select"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (true);

-- INTENTIONALLY LEFT AS SHARED OFFICE INBOX:
-- All authenticated agents can update all inquiries.
CREATE POLICY "inquiries_authenticated_update"
  ON public.inquiries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins have full access, including delete.
CREATE POLICY "inquiries_admin_all"
  ON public.inquiries
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: office_settings
-- ============================================================

CREATE POLICY "office_settings_public_select"
  ON public.office_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "office_settings_admin_all"
  ON public.office_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- STORAGE POLICIES: storage.objects
-- Bucket: listing-images
-- ============================================================

-- Public can read storage objects only if there is a DB image row
-- connected to an active listing.
CREATE POLICY "storage_listing_images_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'listing-images'
    AND EXISTS (
      SELECT 1
      FROM public.listing_images
      JOIN public.listings
        ON listings.id = listing_images.listing_id
      WHERE listing_images.storage_path = storage.objects.name
        AND listings.status = 'aktif'
    )
  );

-- Agents can read storage objects belonging to their own listings.
CREATE POLICY "storage_listing_images_agent_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = public.storage_object_listing_id(storage.objects.name)
          AND listings.agent_id = auth.uid()
      )
    )
  );

-- Agents can upload files only into folders matching their own listing IDs.
CREATE POLICY "storage_listing_images_agent_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = public.storage_object_listing_id(storage.objects.name)
          AND listings.agent_id = auth.uid()
      )
    )
  );

-- Agents can update files only in their own listing folders.
CREATE POLICY "storage_listing_images_agent_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = public.storage_object_listing_id(storage.objects.name)
          AND listings.agent_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = public.storage_object_listing_id(storage.objects.name)
          AND listings.agent_id = auth.uid()
      )
    )
  );

-- Agents can delete files only from their own listing folders.
CREATE POLICY "storage_listing_images_agent_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = public.storage_object_listing_id(storage.objects.name)
          AND listings.agent_id = auth.uid()
      )
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

-- listings
CREATE INDEX IF NOT EXISTS listings_status_idx
  ON public.listings(status);

CREATE INDEX IF NOT EXISTS listings_city_district_idx
  ON public.listings(city, district);

CREATE INDEX IF NOT EXISTS listings_listing_type_idx
  ON public.listings(listing_type);

CREATE INDEX IF NOT EXISTS listings_property_type_idx
  ON public.listings(property_type);

CREATE INDEX IF NOT EXISTS listings_price_idx
  ON public.listings(price);

CREATE INDEX IF NOT EXISTS listings_agent_id_idx
  ON public.listings(agent_id);

CREATE INDEX IF NOT EXISTS listings_created_at_idx
  ON public.listings(created_at DESC);

CREATE INDEX IF NOT EXISTS listings_featured_idx
  ON public.listings(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS listings_public_filter_idx
  ON public.listings(city, district, listing_type, property_type, price)
  WHERE status = 'aktif';

CREATE INDEX IF NOT EXISTS listings_slug_idx
  ON public.listings(slug);

-- listing_images
CREATE INDEX IF NOT EXISTS listing_images_listing_id_idx
  ON public.listing_images(listing_id);

CREATE INDEX IF NOT EXISTS listing_images_cover_idx
  ON public.listing_images(listing_id, is_cover);

CREATE INDEX IF NOT EXISTS listing_images_display_order_idx
  ON public.listing_images(listing_id, display_order);

CREATE UNIQUE INDEX IF NOT EXISTS listing_images_one_cover_per_listing_idx
  ON public.listing_images(listing_id)
  WHERE is_cover = true;

-- customers
CREATE INDEX IF NOT EXISTS customers_agent_id_idx
  ON public.customers(agent_id);

CREATE INDEX IF NOT EXISTS customers_status_idx
  ON public.customers(status);

CREATE INDEX IF NOT EXISTS customers_preferred_districts_gin_idx
  ON public.customers
  USING gin(preferred_districts);

CREATE INDEX IF NOT EXISTS customers_preferred_property_types_gin_idx
  ON public.customers
  USING gin(preferred_property_types);

-- appointments
CREATE INDEX IF NOT EXISTS appointments_agent_date_idx
  ON public.appointments(agent_id, appointment_date);

CREATE INDEX IF NOT EXISTS appointments_customer_id_idx
  ON public.appointments(customer_id);

CREATE INDEX IF NOT EXISTS appointments_listing_id_idx
  ON public.appointments(listing_id);

CREATE INDEX IF NOT EXISTS appointments_status_idx
  ON public.appointments(status);

-- inquiries
CREATE INDEX IF NOT EXISTS inquiries_status_idx
  ON public.inquiries(status);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
  ON public.inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS inquiries_listing_id_idx
  ON public.inquiries(listing_id);

-- agents
CREATE INDEX IF NOT EXISTS agents_is_admin_idx
  ON public.agents(is_admin)
  WHERE is_admin = true;

-- ============================================================
-- END OF INITIAL SCHEMA
-- ============================================================