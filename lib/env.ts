// lib/env.ts
// Centralized environment variable access.
// Vercel production must set NEXT_PUBLIC_SITE_URL to live domain.
// Local .env.local can keep http://localhost:3000

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return url.replace(/\/$/, '') // remove trailing slash
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
}
