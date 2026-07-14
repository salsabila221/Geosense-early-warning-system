import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const date = time.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const clock = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] shadow-sm">

      <div className="bg-brand-dark text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-sm">

          <span>{date}</span>

          <span className="font-semibold text-brand-accent">
            {clock} WIB
          </span>

        </div>
      </div>

      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
              G
            </div>

            <div>
              <h1 className="text-xl font-bold text-brand-dark">
                Geosense
              </h1>

              <p className="text-sm text-brand-secondary">
                Early Warning System
              </p>
            </div>

          </div>

          <div className="flex gap-2">

            <Button
              variant="ghost"
              className="text-brand-dark hover:bg-brand-accent/20"
            >
              Sign Up
            </Button>

            <Button className="bg-brand-primary hover:bg-brand-secondary">
              Login
            </Button>

          </div>

        </div>
      </header>

    </div>
  )
}