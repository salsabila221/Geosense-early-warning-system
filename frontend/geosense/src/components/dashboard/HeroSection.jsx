import { Badge } from "@/components/ui/badge"

export default function HeroSection({ status = "Aman", lastUpdated }) {
  const getStatusConfig = () => {
    switch (status) {
      case "Siaga":
        return {
          cardBg: "bg-amber-50/90 border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.15)]",
          textColor: "text-amber-800",
          descColor: "text-amber-950/80",
          badgeBg: "bg-amber-500",
          borderTop: "border-amber-200",
          description: "Waspada! Terdeteksi peningkatan getaran mikro frekuensi rendah pada struktur tanah."
        }
      case "Warning":
        return {
          cardBg: "bg-red-50/90 border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.15)]",
          textColor: "text-red-800",
          descColor: "text-red-950/80",
          badgeBg: "bg-red-600 animate-pulse",
          borderTop: "border-red-200",
          description: "🚨 BAHAYA! Pergeseran tanah masif terdeteksi. Sinyal darurat dikirim otomatis ke Telegram."
        }
      default: // "Aman"
        return {
          cardBg: "bg-emerald-50/90 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
          textColor: "text-emerald-800",
          descColor: "text-emerald-900/80",
          badgeBg: "bg-emerald-600",
          borderTop: "border-emerald-200",
          description: "Seluruh infrastruktur node sensor telemetri beroperasi normal tanpa anomali."
        }
    }
  }

  const config = getStatusConfig()

  return (
    <section className="mb-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 lg:p-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between border border-[#D9DCD6]/30">
        
        {/* LEFT TEXT */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#81C3D7]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#2F6690]">
            Monitoring Dashboard
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#16425B] sm:text-4xl leading-tight">
            Sistem Peringatan Dini <br />
            <span className="text-[#3A7CA5] font-semibold text-2xl sm:text-3xl">Pergeseran & Pergerakan Tanah</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#16425B]/70">
            Pemantauan kondisi kestabilan tanah secara real-time berbasis jaringan sensor telemetri 
            untuk mendeteksi potensi tanah longsor dan mendistribusikan peringatan dini secara cepat.
          </p>
        </div>

        {/* RIGHT STATUS */}
        <div className={`w-full lg:max-w-xs rounded-xl p-5 border-2 transition-all duration-300 flex flex-col justify-between min-h-[160px] ${config.cardBg}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-widest ${config.textColor}`}>
                Status Sistem
              </span>
              <Badge className={`px-4 py-1 text-xs font-bold text-white uppercase tracking-wider rounded-md shadow-md pointer-events-none transition-colors ${config.badgeBg}`}>
                {status}
              </Badge>
            </div>
            <p className={`mt-3 text-xs font-medium leading-relaxed ${config.descColor}`}>
              {config.description}
            </p>
          </div>
          
          {/* Bagian Pembaruan Terakhir sekarang merender data prop yang dinamis */}
          <div className={`mt-5 pt-4 border-t flex items-center justify-between text-[11px] ${config.borderTop}`}>
            <span className={`font-bold uppercase tracking-wider ${config.textColor}/60`}>Pembaruan Terakhir</span>
            <span className={`font-bold ${config.textColor}`}>{lastUpdated}</span>
          </div>
        </div>

      </div>
    </section>
  )
}