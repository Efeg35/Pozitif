interface Props {
  params: { id: string; slug: string }
}

export default function IlanDetayPage({ params }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div>İlan Detay — id: {params.id} / slug: {params.slug} (Phase 3)</div>
    </div>
  )
}