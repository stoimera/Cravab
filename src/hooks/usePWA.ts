import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Register service worker only if not in development with ngrok
    const isNgrok = window.location.hostname.includes('ngrok')
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if ('serviceWorker' in navigator && !(isDevelopment && isNgrok)) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          // Service Worker registered successfully
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error)
        })
    }

    // Check if app is already installed
    // Method 1: CSS media query (works for Android and modern iOS)
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    
    // Method 2: iOS Safari standalone mode (legacy but still needed)
    const isIOSStandalone = (window.navigator as any).standalone === true
    
    // Method 3: Check if running in standalone mode via window.matchMedia or user agent
    const isStandalone = isStandaloneMedia || isIOSStandalone
    
    if (isStandalone) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      // PWA was installed
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        // User accepted the install prompt
        logger.debug('PWA install accepted')
      } else {
        // User dismissed the install prompt
        logger.debug('PWA install dismissed')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowInstallPrompt(false)
    } catch (error) {
      logger.error('Error installing PWA:', error)
    }
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
  }

  return {
    isInstallable,
    isInstalled,
    showInstallPrompt,
    installApp,
    dismissInstallPrompt
  }
}
