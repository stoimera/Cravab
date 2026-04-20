'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { usePullToRefreshGesture } from '@/lib/gestures/gesture-recognition'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  resistance?: number
  className?: string
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80, 
  resistance = 0.5,
  className = ''
}: PullToRefreshProps) {
  const { y, isRefreshing, progress, canRefresh, pullToRefreshHandlers } = usePullToRefreshGesture({
    onRefresh,
    threshold,
    resistance
  })

  const opacity = useTransform(y, [0, threshold], [0, 1])
  const scale = useTransform(y, [0, threshold], [0.8, 1])
  const rotate = useTransform(y, [0, threshold * 2], [0, 180])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-gray-50 border-b border-gray-200"
        style={{ 
          y: useTransform(y, [0, threshold], [-100, 0]),
          opacity 
        }}
      >
        <motion.div
          className="flex items-center gap-2 text-gray-600"
          style={{ scale }}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Refreshing...</span>
            </>
          ) : (
            <>
              <motion.div
                style={{ rotate }}
                className={canRefresh ? 'text-blue-600' : 'text-gray-400'}
              >
                <ArrowDown className="w-5 h-5" />
              </motion.div>
              <span className="text-sm font-medium">
                {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        {...pullToRefreshHandlers}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  )
}
