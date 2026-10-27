import { useState } from "react"
import { ArrowLeft, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// 1. IMPORT LIBRARY GOOGLE AUTH RESMI
import { GoogleLogin } from "@react-oauth/google"
import { apiFetch } from "@/lib/api"

// Nomor WhatsApp Indonesia: 08xx / 8xx / +628xx / 628xx -> 628xx
const normalizePhone = (raw) => {
  const digits = (raw || "").replace(/\D/g, "")
  if (digits.startsWith("0")) return `62${digits.slice(1)}`
  if (digits.startsWith("8")) return `62${digits}`
  return digits
}

const isValidPhone = (raw) => /^628[1-9]\d{6,11}$/.test(normalizePhone(raw))

export default function AuthPage({ onLoginSuccess, initialTab = "login", onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState(initialTab) 
  const [chooseAdmin, setChooseAdmin] = useState(false) // false = User, true = Admin

  // State Manajemen Google Login Flow
  const [isOnboarding, setIsOnboarding] = useState(false) 
  const [googleUser, setGoogleUser] = useState({ name: "", email: "" }) 
  const [googleCredential, setGoogleCredential] = useState("") // ID token Google, dipakai ulang saat simpan onboarding
  const [phoneOnboarding, setPhoneOnboarding] = useState("")
  const [fullnameOnboarding, setFullnameOnboarding] = useState("")

  
  // 1. LOGIN MANUAL (EMAIL + PASSWORD)
  const handleLogin = (e) => {
    e.preventDefault()
    // Mengirimkan status role dan nama dummy default untuk login manual
    onLoginSuccess(chooseAdmin, chooseAdmin ? "Admin Geosense" : "User Manual")
  }

  // 2. SIGN UP MANUAL
  const handleSignUp = (e) => {
    e.preventDefault()
    alert(
      'Pendaftaran manual belum tersedia. Silakan gunakan tombol "Daftar dengan Google" di bawah. Setelah itu, Anda akan diminta melengkapi nama lengkap dan nomor WhatsApp.'
    )
  }

  // 3. HANDLER GOOGLE LOGIN REAL (DIPANGGIL SAAT GOOGLE BERHASIL AUTH)
  const handleGoogleSuccess = async (credentialResponse) => {
    const tokenDariGoogle = credentialResponse.credential
    setGoogleCredential(tokenDariGoogle)

    try {
      // Kirim ID Token mentah ke backend FastAPI untuk diverifikasi & cek database
      const { ok, data: result } = await apiFetch("/api/auth/google", {
        method: "POST",
        body: { credential: tokenDariGoogle },
        auth: false,
      })

      if (!ok) {
        alert(result?.detail || "Gagal verifikasi akun Google.")
        return
      }

      if (result.is_new_user) {
        // --- KONDISI A: EMAIL BELUM ADA DI DATABASE (WARGA BARU) ---
        setGoogleUser({ email: result.email, name: result.name })
        setFullnameOnboarding(result.name || "") // Isi otomatis nama dari Google
        setIsOnboarding(true) // Alihkan ke layar isi nomor HP
      } else {
        // --- KONDISI B: USER LAMA ATAU ADMIN ---
        onLoginSuccess(result.is_admin, result.name, result.access_token, result.user?.phone_number)
      }
    } catch (err) {
      console.error("Gagal koneksi ke backend:", err)
      alert("Gagal terhubung ke server backend FastAPI. Pastikan backend sudah menyala di localhost:8000!")
    }
  }

  // 4. FUNGSI MENYIMPAN DATA ONBOARDING KE DATABASE BACKEND
  const handleCompleteOnboarding = async (e) => {
    e.preventDefault()

    if (!googleCredential) {
      alert("Sesi Google sudah tidak berlaku. Silakan login ulang dengan Google.")
      setIsOnboarding(false)
      return
    }

    if (fullnameOnboarding.trim().length < 2) {
      alert("Nama lengkap wajib diisi (minimal 2 karakter).")
      return
    }

    if (!isValidPhone(phoneOnboarding)) {
      alert("Nomor WhatsApp tidak valid. Contoh: 08123456789 atau +628123456789.")
      return
    }

    try {
      // Kirim data lengkap ke backend untuk di-INSERT ke tabel 'users'
      const { ok, data: result } = await apiFetch("/api/auth/google/register", {
        method: "POST",
        body: {
          credential: googleCredential,
          fullname: fullnameOnboarding,
          phone_number: phoneOnboarding,
        },
        auth: false,
      })

      if (ok) {
        alert("Pendaftaran berhasil! Akun Anda sudah tersimpan di database GeoSense.")
        setIsOnboarding(false)
        onLoginSuccess(
          result.user?.is_admin ?? false,
          result.user?.fullname || fullnameOnboarding,
          result.access_token,
          result.user?.phone_number
        )
      } else {
        alert(result?.detail || "Gagal menyimpan data pendaftaran.")
      }
    } catch (err) {
      console.error("Gagal menyimpan onboarding:", err)
      alert("Terjadi kesalahan jaringan saat mendaftarkan data.")
    }
  }

  // ==================== TAMPILAN KHUSUS: ONBOARDING GOOGLE (USER BARU) ====================
  if (isOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] font-sans text-[#16425B] antialiased px-4 py-12">
        <Card className="w-full max-w-md border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="flex items-center justify-center gap-2 text-xl font-extrabold tracking-tight text-[#16425B]">
              <UserRound className="h-5 w-5 text-[#3A7CA5]" aria-hidden="true" />
              Sedikit Lagi
            </CardTitle>
            <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[320px] mx-auto leading-relaxed">
              Akun Google <span className="font-semibold text-[#16425B]">{googleUser.email}</span> berhasil ditautkan. Isi nama lengkap dan nomor WhatsApp aktif Anda. Nomor ini digunakan untuk mengirim peringatan darurat.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ob-name" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nama Lengkap</Label>
                <Input 
                  id="ob-name" 
                  type="text" 
                  value={fullnameOnboarding}
                  onChange={(e) => setFullnameOnboarding(e.target.value)}
                  className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] text-sm py-5" 
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="ob-phone" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nomor WhatsApp</Label>
                <Input 
                  id="ob-phone" 
                  type="tel" 
                  inputMode="tel"
                  value={phoneOnboarding}
                  onChange={(e) => setPhoneOnboarding(e.target.value)}
                  className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                  placeholder="08123456789" 
                  required 
                />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Nomor ini dipakai untuk <span className="font-semibold text-[#2F6690]">notifikasi darurat via WhatsApp</span>. Pastikan aktif dan terdaftar di WhatsApp.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboarding(false)}
                  className="min-h-11 w-full rounded-xl border-[#D9DCD6]/60 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors sm:w-1/3"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="min-h-11 w-full rounded-xl border-none bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 sm:w-2/3"
                >
                  Selesaikan Pendaftaran
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== TAMPILAN UTAMA (LOGIN / SIGN UP STANDARD) ====================
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] font-sans text-[#16425B] antialiased px-4 py-12">
      <Card className="w-full max-w-md border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
        
        {/* TAB NAVIGATION */}
        <div className="grid grid-cols-2 border-b border-[#D9DCD6]/40 text-center bg-slate-50/50">
          <button
            onClick={() => setActiveTab("login")}
            className={`min-h-11 py-3 text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "login"
                ? "border-b-2 border-[#3A7CA5] text-[#16425B] bg-white"
                : "text-[#3A7CA5] hover:text-[#16425B] hover:bg-slate-50"
            }`}
          >
            Masuk (Login)
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`min-h-11 py-3 text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "signup"
                ? "border-b-2 border-[#3A7CA5] text-[#16425B] bg-white"
                : "text-[#3A7CA5] hover:text-[#16425B] hover:bg-slate-50"
            }`}
          >
            Daftar (Sign Up)
          </button>
        </div>

        {/* 1. TAMPILAN LOGIN */}
        {activeTab === "login" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-[#16425B]">
                Selamat Datang
              </CardTitle>
              <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[280px] mx-auto leading-relaxed">
                Masukkan email dan password untuk mengakses visualisasi data dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-4">
              
              {/* BUTTON PILIHAN ROLE (USER / ADMIN) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F6F8] rounded-xl border border-[#D9DCD6]/40">
                <button
                  type="button"
                  onClick={() => setChooseAdmin(false)}
                  className={`min-h-11 rounded-lg border-none py-2 text-xs font-bold tracking-wide transition-all ${
                    !chooseAdmin
                      ? "bg-[#3A7CA5] text-white shadow-sm"
                      : "text-[#3A7CA5] hover:text-[#16425B]"
                  }`}
                >
                  Sebagai User
                </button>
                <button
                  type="button"
                  onClick={() => setChooseAdmin(true)}
                  className={`min-h-11 rounded-lg border-none py-2 text-xs font-bold tracking-wide transition-all ${
                    chooseAdmin
                      ? "bg-[#16425B] text-white shadow-sm"
                      : "text-[#3A7CA5] hover:text-[#16425B]"
                  }`}
                >
                  Sebagai Admin
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className={`mt-4 min-h-11 w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all ${
                    chooseAdmin 
                      ? "bg-[#16425B] hover:bg-[#16425B]/90 shadow-[#16425B]/10" 
                      : "bg-[#3A7CA5] hover:bg-[#2F6690] shadow-[#3A7CA5]/10"
                  }`}
                >
                  Masuk sebagai {chooseAdmin ? "Admin" : "User"}
                </Button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-[#3A7CA5]/60">
                <div className="absolute w-full border-t border-[#D9DCD6]/40"></div>
                <span className="relative bg-white px-3">atau</span>
              </div>

              {/* 2. REAL GOOGLE LOGIN BUTTON */}
              <div className="flex justify-center w-full my-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Autentikasi Google gagal.")}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* 2. TAMPILAN SIGN UP (KHUSUS USER) */}
        {activeTab === "signup" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-[#16425B]">
                Buat Akun Baru
              </CardTitle>
              <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[280px] mx-auto leading-relaxed">
                Pendaftaran khusus untuk Akun Monitor (User) sistem kebencanaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nama Lengkap</Label>
                  <Input 
                    id="fullname" 
                    type="text" 
                    placeholder="Nama Lengkap Anda" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nomor WhatsApp</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel" 
                    inputMode="tel"
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    placeholder="08123456789" 
                    required 
                  />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Dipakai untuk mengirim <span className="font-semibold text-[#2F6690]">notifikasi darurat via WhatsApp</span>.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="mt-6 min-h-11 w-full rounded-xl bg-[#3A7CA5] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#3A7CA5]/10 hover:bg-[#2F6690]"
                >
                  Daftar Akun
                </Button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-[#3A7CA5]/60">
                <div className="absolute w-full border-t border-[#D9DCD6]/40"></div>
                <span className="relative bg-white px-3">atau</span>
              </div>

              {/* 3. REAL GOOGLE SIGN UP BUTTON */}
              <div className="flex justify-center w-full my-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Autentikasi Google gagal.")}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </CardContent>
          </>
        )}
        
        {/* FOOTER */}
        <div className="text-center pb-6 pt-4 bg-slate-50/30 border-t border-[#D9DCD6]/20">
          <button 
            onClick={onBackToDashboard} 
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border-none bg-transparent px-3 text-xs font-bold tracking-wide text-[#3A7CA5] underline underline-offset-4 transition-colors hover:text-[#16425B]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Kembali ke Dashboard Utama
          </button>
        </div>

      </Card>
    </div>
  )
}