'use client'

import { useState, useEffect } from 'react'

interface AndroidDeviceInfo {
  isAndroid: boolean
  isChrome: boolean
  isSamsung: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  deviceType: 'android-xs' | 'android-sm' | 'android-md' | 'android-lg' | 'android-xl' | 'unknown'
  orientation: 'portrait' | 'landscape'
}

export function useAndroidDetection(): AndroidDeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<AndroidDeviceInfo>({
    isAndroid: false,
    isChrome: false,
    isSamsung: false,
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    deviceType: 'unknown',
    orientation: 'portrait'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isAndroid = /android/.test(userAgent)
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)
      const isSamsung = /samsung/.test(userAgent) || /sm-/.test(userAgent)
      
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const pixelRatio = window.devicePixelRatio || 1
      
      // Determine device type based on screen width
      let deviceType: AndroidDeviceInfo['deviceType'] = 'unknown'
      if (screenWidth <= 360) {
        deviceType = 'android-xs'
      } else if (screenWidth <= 375) {
        deviceType = 'android-sm'
      } else if (screenWidth <= 414) {
        deviceType = 'android-md'
      } else if (screenWidth <= 480) {
        deviceType = 'android-lg'
      } else if (screenWidth <= 600) {
        deviceType = 'android-xl'
      }
      
      const orientation = screenHeight > screenWidth ? 'portrait' : 'landscape'

      setDeviceInfo({
        isAndroid,
        isChrome,
        isSamsung,
        screenWidth,
        screenHeight,
        pixelRatio,
        deviceType,
        orientation
      })
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  return deviceInfo
}

// Utility function to get Android-specific classes
export function getAndroidClasses(deviceInfo: AndroidDeviceInfo, baseClasses: string = '') {
  const classes = [baseClasses]
  
  if (deviceInfo.isAndroid) {
    // Add device-specific classes
    if (deviceInfo.deviceType !== 'unknown') {
      classes.push(deviceInfo.deviceType)
    }
    
    // Add density-specific classes
    if (deviceInfo.pixelRatio >= 3) {
      classes.push('android-uhd')
    } else if (deviceInfo.pixelRatio >= 2) {
      classes.push('android-hd')
    }
    
    // Add orientation-specific classes
    if (deviceInfo.orientation === 'landscape') {
      classes.push('android-landscape')
      if (deviceInfo.screenWidth <= 640) {
        classes.push('android-landscape-xs')
      }
    }
    
    // Add browser-specific classes
    if (deviceInfo.isChrome) {
      classes.push('android-chrome')
    }
    
    if (deviceInfo.isSamsung) {
      classes.push('android-samsung')
    }
  }
  
  return classes.join(' ')
}
