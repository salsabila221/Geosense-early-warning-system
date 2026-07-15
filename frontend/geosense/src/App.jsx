import { useState } from "react"
import Header from "@/components/layout/Header"
import HeroSection from "@/components/dashboard/HeroSection"
import LiveMap from "@/components/dashboard/LiveMap"
import VibrationChart from "@/components/dashboard/VibrationChart"
import Footer from "@/components/layout/Footer"
import AuthPage from "@/components/auth/AuthPage"

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState("dashboard")

  const handleLoginSuccess = (roleIsAdmin) => {
    setIsAdmin(roleIsAdmin)
    setIsLoggedIn(true)
    setCurrentPage("dashboard")
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setIsLoggedIn(false)
    setCurrentPage("dashboard")
  }

  if (currentPage === "login" || currentPage === "signup") {
    return (
      <AuthPage 
        initialTab={currentPage} 
        onLoginSuccess={handleLoginSuccess}
        onBackToDashboard={() => setCurrentPage("dashboard")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-[#16425B] antialiased selection:bg-[#81C3D7]/30">
      
      <Header 
        isLoggedIn={isLoggedIn} 
        isAdmin={isAdmin} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-36 pb-12">
        <HeroSection />

        {/* items-stretch memaksa semua col-span di dalamnya memiliki tinggi bawah yang sama rata */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12 items-stretch">
          
          <div className={isAdmin ? "lg:col-span-7 flex flex-col" : "lg:col-span-12 flex flex-col"}>
            <LiveMap isAdmin={isAdmin} />
          </div>

          {/* Grafik HANYA muncul jika login sebagai Admin */}
          {isAdmin && (
            <div className="lg:col-span-5 flex flex-col">
              <VibrationChart />
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  )
}