interface Props {
  params: { id: string }
}

export default function IlanDuzenlePage({ params }: Props) {
  return <div className="text-zinc-700">İlan Düzenle — {params.id} (Phase 2)</div>
}