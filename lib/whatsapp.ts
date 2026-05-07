// lib/whatsapp.ts
// WhatsApp URL builder utilities.
// Turkish numbers: if starts with 0 → replace with 90
// International numbers: strip leading + if present
// wa.me format: https://wa.me/{digits}?text={encodedMessage}

/**
 * Normalize a phone number for use in wa.me URLs.
 * Strips spaces, dashes, parentheses, then applies Turkish prefix logic.
 */
export function normalizePhoneForWhatsapp(phone: string): string {
  // Remove all non-digit characters except leading +
  const stripped = phone.replace(/[\s\-().]/g, '')

  // Already has country code with +
  if (stripped.startsWith('+')) {
    return stripped.slice(1) // remove the +
  }

  // Turkish local number starting with 0
  if (stripped.startsWith('0')) {
    return '90' + stripped.slice(1)
  }

  // Turkish number starting with 5xx (mobile) or 2xx/3xx (landline) without prefix
  if (/^[2-9]/.test(stripped) && stripped.length === 10) {
    return '90' + stripped
  }

  return stripped
}

/**
 * Build a wa.me URL for a given phone number and optional pre-filled text.
 */
export function buildWhatsappUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneForWhatsapp(phone)
  const base = `https://wa.me/${normalized}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

/**
 * Build a WhatsApp message for a specific listing inquiry.
 */
export function buildListingWhatsappMessage(params: {
  listingTitle: string
  listingId: string
  siteUrl: string
}): string {
  const { listingTitle, listingId, siteUrl } = params
  return `Merhaba! "${listingTitle}" ilanı hakkında bilgi almak istiyorum.\n${siteUrl}/ilanlar/${listingId}`
}

/**
 * Build a WhatsApp message for a CRM customer quick contact.
 */
export function buildCustomerWhatsappMessage(params: {
  customerName: string
}): string {
  const { customerName } = params
  return `Merhaba ${customerName}, sizi aramak istedim.`
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