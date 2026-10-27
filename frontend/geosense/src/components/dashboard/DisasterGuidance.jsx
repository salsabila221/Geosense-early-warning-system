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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    <section id="panduan" className="mt-8 scroll-mt-32 space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          Panduan Tanggap Bencana
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Ringkasan langkah BNPB untuk menghadapi tanah longsor dan gerakan tanah.
        </p>
      </div>

      <Alert className={`${meta.panelBg} ${meta.panelText}`}>
        <StatusIcon style={{ color: meta.badgeColor }} aria-hidden="true" />
        <AlertTitle className={`text-[11px] font-bold uppercase tracking-wider ${meta.panelText}`}>
          Rekomendasi saat status {meta.label}
        </AlertTitle>
        <AlertDescription className={`text-sm leading-relaxed ${meta.panelText}`}>
          {meta.guidance}
        </AlertDescription>
      </Alert>

      <div className="feature-grid grid gap-x-8 gap-y-6 pt-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <article key={step.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="break-words text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </article>
          )
        })}
      </div>

      <div className="text-[11px] text-muted-foreground sm:text-right">
        <a
          href="https://bnpb.go.id"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          Sumber: BNPB, Tanggap Tangkas Tangguh Menghadapi Bencana (2019), hlm. 40-44
        </a>
      </div>
    </section>
  )
}
