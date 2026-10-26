import { ArrowRight, BellRing, CircleCheck, LockKeyhole, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function NotificationCTA({ isLoggedIn, phoneNumber, onNavigate }) {
  if (isLoggedIn) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CircleCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-900">Nomor WhatsApp terdaftar</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80">
                Peringatan darurat otomatis dikirim ke nomor{" "}
                <span className="font-mono font-bold text-emerald-900">{phoneNumber || "terdaftar"}</span>{" "}
                saat status berubah menjadi Siaga atau Warning.
              </p>
            </div>
          </div>
          <Badge className="h-6 w-fit gap-1.5 bg-emerald-600 px-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-none">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            Terdaftar
          </Badge>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-dark to-brand-primary p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-balance text-sm font-bold sm:text-base">
              Dapatkan peringatan darurat via WhatsApp
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/75">
              Kamu sedang melihat mode tamu. Masuk atau daftar agar nomor WhatsApp kamu terdaftar dan menerima
              notifikasi otomatis saat status sistem berubah menjadi Siaga atau Warning.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          <Button
            variant="secondary"
            onClick={() => onNavigate("signup")}
            className="h-11 w-full rounded-xl bg-white px-4 text-xs font-bold uppercase tracking-wider text-brand-dark shadow-sm hover:bg-slate-100 md:w-auto"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Daftar dengan Google
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("login")}
            className="h-11 w-full rounded-xl border-white/30 bg-white/5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15 hover:text-white md:w-auto"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Masuk
          </Button>
        </div>
      </div>
    </section>
  )
}
