import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { getCustomers } from '@/app/actions/customer.actions'
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUSES,
  INTEREST_TYPE_LABELS,
  INTEREST_TYPES,
} from '@/lib/constants'
import type { CustomerStatus, InterestType } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    interest?: string
  }>
}

export default async function MusterilerPage({ searchParams }: PageProps) {
  const { q, status, interest } = await searchParams

  const result = await getCustomers({
    search: q || undefined,
    status: status || undefined,
    interest_type: interest || undefined,
  })
  const customers = result.success ? result.data : []

  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { q, status, interest, ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    const qs = sp.toString()
    return `/admin/musteriler${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Müşteriler</h1>
          <p className="text-sm text-zinc-500 mt-1">{customers.length} müşteri</p>
        </div>
        <Link
          href="/admin/musteriler/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form method="GET" action="/admin/musteriler" className="flex-1">
          {status && <input type="hidden" name="status" value={status} />}
          {interest && <input type="hidden" name="interest" value={interest} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Ad, telefon veya e-posta ara..."
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href={buildUrl({ status: undefined })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !status
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            Tümü
          </Link>
          {(CUSTOMER_STATUSES as readonly string[]).map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                status === s
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {CUSTOMER_STATUS_LABELS[s as CustomerStatus]}
            </Link>
          ))}
        </div>

        {/* Interest type filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href={buildUrl({ interest: undefined })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !interest
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            İlgi: Tümü
          </Link>
          {(INTEREST_TYPES as readonly string[]).map((it) => (
            <Link
              key={it}
              href={buildUrl({ interest: it })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                interest === it
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {INTEREST_TYPE_LABELS[it as InterestType]}
            </Link>
          ))}
        </div>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Users className="h-12 w-12 mb-3" />
          {q || status || interest ? (
            <>
              <p className="text-lg font-medium">Sonuç bulunamadı</p>
              <p className="text-sm mt-1">Farklı filtreler deneyin.</p>
              <Link
                href="/admin/musteriler"
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Filtreleri temizle
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Henüz müşteri yok</p>
              <p className="text-sm mt-1">İlk müşteriyi eklemek için butona tıklayın.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Telefon</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden md:table-cell">E-posta</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden lg:table-cell">İlgi</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden lg:table-cell">Danışman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/musteriler/${customer.id}`}
                      className="font-medium text-zinc-900 hover:text-blue-700"
                    >
                      {customer.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-600 hidden md:table-cell">{customer.email ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {customer.interest_type
                      ? INTEREST_TYPE_LABELS[customer.interest_type as InterestType]
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'aktif'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status as CustomerStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 hidden lg:table-cell">
                    {customer.agents?.full_name ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}