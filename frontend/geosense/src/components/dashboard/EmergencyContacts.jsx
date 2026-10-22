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
import { Badge } from "@/components/ui/badge"

const CONTACTS = [
  {
    name: "Pusat Darurat Terpadu",
    number: "112",
    tel: "112",
    description: "Satu nomor untuk BPBD, ambulans, damkar, dan kepolisian setempat. Gratis 24 jam.",
    icon: Siren,
    featured: true,
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

export default function EmergencyContacts() {
  return (
    <section
      id="nomor-darurat"
      className="mt-8 scroll-mt-32 rounded-2xl bg-white border border-[#D9DCD6]/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden"
    >
      <div className="flex flex-col gap-3 border-b border-[#D9DCD6]/40 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-[#3A7CA5]" aria-hidden="true" />
            Nomor Darurat
          </h3>
          <p className="mt-0.5 text-xs font-medium text-[#2F6690]">
            Klik kartu untuk langsung menghubungi layanan darurat dari perangkat kamu.
          </p>
        </div>
        <Badge className="w-fit bg-red-50 text-red-700 border border-red-200 shadow-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          Siaga 24 Jam
        </Badge>
      </div>

      <div className="p-4 sm:p-6">
        <div className="feature-grid grid gap-4">
          {CONTACTS.map((contact) => {
            const Icon = contact.icon
            return (
              <a
                key={contact.name}
                href={`tel:${contact.tel}`}
                className={`group flex flex-col justify-between rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50 ${
                  contact.featured
                    ? "border-[#3A7CA5]/40 bg-[#16425B] text-white hover:bg-[#16425B]/95"
                    : "border-[#D9DCD6]/60 bg-white text-[#16425B] hover:border-[#81C3D7]/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      contact.featured ? "bg-white/15 text-white" : "bg-[#81C3D7]/20 text-[#2F6690]"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      contact.featured
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-[#2F6690] group-hover:bg-[#3A7CA5] group-hover:text-white"
                    }`}
                  >
                    <PhoneCall className="h-3 w-3" aria-hidden="true" />
                    Telepon
                  </span>
                </div>

                <div className="mt-4">
                  <p className={`break-words text-sm font-bold ${contact.featured ? "text-white" : "text-[#16425B]"}`}>
                    {contact.name}
                  </p>
                  <p
                    className={`mt-0.5 font-mono text-lg font-bold tracking-tight ${
                      contact.featured ? "text-[#81C3D7]" : "text-[#2F6690]"
                    }`}
                  >
                    {contact.number}
                  </p>
                  <p
                    className={`mt-2 text-[11px] leading-relaxed ${
                      contact.featured ? "text-white/80" : "text-[#16425B]/80"
                    }`}
                  >
                    {contact.description}
                  </p>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            Gunakan nomor ini hanya saat keadaan darurat. Jangan melakukan panggilan uji coba.
            Nomor layanan dapat berubah sewaktu-waktu, verifikasi berkala melalui kanal resmi pemerintah daerah.
          </p>
        </div>
      </div>
    </section>
  )
}
