import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function HeroSection() {
  return (
    <section className="mb-8">
      <Card className="rounded-xl border border-brand-border bg-white shadow-sm">
        <CardContent className="flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT */}
          <div className="max-w-2xl">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary">
              Geosense Monitoring Dashboard
            </p>

            <h2 className="text-3xl font-bold leading-tight text-brand-dark lg:text-4xl">
              Early Warning System
              <br />
              for Landslide Monitoring
            </h2>

            <p className="mt-4 text-base leading-7 text-brand-secondary">
              Sistem pemantauan kondisi tanah secara real-time berbasis sensor
              LoRa untuk mendeteksi potensi pergeseran tanah dan memberikan
              peringatan dini.
            </p>

          </div>

          {/* RIGHT */}
          <div className="w-full max-w-[300px] rounded-xl border border-[#B8DCC7] bg-[#ECF8F1] p-6">

            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#3D8B68]">
              Status Sistem
            </p>

            <div className="mt-4 flex justify-center">
              <Badge className="bg-[#3D8B68] px-6 py-1.5 text-sm text-white hover:bg-[#3D8B68]">
                AMAN
              </Badge>
            </div>

            <p className="mt-4 text-center text-sm leading-6 text-[#4E6E60]">
              Seluruh node sensor beroperasi normal.
            </p>

            <div className="my-5 border-t border-[#B8DCC7]" />

            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#5F8A74]">
                Last Update
              </p>

              <p className="mt-1 text-sm font-semibold text-[#2E5E49]">
                14 Juli 2026 • 12:40 WIB
              </p>
            </div>

          </div>

        </CardContent>
      </Card>
    </section>
  )
}