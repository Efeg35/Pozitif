// lib/whatsapp.ts
// WhatsApp URL builder utilities.
// Turkish numbers: if starts with 0 → replace with 90
// International numbers: strip leading + if present
// wa.me format: https://wa.me/{digits}?text={encodedMessage}

/**
 * Normalize a phone number for use in wa.me URLs.
 * Returns null if the phone is missing or too short to be valid.
 */
export function normalizePhoneForWhatsapp(phone?: string | null): string | null {
  if (!phone) return null

  // Remove all non-digit characters (spaces, dashes, parens, dots, +)
  const digits = phone.replace(/\D/g, '')

  // Turkish local number starting with 0: 0xxxxxxxxxx (11 digits)
  if (digits.startsWith('0') && digits.length === 11) {
    return '90' + digits.slice(1)
  }

  // Turkish number without prefix: 5xxxxxxxxx or 2xxxxxxxxx (10 digits)
  if (/^[2-9]/.test(digits) && digits.length === 10) {
    return '90' + digits
  }

  // Already has Turkish country code: 90xxxxxxxxxx (12 digits)
  if (digits.startsWith('90') && digits.length === 12) {
    return digits
  }

  // International number with country code (at least 10 digits total)
  if (digits.length >= 10) {
    return digits
  }

  // Too short / unrecognizable — do not produce a broken link
  return null
}

/**
 * Build a wa.me URL for a given phone number and optional pre-filled text.
 * Returns null if the phone cannot be normalized.
 */
export function buildWhatsappUrl(phone?: string | null, text?: string): string | null {
  const normalized = normalizePhoneForWhatsapp(phone)
  if (!normalized) return null
  const base = `https://wa.me/${normalized}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

/**
 * Build a WhatsApp message for a specific listing inquiry.
 * Link uses /ilanlar/{id}/{slug} format.
 */
export function buildListingWhatsappMessage(params: {
  listingTitle: string
  listingId: string
  listingSlug: string
  siteUrl: string
}): string {
  const { listingTitle, listingId, listingSlug, siteUrl } = params
  return `Merhaba! "${listingTitle}" ilanı hakkında bilgi almak istiyorum.\n${siteUrl}/ilanlar/${listingId}/${listingSlug}`
}

/**
 * Build a WhatsApp message for a CRM customer quick contact.
 */
export function buildCustomerWhatsappMessage(params: {
  customerName: string
}): string {
  return `Merhaba ${params.customerName}, sizi aramak istedim.`
}

/**
 * Build a WhatsApp message for a general inquiry/lead follow-up.
 */
export function buildInquiryWhatsappMessage(params: {
  customerName: string
  listingTitle?: string
}): string {
  const { customerName, listingTitle } = params
  if (listingTitle) {
    return `Merhaba ${customerName}, "${listingTitle}" ilanınıza olan ilginiz için teşekkür ederiz.`
  }
  return `Merhaba ${customerName}, talebiniz için teşekkür ederiz.`
}