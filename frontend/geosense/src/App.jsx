import Header from "@/components/layout/Header"
import HeroSection from "@/components/dashboard/HeroSection"
import LiveMap from "@/components/dashboard/LiveMap"
import VibrationChart from "@/components/dashboard/VibrationChart"
import Footer from "@/components/layout/Footer"

export default function App() {
  return (
    <div className="min-h-screen bg-brand-bg">

      <Header />

      <main className="mx-auto max-w-7xl px-6 pt-36 pb-10">

        <HeroSection />

        <section className="mt-8 grid gap-6 lg:grid-cols-12">

          <div className="lg:col-span-7">
            <LiveMap />
          </div>

          <div className="lg:col-span-5">
            <VibrationChart />
          </div>

        </section>

      </main>

      <Footer />

    </div>
  )
}