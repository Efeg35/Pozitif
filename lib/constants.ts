import type {
  ListingType,
  PropertyType,
  ListingStatus,
  Currency,
  AppointmentStatus,
  InquiryStatus,
  InterestType,
  CustomerStatus,
  HeatingType,
  BuildingAgeRange,
  FloorRange,
  SortOption,
} from './types'

// ── Enum value arrays ────────────────────────────────────────
export const LISTING_TYPES:        ListingType[]       = ['satilik', 'kiralik']
export const PROPERTY_TYPES:       PropertyType[]      = ['daire', 'villa', 'arsa', 'dukkan', 'ofis']
export const LISTING_STATUSES:     ListingStatus[]     = ['taslak', 'aktif', 'satildi', 'kiralandi', 'pasif']
export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['bekliyor', 'tamamlandi', 'iptal']
export const INQUIRY_STATUSES:     InquiryStatus[]     = ['yeni', 'incelendi', 'yanitlandi']
export const INTEREST_TYPES:       InterestType[]      = ['satilik', 'kiralik', 'her_ikisi']
export const CURRENCIES:           Currency[]          = ['TRY', 'USD', 'EUR']
export const CUSTOMER_STATUSES:    CustomerStatus[]    = ['aktif', 'pasif']

// ── Image constraints ────────────────────────────────────────
export const MAX_IMAGES_PER_LISTING = 20
export const MAX_IMAGE_SIZE_MB      = 5
export const ALLOWED_IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp'] as const
export const DEFAULT_CITY           = 'İzmir'

// ── Turkish display labels ───────────────────────────────────
// Always map from DB value — never hardcode Turkish strings in UI components.

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
}

export const STATUS_LABELS: Record<ListingStatus, string> = {
  taslak:    'Taslak',
  aktif:     'Aktif',
  satildi:   'Satıldı',
  kiralandi: 'Kiralandı',
  pasif:     'Pasif',
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  daire:  'Daire',
  villa:  'Villa',
  arsa:   'Arsa',
  dukkan: 'Dükkan',
  ofis:   'Ofis',
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  bekliyor:   'Bekliyor',
  tamamlandi: 'Tamamlandı',
  iptal:      'İptal',
}

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  yeni:       'Yeni',
  incelendi:  'İncelendi',
  yanitlandi: 'Yanıtlandı',
}

export const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  satilik:   'Satılık',
  kiralik:   'Kiralık',
  her_ikisi: 'Her İkisi',
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  TRY: '₺ TRY',
  USD: '$ USD',
  EUR: '€ EUR',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  aktif: 'Aktif',
  pasif: 'Pasif',
}

// ── Heating types ────────────────────────────────────────────
export const HEATING_TYPES: HeatingType[] = [
  'dogalgaz', 'kombi', 'merkezi', 'klima', 'soba', 'yerden', 'yok',
]

export const HEATING_TYPE_LABELS: Record<HeatingType, string> = {
  dogalgaz: 'Doğalgaz',
  kombi:    'Kombi',
  merkezi:  'Merkezi',
  klima:    'Klima',
  soba:     'Soba',
  yerden:   'Yerden Isıtma',
  yok:      'Yok',
}

// ── Building age ranges ──────────────────────────────────────
export const BUILDING_AGE_RANGES: { label: string; value: BuildingAgeRange }[] = [
  { label: 'Sıfır (0)',    value: '0'     },
  { label: '1 – 5 yıl',   value: '1-5'   },
  { label: '6 – 10 yıl',  value: '6-10'  },
  { label: '11 – 15 yıl', value: '11-15' },
  { label: '16 – 20 yıl', value: '16-20' },
  { label: '21 – 25 yıl', value: '21-25' },
  { label: '26+ yıl',     value: '26+'   },
]

// ── Floor ranges ─────────────────────────────────────────────
export const FLOOR_RANGES: { label: string; value: FloorRange }[] = [
  { label: 'Zemin (0)',  value: '0'   },
  { label: '1 – 3. kat', value: '1-3' },
  { label: '4 – 7. kat', value: '4-7' },
  { label: '8+. kat',    value: '8+'  },
]

// ── Sort options ─────────────────────────────────────────────
export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'En Yeni',        value: 'newest'     },
  { label: 'Fiyat (Düşük→)', value: 'price_asc'  },
  { label: 'Fiyat (Yüksek→)', value: 'price_desc' },
  { label: 'En Büyük m²',   value: 'area_desc'  },
  { label: 'Öne Çıkanlar',  value: 'featured'   },
]

// ── İzmir districts ──────────────────────────────────────────
export const IZMIR_DISTRICTS = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama',
  'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
  'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar',
  'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz',
  'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş',
  'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla',
] as const

// Coastal/resort areas shown as quick-filters on public site.
export const IZMIR_COASTAL_DISTRICTS = [
  'Çeşme',
  'Alaçatı',
  'Urla',
  'Karaburun',
  'Seferihisar',
  'Foça',
  'Güzelbahçe',
  'Menderes',
  'Dikili',
  'Selçuk',
] as const