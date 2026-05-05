-- ============================================================
-- 001_initial_schema.sql
-- Full initial schema for the real estate office application
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(is_admin, false) FROM public.agents WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLE: agents (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  phone        text,
  title        text,
  avatar_url   text,
  is_admin     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: listings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  price           numeric NOT NULL CHECK (price > 0),
  currency        text NOT NULL DEFAULT 'TRY',
  listing_type    text NOT NULL,
  property_type   text NOT NULL,
  status          text NOT NULL DEFAULT 'taslak',
  rooms           integer,
  bathrooms       integer,
  living_rooms    integer,
  area_m2         numeric,
  floor           integer,
  total_floors    integer,
  building_age    integer,
  heating_type    text,
  is_furnished    boolean NOT NULL DEFAULT false,
  has_balcony     boolean NOT NULL DEFAULT false,
  has_elevator    boolean NOT NULL DEFAULT false,
  has_parking     boolean NOT NULL DEFAULT false,
  is_in_complex   boolean NOT NULL DEFAULT false,
  dues            numeric NOT NULL DEFAULT 0,
  deposit         numeric NOT NULL DEFAULT 0,
  address         text,
  district        text,
  city            text NOT NULL DEFAULT 'İzmir',
  latitude        numeric,
  longitude       numeric,
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
  url            text NOT NULL,
  storage_path   text NOT NULL,
  display_order  integer NOT NULL DEFAULT 0,
  is_cover       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name               text NOT NULL,
  phone                   text,
  email                   text,
  notes                   text,
  interest_type           text,
  budget_min              numeric,
  budget_max              numeric,
  preferred_districts     text[],
  preferred_property_types text[],
  status                  text NOT NULL DEFAULT 'aktif',
  agent_id                uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
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
  duration_minutes  integer NOT NULL DEFAULT 60,
  status            text NOT NULL DEFAULT 'bekliyor',
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: inquiries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  name        text NOT NULL,
  phone       text,
  email       text,
  message     text,
  honeypot    text,
  status      text NOT NULL DEFAULT 'yeni',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: office_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.office_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_name    text,
  phone          text,
  whatsapp       text,
  email          text,
  address        text,
  city           text,
  district       text,
  logo_url       text,
  instagram_url  text,
  facebook_url   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER FUNCTION: update updated_at column automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER office_settings_updated_at
  BEFORE UPDATE ON public.office_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: auto-create agent row on new auth.users insert
-- First user ever → is_admin = true; subsequent users → false
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  agent_count integer;
BEGIN
  SELECT COUNT(*) INTO agent_count FROM public.agents;

  INSERT INTO public.agents (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Ajan'),
    CASE WHEN agent_count = 0 THEN true ELSE false END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
-- RLS POLICIES: agents
-- ============================================================
-- Public can read limited fields (handled via view or column check — we expose all here and restrict at query level)
CREATE POLICY "agents_anon_select"
  ON public.agents FOR SELECT
  USING (true);

-- Agents can update their own row
CREATE POLICY "agents_self_update"
  ON public.agents FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins have full access
CREATE POLICY "agents_admin_all"
  ON public.agents FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: listings
-- ============================================================
-- Public can view active listings
CREATE POLICY "listings_anon_select"
  ON public.listings FOR SELECT
  USING (status = 'aktif');

-- Agents can CRUD their own listings (+ see all statuses of own listings)
CREATE POLICY "listings_agent_select_own"
  ON public.listings FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "listings_agent_insert"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "listings_agent_update"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "listings_agent_delete"
  ON public.listings FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

-- Admins have full access
CREATE POLICY "listings_admin_all"
  ON public.listings FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: listing_images
-- ============================================================
CREATE POLICY "listing_images_anon_select"
  ON public.listing_images FOR SELECT
  USING (true);

CREATE POLICY "listing_images_agent_insert"
  ON public.listing_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_images.listing_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "listing_images_agent_update"
  ON public.listing_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_images.listing_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "listing_images_agent_delete"
  ON public.listing_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_images.listing_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "listing_images_admin_all"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: customers
-- ============================================================
CREATE POLICY "customers_agent_select"
  ON public.customers FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "customers_agent_insert"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "customers_agent_update"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "customers_agent_delete"
  ON public.customers FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "customers_admin_all"
  ON public.customers FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: appointments
-- ============================================================
CREATE POLICY "appointments_agent_select"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "appointments_agent_insert"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "appointments_agent_update"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "appointments_agent_delete"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "appointments_admin_all"
  ON public.appointments FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: inquiries
-- ============================================================
-- Anon can only INSERT (honeypot must be empty)
CREATE POLICY "inquiries_anon_insert"
  ON public.inquiries FOR INSERT
  WITH CHECK (honeypot IS NULL OR honeypot = '');

-- Authenticated agents can read and update inquiries
CREATE POLICY "inquiries_authenticated_select"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inquiries_authenticated_update"
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins have full access
CREATE POLICY "inquiries_admin_all"
  ON public.inquiries FOR ALL
  TO authenticated
  USING (is_admin());

-- ============================================================
-- RLS POLICIES: office_settings
-- ============================================================
CREATE POLICY "office_settings_anon_select"
  ON public.office_settings FOR SELECT
  USING (true);

CREATE POLICY "office_settings_admin_all"
  ON public.office_settings FOR ALL
  TO authenticated
  USING (is_admin());