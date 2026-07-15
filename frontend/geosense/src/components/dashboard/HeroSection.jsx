import { Badge } from "@/components/ui/badge"

export default function HeroSection() {
  return (
    <section className="mb-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 lg:p-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between border border-[#D9DCD6]/30">
        
        {/* LEFT TEXT */}
        <div className="max-w-2xl">
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#16425B] sm:text-4xl leading-tight">
            Sistem Peringatan Dini <br />
            <span className="text-[#3A7CA5] font-semibold text-2xl sm:text-3xl">Pergeseran & Pergerakan Tanah</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#16425B]/70">
            Pemantauan kondisi kestabilan tanah secara real-time berbasis jaringan sensor telemetri 
            untuk mendeteksi potensi tanah longsor dan mendistribusikan peringatan dini secara cepat.
          </p>
        </div>

        {/* RIGHT STATUS - Ditonjolkan dengan border tebal dan efek Glow */}
        <div className="w-full lg:max-w-xs rounded-xl bg-emerald-50/90 p-5 border-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)] flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                Status Sistem
              </span>
              <Badge className="bg-emerald-600 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider rounded-md shadow-md pointer-events-none">
                Aman
              </Badge>
            </div>
            <p className="mt-3 text-xs font-medium leading-relaxed text-emerald-900/80">
              Seluruh infrastruktur node sensor telemetri beroperasi normal tanpa anomali.
            </p>
          </div>
          
          <div className="mt-5 pt-4 border-t border-emerald-200 flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-emerald-800/60">Pembaruan Terakhir</span>
            <span className="font-bold text-emerald-950">14 Juli 2026 • 12:40 WIB</span>
          </div>
        </div>

      </div>
    </section>
  )
}