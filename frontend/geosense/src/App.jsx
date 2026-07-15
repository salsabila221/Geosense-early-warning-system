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
    <div className="min-h-screen bg-brand-bg">
      
      <Header 
        isLoggedIn={isLoggedIn} 
        isAdmin={isAdmin} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />

      <main className="mx-auto max-w-7xl px-6 pt-36 pb-10">
        <HeroSection />

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          
          {/* DI SINI PERBAIKANNYA: Wajib oper data isAdmin ke LiveMap */}
          <div className={isAdmin ? "lg:col-span-7" : "lg:col-span-12"}>
            <LiveMap isAdmin={isAdmin} />
          </div>

          {/* Grafik getaran otomatis muncul berdampingan saat login Admin sukses */}
          {isAdmin && (
            <div className="lg:col-span-5">
              <VibrationChart />
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  )
}