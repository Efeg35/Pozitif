-- ============================================================
-- 002_public_filter_indexes.sql
-- Partial indexes for public listing filter columns.
-- All indexes are WHERE status='aktif' since every public
-- filter query already restricts to active listings.
-- ============================================================

-- area_m2 — used for min/max area filter + area_desc sort
CREATE INDEX IF NOT EXISTS listings_area_m2_idx
  ON public.listings(area_m2)
  WHERE status = 'aktif';

-- building_age — used for building_age range filter
CREATE INDEX IF NOT EXISTS listings_building_age_idx
  ON public.listings(building_age)
  WHERE status = 'aktif';

-- floor — used for floor_range filter
CREATE INDEX IF NOT EXISTS listings_floor_idx
  ON public.listings(floor)
  WHERE status = 'aktif';

-- bathrooms — used for bathrooms minimum filter
CREATE INDEX IF NOT EXISTS listings_bathrooms_idx
  ON public.listings(bathrooms)
  WHERE status = 'aktif';

-- heating_type — used for heating_type equality filter
CREATE INDEX IF NOT EXISTS listings_heating_type_idx
  ON public.listings(heating_type)
  WHERE status = 'aktif';

-- dues — used for max_dues filter
CREATE INDEX IF NOT EXISTS listings_dues_idx
  ON public.listings(dues)
  WHERE status = 'aktif';

-- deposit — used for max_deposit filter
CREATE INDEX IF NOT EXISTS listings_deposit_idx
  ON public.listings(deposit)
  WHERE status = 'aktif';