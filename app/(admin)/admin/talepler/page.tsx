import { getInquiries } from '@/app/actions/crm.actions'
import { INQUIRY_STATUS_LABELS } from '@/lib/constants'
import type { InquiryStatus } from '@/lib/types'
import InquiryInbox from './InquiryInbox'

export default async function TaleplerPage() {
  const result = await getInquiries()
  const inquiries = result.success ? result.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Talep Gelen Kutusu</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {inquiries.filter((i) => i.status === 'yeni').length} yeni talep
        </p>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <InquiryInbox
        inquiries={inquiries}
        statusLabels={INQUIRY_STATUS_LABELS as Record<InquiryStatus, string>}
      />
    </div>
  )
}