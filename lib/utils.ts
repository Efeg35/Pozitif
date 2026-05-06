import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts Turkish text to an ASCII-safe URL slug.
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

// Formats a number as a Turkish-locale price string using Intl.NumberFormat.
// e.g. formatPrice(2500000)          → "₺2.500.000"
// e.g. formatPrice(1500, 'USD')      → "$1.500"
// e.g. formatPrice(950, 'EUR', true) → "€950,00" (with decimals)
export function formatPrice(
  amount: number,
  currency: Currency = 'TRY',
  showDecimals = false
): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

// Formats a date string or Date object using Turkish locale.
// e.g. formatDate('2025-01-12') → "12 Ocak 2025"
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formats a datetime string or Date object with time.
// e.g. "12 Ocak 2025, 14:30"
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}