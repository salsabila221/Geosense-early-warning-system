import {
  BookOpen,
  Droplets,
  Eye,
  Radio,
  Route,
  ShieldCheck,
  Siren,
  Sprout,
  TriangleAlert,
} from "lucide-react"
import { getStatusMeta } from "@/lib/status"

const STATUS_ICON = {
  Aman: ShieldCheck,
  Siaga: TriangleAlert,
  Warning: Siren,
}

const STEPS = [
  {
    icon: Eye,
    title: "Kenali risiko dan tanda awal",
    body:
      "Longsor dipicu curah hujan tinggi, lereng terjal, tanah tebal/kurang padat, pengikisan, vegetasi berkurang, dan getaran. Waspadai retakan tanah, pohon atau tiang miring, air mendadak keruh, dan suara gemuruh.",
  },
  {
    icon: Droplets,
    title: "Jaga drainase dan tutup rekahan",
    body:
      "Pastikan selokan mengalirkan air keluar lereng dan tidak tersumbat. Tutup rekahan di atas lereng agar air hujan tidak cepat meresap ke dalam tanah.",
  },
  {
    icon: Sprout,
    title: "Hijaukan dan perkuat lereng",
    body:
      "Tanam vegetasi berakar kuat dan dalam (nangka, durian, pete, kaliandra, vetiver), buat terasering, tanggul/bangunan penahan, serta fondasi yang kuat. Hindari bangunan permanen di tebing atau tanah gerak.",
  },
  {
    icon: Route,
    title: "Siapkan rencana evakuasi",
    body:
      "Kenali jalur dan zona evakuasi, siapkan tas siaga serta dokumen penting, dan pantau informasi resmi BNPB/BPBD saat curah hujan tinggi.",
  },
  {
    icon: Siren,
    title: "Saat longsor terjadi",
    body:
      "Segera evakuasi menjauhi suara gemuruh dan arah datangnya longsoran. Jauhi wilayah longsor karena tanah masih labil; ikuti sirene menuju zona evakuasi yang telah ditentukan.",
  },
  {
    icon: Radio,
    title: "Setelah longsor",
    body:
      "Waspadai longsor susulan saat hujan. Ikuti instruksi petugas dan jangan kembali sebelum area dinyatakan aman. Hubungi BPBD atau 112 bila ada korban.",
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
            Ringkasan langkah BNPB untuk menghadapi tanah longsor dan gerakan tanah.
          </p>
        </div>
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

        <div className="border-t border-border/60 pt-4 text-[11px] text-muted-foreground sm:text-right">
          <a
            href="https://bnpb.go.id"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Sumber: BNPB — Tanggap Tangkas Tangguh Menghadapi Bencana (2019), hlm. 40–44
          </a>
        </div>
      </div>
    </section>
  )
}
