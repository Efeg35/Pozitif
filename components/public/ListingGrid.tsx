import { Home } from 'lucide-react'
import ListingCard from './ListingCard'
import type { PublicListing } from '@/app/actions/public.actions'

interface ListingGridProps {
  listings: PublicListing[]
  emptyMessage?: string
  priorityCount?: number
}

export default function ListingGrid({
  listings,
  emptyMessage = 'Henüz ilan bulunmuyor.',
  priorityCount = 3,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-zinc-100 p-5">
          <Home className="h-10 w-10 text-zinc-400" />
        </div>
        <p className="text-base font-medium text-zinc-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} priority={index < priorityCount} />
      ))}
    </div>
  )
}