interface Props {
  params: { id: string }
}

export default function MusteriDetayPage({ params }: Props) {
  return <div className="text-zinc-700">Musteri Detay — {params.id} (Phase 4)</div>
}