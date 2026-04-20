import { useState, useEffect } from 'react'

interface IOSDeviceInfo {
  isIOS: boolean
  isIPhone: boolean
  isIPad: boolean
  isStandalone: boolean
  safeAreaTop: number
}

/**
 * Hook to detect iOS devices and PWA status
 * Used for iOS-specific styling and safe area handling
 */
export function useIOSDetection(): IOSDeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<IOSDeviceInfo>({
    isIOS: false,
    isIPhone: false,
    isIPad: false,
    isStandalone: false,
    safeAreaTop: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectIOS = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isIPhone = /iphone/.test(userAgent)
      const isIPad = /ipad/.test(userAgent)
      
      // Check if running in standalone PWA mode
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isStandalone = isStandaloneMedia || isIOSStandalone
      
      // For iOS PWA in standalone mode, status bar height is typically 44-47px
      // We'll use 47px as the default, which covers most iOS devices
      // The CSS will handle env(safe-area-inset-top) for devices with notches
      const safeAreaTop = isIOS && isStandalone ? 47 : 0

      setDeviceInfo({
        isIOS,
        isIPhone,
        isIPad,
        isStandalone,
        safeAreaTop
      })
    }

    detectIOS()
    window.addEventListener('resize', detectIOS)
    window.addEventListener('orientationchange', detectIOS)

    return () => {
      window.removeEventListener('resize', detectIOS)
      window.removeEventListener('orientationchange', detectIOS)
    }
  }, [])

  return deviceInfo
}

