import { useState, useEffect } from 'react'
import { usePWA } from './usePWA'

/**
 * Hook to detect if PWA is installed AND if device is mobile/touch
 * Used to conditionally show/hide UI elements (buttons) based on installation status
 */
export function usePWAInstallStatus() {
  const { isInstalled } = usePWA()
  const [isMobile, setIsMobile] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Check if device is mobile (screen width or user agent)
    const checkMobile = () => {
      const screenWidth = window.innerWidth
      const isMobileScreen = screenWidth < 768 // md breakpoint
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      setIsMobile(isMobileScreen || isMobileUA)
    }

    // Check if device supports touch
    const checkTouch = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsTouchDevice(hasTouchScreen)
    }

    // Initial check
    checkMobile()
    checkTouch()

    // Listen for window resize (orientation changes, etc.)
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // PWA is installed on mobile/touch device
  const isPWAInstalledOnMobile = isInstalled && (isMobile || isTouchDevice)
  
  // Show buttons when:
  // - PWA is NOT installed (web browser mode), OR
  // - PWA is installed but on desktop/non-touch device (unlikely but possible)
  // Hide buttons when:
  // - PWA is installed AND on mobile/touch device
  const showButtons = !isInstalled || (!isMobile && !isTouchDevice)

  return {
    isInstalled,
    isMobile,
    isTouchDevice,
    isPWAInstalledOnMobile,
    showButtons // Use this to conditionally render buttons
  }
}

