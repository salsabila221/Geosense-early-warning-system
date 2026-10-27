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
    <section className="mt-6 rounded-2xl border border-border/70 bg-secondary/60 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-dark text-white">
            {canInstall ? (
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Share className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Pasang GeoSense di perangkat</p>
            {canInstall ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Akses lebih cepat dari layar utama, tampil seperti aplikasi, dan tetap dapat membuka
                dashboard saat koneksi buruk.
              </p>
            ) : isIos ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Di Safari, buka menu <span className="font-semibold">Bagikan</span> lalu pilih{" "}
                <span className="font-semibold">Tambahkan ke Layar Utama</span> untuk memasang GeoSense
                sebagai aplikasi.
              </p>
            ) : (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
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
              className="h-11 flex-1 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 md:flex-none"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Install
            </Button>
          )}
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Tutup pengingat install"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
