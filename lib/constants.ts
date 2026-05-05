// All enum values are ASCII-safe. Turkish display labels live in the *_LABELS maps below.

export const LISTING_TYPES        = ['satilik', 'kiralik'] as const
export const PROPERTY_TYPES       = ['daire', 'villa', 'arsa', 'dukkan', 'ofis'] as const
export const LISTING_STATUSES     = ['taslak', 'aktif', 'satildi', 'kiralandi', 'pasif'] as const
export const APPOINTMENT_STATUSES = ['bekliyor', 'tamamlandi', 'iptal'] as const
export const INQUIRY_STATUSES     = ['yeni', 'incelendi', 'yanitlandi'] as const
export const INTEREST_TYPES       = ['satilik', 'kiralik', 'her_ikisi'] as const
export const CURRENCIES           = ['TRY', 'USD', 'EUR'] as const

export const MAX_IMAGES_PER_LISTING = 20
export const MAX_IMAGE_SIZE_MB      = 5
export const ALLOWED_IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp'] as const
export const DEFAULT_CITY           = 'İzmir'

// Turkish display labels — always map from DB value, never hardcode in UI
export const LISTING_TYPE_LABELS: Record<string, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
}

export const STATUS_LABELS: Record<string, string> = {
  taslak:    'Taslak',
  aktif:     'Aktif',
  satildi:   'Satıldı',
  kiralandi: 'Kiralandı',
  pasif:     'Pasif',
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  daire:  'Daire',
  villa:  'Villa',
  arsa:   'Arsa',
  dukkan: 'Dükkan',
  ofis:   'Ofis',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  bekliyor:   'Bekliyor',
  tamamlandi: 'Tamamlandı',
  iptal:      'İptal',
}

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  yeni:       'Yeni',
  incelendi:  'İncelendi',
  yanitlandi: 'Yanıtlandı',
}

export const INTEREST_TYPE_LABELS: Record<string, string> = {
  satilik:   'Satılık',
  kiralik:   'Kiralık',
  her_ikisi: 'Her İkisi',
}

export const CURRENCY_LABELS: Record<string, string> = {
  TRY: '₺ TRY',
  USD: '$ USD',
  EUR: '€ EUR',
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