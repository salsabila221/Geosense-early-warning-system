import {
  Backpack,
  BookOpen,
  Eye,
  Info,
  Radio,
  Route,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getStatusMeta } from "@/lib/status"

const STATUS_ICON = {
  Aman: ShieldCheck,
  Siaga: TriangleAlert,
  Warning: Siren,
}

const STEPS = [
  {
    icon: Eye,
    title: "Kenali tanda-tanda awal",
    body:
      "Tanah retak memanjang, pohon atau tiang listrik miring, air mendadak keruh, dan getaran berulang adalah indikasi pergerakan tanah.",
  },
  {
    icon: Backpack,
    title: "Siapkan tas siaga",
    body:
      "Simpan dokumen penting, obat pribadi, senter, powerbank, air minum, dan uang tunai di tas yang mudah dijangkau.",
  },
  {
    icon: ShieldCheck,
    title: "Lindungi diri saat getaran terjadi",
    body:
      "Jauhi lereng, tebing, dan bangunan yang retak. Lindungi kepala, tetap tenang, dan jangan berlarian tanpa arah.",
  },
  {
    icon: Route,
    title: "Evakuasi secara terarah",
    body:
      "Ikuti jalur evakuasi resmi menuju titik kumpul. Dahulukan anak, lansia, ibu hamil, dan penyandang disabilitas.",
  },
  {
    icon: Radio,
    title: "Setelah kejadian",
    body:
      "Jauhi area longsor karena berpotensi longsor susulan. Laporkan korban atau kerusakan ke BPBD dan pantau info resmi.",
  },
  {
    icon: Info,
    title: "Saring informasi",
    body:
      "Percaya hanya pada dashboard GeoSense, BPBD, dan kanal resmi pemerintah. Jangan sebarkan kabar yang belum terverifikasi.",
  },
]

export default function DisasterGuidance({ status = "Aman" }) {
  const meta = getStatusMeta(status)
  const StatusIcon = STATUS_ICON[meta.label] || ShieldCheck

  return (
    <section
      id="panduan"
      className="mt-8 scroll-mt-32 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            Panduan Tanggap Bencana
          </h3>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Langkah sederhana yang bisa dilakukan sebelum, saat, dan setelah terjadi pergerakan tanah.
          </p>
        </div>
        <Badge variant="secondary" className="h-6 w-fit px-2.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          Edukasi
        </Badge>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {/* Rekomendasi sesuai status saat ini */}
        <div className={`rounded-xl border p-4 sm:p-5 ${meta.panelBg}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${meta.panelIcon}`}>
              <StatusIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${meta.panelText}/70`}>
                Rekomendasi saat status {meta.label}
              </p>
              <p className={`mt-1 text-sm font-medium leading-relaxed ${meta.panelText}`}>
                {meta.guidance}
              </p>
            </div>
          </div>
        </div>

        {/* Langkah-langkah */}
        <div className="feature-grid grid gap-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="group rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h4 className="break-words text-sm font-bold text-foreground">{step.title}</h4>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
