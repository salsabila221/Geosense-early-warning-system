import { Download, Share, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import usePWA from "@/hooks/usePWA"

export default function InstallPrompt() {
  const {
    canInstall,
    supportsInstallPrompt,
    isInstalled,
    isIos,
    isDismissed,
    promptInstall,
    dismissInstall,
  } = usePWA()

  if (isInstalled || isDismissed) return null
  if (!canInstall && !isIos && !supportsInstallPrompt) return null

  return (
    <section className="mt-6 rounded-2xl border border-[#81C3D7]/40 bg-[#81C3D7]/10 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#16425B] text-white">
            {canInstall ? (
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Share className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-[#16425B]">Pasang GeoSense di perangkat</p>
            {canInstall ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#16425B]/80">
                Akses lebih cepat dari layar utama, tampil seperti aplikasi, dan tetap bisa membuka
                dashboard saat koneksi buruk.
              </p>
            ) : isIos ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#16425B]/80">
                Di Safari, buka menu <span className="font-semibold">Bagikan</span> lalu pilih{" "}
                <span className="font-semibold">Tambahkan ke Layar Utama</span> untuk memasang GeoSense
                sebagai aplikasi.
              </p>
            ) : (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#16425B]/80">
                Gunakan ikon <span className="font-semibold">Install</span> di address bar, atau menu
                browser lalu pilih <span className="font-semibold">Install app / Add to Home screen</span>.
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto md:flex-shrink-0">
          {canInstall && (
            <Button
              onClick={promptInstall}
              className="h-11 flex-1 rounded-xl bg-[#16425B] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2F6690] md:flex-none"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Install
            </Button>
          )}
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Tutup pengingat install"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#D9DCD6]/60 bg-white text-[#3A7CA5] transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
