'use client'

import { logger } from '@/lib/logger'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useEffect, useState } from 'react'

export function SpeedInsightsWrapper() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only render in production and on client side
  if (!isClient || process.env.NODE_ENV !== 'production') {
    return null
  }

  try {
    return <SpeedInsights />
  } catch (error) {
    logger.warn('SpeedInsights failed to load:', error)
    return null
  }
}
