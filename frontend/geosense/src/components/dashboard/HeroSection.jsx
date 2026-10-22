import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getStatusMeta } from "@/lib/status"

export default function HeroSection({ status = "Aman", lastUpdated, roleLabel = "Monitoring Dashboard" }) {
  const meta = getStatusMeta(status)

  return (
    <section id="dashboard" className="mb-8 scroll-mt-32">
      <div className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#D9DCD6]/30 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        
        {/* LEFT TEXT */}
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#81C3D7]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#2F6690] sm:text-xs">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {roleLabel}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[#16425B] sm:text-3xl md:text-4xl lg:text-5xl">
            Sistem Peringatan Dini <br />
            <span className="text-lg font-semibold text-[#3A7CA5] sm:text-2xl md:text-3xl">Pergeseran & Pergerakan Tanah</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#16425B]/80 sm:text-base">
            Pemantauan kondisi kestabilan tanah secara real-time berbasis jaringan sensor telemetri 
            untuk mendeteksi potensi tanah longsor dan mendistribusikan peringatan dini secara cepat.
          </p>
        </div>

        {/* RIGHT STATUS */}
        <div className={`flex min-h-[160px] w-full flex-col justify-between rounded-xl border-2 p-4 transition-all duration-300 sm:p-5 lg:max-w-xs ${meta.cardBg}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-widest ${meta.textColor}`}>
                Status Sistem
              </span>
              <Badge
                className={`pointer-events-none rounded-md px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md ${meta.badgeBg}`}
                style={{ backgroundColor: meta.badgeColor }}
              >
                {meta.label}
              </Badge>
            </div>
            <p className={`mt-3 text-xs font-medium leading-relaxed ${meta.descColor}`}>
              {meta.description}
            </p>
          </div>
          
          {/* Bagian Pembaruan Terakhir sekarang merender data prop yang dinamis */}
          <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-3 text-[11px] ${meta.borderTop}`}>
            <span className={`font-bold uppercase tracking-wider ${meta.textColor}/60`}>Pembaruan Terakhir</span>
            <span className={`font-bold text-right ${meta.textColor}`}>{lastUpdated}</span>
          </div>
        </div>

      </div>
    </section>
  )
}
