import { useCallback, useEffect, useState } from "react"
import { isStandalone } from "@/lib/push"

const DISMISS_KEY = "geosense_install_dismissed"

function detectIos() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export default function usePWA() {
  const [installEvent, setInstallEvent] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandalone())
  const [isIos] = useState(detectIos)
  const [supportsInstallPrompt] = useState(
    () => typeof window !== "undefined" && "onbeforeinstallprompt" in window
  )
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleDisplayMode = () => setIsInstalled(isStandalone())

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleInstalled)
    mediaQuery.addEventListener?.("change", handleDisplayMode)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleInstalled)
      mediaQuery.removeEventListener?.("change", handleDisplayMode)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installEvent) return false
    installEvent.prompt()
    const choice = await installEvent.userChoice
    setInstallEvent(null)
    return choice?.outcome === "accepted"
  }, [installEvent])

  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* abaikan */
    }
    setIsDismissed(true)
  }, [])

  return {
    canInstall: Boolean(installEvent) && !isInstalled,
    supportsInstallPrompt,
    isInstalled,
    isIos,
    isDismissed,
    promptInstall,
    dismissInstall,
  }
}
