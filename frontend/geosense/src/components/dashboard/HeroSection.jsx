import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getStatusMeta } from "@/lib/status"

export default function HeroSection({ status = "Aman", lastUpdated, roleLabel = "Monitoring Dashboard" }) {
  const meta = getStatusMeta(status)

  return (
    <section id="dashboard" className="mb-8 scroll-mt-32">
      <div className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-8">
        {/* Teks utama */}
        <div className="min-w-0 max-w-2xl">
          <Badge
            variant="secondary"
            className="h-7 gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-primary"
          >
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {roleLabel}
          </Badge>

          <h2 className="mt-4 max-w-2xl text-balance text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Sistem Peringatan <span className="text-primary">Pergerakan Tanah</span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pemantauan kondisi kestabilan tanah secara real-time berbasis jaringan sensor telemetri
            untuk mendeteksi getaran dan pergerakan tanah, lalu mengirimkan peringatan setelah
            indikasi pergerakan terdeteksi.
          </p>
        </div>

        {/* Status sistem */}
        <Card className="w-full gap-0 border-border/70 py-0 shadow-sm lg:max-w-xs">
          <CardContent className="flex min-h-[160px] flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.badgeColor }}
                    aria-hidden="true"
                  />
                  Status Sistem
                </span>
                <Badge
                  className={`h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${meta.badgeBg}`}
                  style={{ backgroundColor: meta.badgeColor }}
                >
                  {meta.label}
                </Badge>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {meta.description}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-1 border-t border-border pt-4 text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Pembaruan Terakhir
              </span>
              <span className="font-semibold text-foreground">{lastUpdated}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
