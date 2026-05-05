import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts Turkish text to ASCII slug
// e.g. "İzmir Karşıyaka 3+1 Satılık Daire" → "izmir-karsiyaka-3-1-satilik-daire"
export function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  }

  return text
    .split('')
    .map((char) => turkishMap[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

// Formats a number as a Turkish-locale price string
// e.g. formatPrice(2500000) → "₺2.500.000"
// e.g. formatPrice(1500, 'USD') → "$1.500"
export function formatPrice(amount: number, currency = 'TRY'): string {
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
  }
  const symbol = currencySymbols[currency] ?? currency
  return `${symbol}${amount.toLocaleString('tr-TR')}`
}

// Formats a date string or Date object using Turkish locale
// e.g. "12 Ocak 2025"
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}