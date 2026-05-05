export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <span className="font-semibold text-blue-700">Pozitif Emlak</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-zinc-50 px-6 py-4 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Pozitif Emlak
      </footer>
    </div>
  )
}