// ============================================================
// Database types — kept in sync with 001_initial_schema.sql
// ============================================================

// ── Enum-like union types ────────────────────────────────────
export type ListingType       = 'satilik' | 'kiralik'
export type PropertyType      = 'daire' | 'villa' | 'arsa' | 'dukkan' | 'ofis'
export type ListingStatus     = 'taslak' | 'aktif' | 'satildi' | 'kiralandi' | 'pasif'
export type Currency          = 'TRY' | 'USD' | 'EUR'
export type AppointmentStatus = 'bekliyor' | 'tamamlandi' | 'iptal'
export type InquiryStatus     = 'yeni' | 'incelendi' | 'yanitlandi'
export type InterestType      = 'satilik' | 'kiralik' | 'her_ikisi'
export type CustomerStatus    = 'aktif' | 'pasif'

// ── Filter / sort union types (public listing search) ────────
export type HeatingType      = 'dogalgaz' | 'kombi' | 'merkezi' | 'klima' | 'soba' | 'yerden' | 'yok'
export type BuildingAgeRange = '0' | '1-5' | '6-10' | '11-15' | '16-20' | '21-25' | '26+'
export type FloorRange       = '0' | '1-3' | '4-7' | '8+'
export type SortOption       = 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'featured'

// ── Table row types ──────────────────────────────────────────

export type Agent = {
  id: string
  full_name: string
  phone: string | null
  title: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Listing = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  currency: Currency
  listing_type: ListingType
  property_type: PropertyType
  status: ListingStatus
  rooms: number | null
  bathrooms: number | null
  living_rooms: number | null
  area_m2: number | null
  floor: number | null
  total_floors: number | null
  building_age: number | null
  heating_type: string | null
  is_furnished: boolean
  has_balcony: boolean
  has_elevator: boolean
  has_parking: boolean
  is_in_complex: boolean
  dues: number
  deposit: number
  address: string | null
  district: string | null
  city: string
  latitude: number | null
  longitude: number | null
  is_featured: boolean
  agent_id: string | null
  created_at: string
  updated_at: string
}

export type ListingImage = {
  id: string
  listing_id: string
  url: string
  storage_path: string
  display_order: number
  is_cover: boolean
  created_at: string
}

export type Customer = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  notes: string | null
  interest_type: InterestType | null
  budget_min: number | null
  budget_max: number | null
  preferred_districts: string[] | null
  preferred_property_types: PropertyType[] | null
  status: CustomerStatus
  agent_id: string | null
  created_at: string
  updated_at: string
}

export type Appointment = {
  id: string
  listing_id: string | null
  customer_id: string
  agent_id: string | null
  appointment_date: string
  duration_minutes: number
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type Inquiry = {
  id: string
  listing_id: string | null
  name: string
  phone: string | null
  email: string | null
  message: string | null
  honeypot: string | null
  status: InquiryStatus
  source: string
  created_at: string
}

export type OfficeSettings = {
  id: string
  office_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  logo_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  created_at: string
  updated_at: string
}

// ── Joined types for common queries ─────────────────────────

export type ListingWithImages = Listing & {
  listing_images: ListingImage[]
}

export type ListingWithImagesAndAgent = Listing & {
  listing_images: ListingImage[]
  agents: Pick<Agent, 'full_name' | 'title'> | null
}

export type AppointmentWithRelations = Appointment & {
  customers: Pick<Customer, 'id' | 'full_name' | 'phone' | 'email'> | null
  listings: Pick<Listing, 'id' | 'title' | 'slug' | 'district' | 'city'> | null
  agents: Pick<Agent, 'id' | 'full_name'> | null
}

export type CustomerWithRelations = Customer & {
  agents: Pick<Agent, 'full_name' | 'title'> | null
  appointments?: AppointmentWithRelations[]
}

export type InquiryWithListing = Inquiry & {
  listings: Pick<Listing, 'id' | 'title' | 'slug' | 'district' | 'city' | 'agent_id'> | null
}