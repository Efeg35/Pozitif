import type { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { getOfficeSettings } from '@/app/actions/public.actions'
import InquiryForm from '@/components/public/InquiryForm'

export const metadata: Metadata = {
  title: 'İletişim | Pozitif Gayrimenkul',
  description: 'Pozitif Gayrimenkul ile iletişime geçin. Telefon, e-posta veya formu doldurun.',
}

export default async function ContactPage() {
  const settings = await getOfficeSettings()

  const waPhone = settings?.whatsapp ?? settings?.phone
  const waLink = waPhone
    ? `https://wa.me/${waPhone.replace(/\D/g, '')}`
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">İletişim</h1>
        <p className="mt-3 text-zinc-500">
          Sorularınız için bize ulaşın, en kısa sürede dönüş yapacağız.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* LEFT: Contact info */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-zinc-800">İletişim Bilgileri</h2>

          <div className="flex flex-col gap-4">
            {settings?.phone && (
              <ContactCard
                icon={<Phone className="h-5 w-5 text-blue-600" />}
                label="Telefon"
                href={`tel:${settings.phone}`}
                value={settings.phone}
              />
            )}
            {settings?.email && (
              <ContactCard
                icon={<Mail className="h-5 w-5 text-blue-600" />}
                label="E-posta"
                href={`mailto:${settings.email}`}
                value={settings.email}
              />
            )}
            {settings?.address && (
              <ContactCard
                icon={<MapPin className="h-5 w-5 text-blue-600" />}
                label="Adres"
                value={[settings.address, settings.district, settings.city]
                  .filter(Boolean)
                  .join(', ')}
              />
            )}
            <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Çalışma Saatleri
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-700">
                  Pazartesi – Cumartesi: 09:00 – 18:00
                </p>
                <p className="text-sm text-zinc-500">Pazar: Kapalı</p>
              </div>
            </div>
          </div>

          {/* Social + WhatsApp */}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp&apos;tan Yazın
            </a>
          )}

          {(settings?.instagram_url || settings?.facebook_url) && (
            <div className="flex items-center gap-3">
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Instagram
                </a>
              )}
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Inquiry form */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-zinc-800">Mesaj Gönderin</h2>
          <InquiryForm listingId={null} listingTitle="Genel İletişim" />
        </div>
      </div>
    </div>
  )
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-zinc-700">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </a>
    )
  }

  return inner
}