'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { FloatingCard } from '@/components/ui/AnimatedCard'
import { AnimatedLayout } from './AnimatedLayout'
import { motion } from 'framer-motion'
import { useAndroidDetection, getAndroidClasses } from '@/hooks/useAndroidDetection'
import { useIOSDetection } from '@/hooks/useIOSDetection'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  activeTab?: 'calls' | 'clients' | 'appointments' | 'reports' | 'more'
  title?: string
  actions?: React.ReactNode
  showBackButton?: boolean
  tabs?: React.ReactNode
  addButton?: {
    label: string
    onClick: () => void
  }
}

export function ResponsiveLayout({ children, activeTab, title, actions, showBackButton = false, tabs, addButton }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)
  const router = useRouter()
  const androidInfo = useAndroidDetection()
  const iosInfo = useIOSDetection()

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width < 1024) // lg breakpoint
      setScreenHeight(height)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AnimatedLayout activeTab={activeTab}>
        <div className={getAndroidClasses(androidInfo, "pb-20 sm:pb-24 md:pb-32 safe-area-pb")}>
          {/* Header - Full width with bottom border */}
          {/* safe-area-pt adds padding-top for iOS status bar clearance in PWA mode */}
          <div 
            className={getAndroidClasses(androidInfo, "w-full px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200 bg-white safe-area-pt ios-header-fix")}
            style={iosInfo.isIOS && iosInfo.isStandalone ? {
              paddingTop: `${Math.max(iosInfo.safeAreaTop || 47, 47)}px`
            } : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground font-inter truncate">
                  {title || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {tabs && tabs}
                {addButton && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={addButton.onClick}
                    className="flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 transition-all duration-200 bg-transparent border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm interactive whitespace-nowrap"
                  >
                    <span className="text-sm sm:text-lg leading-none">+</span>
                    <span className="hidden xs:inline">{addButton.label}</span>
                    <span className="xs:hidden">Add</span>
                  </motion.button>
                )}
                {actions && actions}
                {showBackButton && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 transition-all duration-200 bg-transparent border-none p-1.5 sm:p-2 rounded-lg font-medium text-xs sm:text-sm interactive"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Back</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-3 sm:px-4 mt-2 sm:mt-4">
            {children}
          </div>
        </div>
        <BottomNav activeTab={activeTab || 'calls'} />
      </AnimatedLayout>
    </div>
  )
}
