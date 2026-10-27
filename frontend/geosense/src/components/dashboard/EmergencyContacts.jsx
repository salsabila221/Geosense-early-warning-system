import {
  Ambulance,
  Building2,
  Flame,
  LifeBuoy,
  PhoneCall,
  Shield,
  Siren,
  TriangleAlert,
} from "lucide-react"

const CONTACTS = [
  {
    name: "Pusat Darurat Terpadu",
    number: "112",
    tel: "112",
    description: "Satu nomor untuk BPBD, ambulans, damkar, dan kepolisian setempat. Gratis 24 jam.",
    icon: Siren,
  },
  {
    name: "Ambulans / Gawat Darurat Medis",
    number: "119",
    tel: "119",
    description: "Public Safety Center (PSC) untuk bantuan medis dan evakuasi korban.",
    icon: Ambulance,
  },
  {
    name: "Pemadam Kebakaran Kota Bandung",
    number: "(022) 7207113",
    tel: "+62227207113",
    description: "Diskar PB Kota Bandung, siaga 24 jam untuk kebakaran dan penyelamatan.",
    icon: Flame,
  },
  {
    name: "BPBD Provinsi Jawa Barat",
    number: "0823 1701 2056",
    tel: "+6282317012056",
    description: "Koordinasi penanggulangan bencana dan evakuasi wilayah Jawa Barat.",
    icon: Building2,
  },
  {
    name: "Kepolisian",
    number: "110",
    tel: "110",
    description: "Bantuan keamanan, pengaturan lalu lintas, dan evakuasi.",
    icon: Shield,
  },
  {
    name: "Basarnas (SAR)",
    number: "115",
    tel: "115",
    description: "Pencarian dan pertolongan korban di area bencana.",
    icon: LifeBuoy,
  },
]

const [FEATURED_CONTACT, ...LOCAL_CONTACTS] = CONTACTS

export default function EmergencyContacts() {
  const FeaturedIcon = FEATURED_CONTACT.icon

  return (
    <section id="nomor-darurat" className="mt-8 scroll-mt-32 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <PhoneCall className="h-4 w-4 text-primary" aria-hidden="true" />
            Nomor Darurat
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Klik kartu untuk langsung menghubungi layanan darurat dari perangkat Anda.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          Siaga 24 Jam
        </span>
      </div>

      <a
        href={`tel:${FEATURED_CONTACT.tel}`}
        className="group flex flex-col gap-4 rounded-xl bg-brand-dark p-5 text-white shadow-sm transition-all hover:bg-brand-dark/95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-light">
            <FeaturedIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              {FEATURED_CONTACT.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {FEATURED_CONTACT.number}
              </p>
              <PhoneCall className="h-4 w-4 text-brand-light" aria-hidden="true" />
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/75">
              {FEATURED_CONTACT.description}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-light">
          <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
          Panggil sekarang
        </span>
      </a>

      <div className="feature-grid grid gap-4">
        {LOCAL_CONTACTS.map((contact) => {
          const Icon = contact.icon
          return (
            <a
              key={contact.name}
              href={`tel:${contact.tel}`}
              className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="mt-4">
                <p className="break-words text-sm font-semibold text-foreground">
                  {contact.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                    {contact.number}
                  </p>
                  <PhoneCall
                    className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {contact.description}
                </p>
              </div>
            </a>
          )
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50/70 px-4 py-3 text-amber-900">
        <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed">
          Gunakan nomor ini hanya saat keadaan darurat. Jangan melakukan panggilan uji coba.
          Nomor layanan dapat berubah sewaktu-waktu, verifikasi berkala melalui kanal resmi pemerintah daerah.
        </p>
      </div>
    </section>
  )
}
