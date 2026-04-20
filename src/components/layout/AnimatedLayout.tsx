'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedLayoutProps {
  children: ReactNode
  activeTab?: string
  className?: string
}

export function AnimatedLayout({ children, activeTab, className }: AnimatedLayoutProps) {
  return (
    <div className={cn('h-full', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Sub-page transition wrapper
interface SubPageTransitionProps {
  children: ReactNode
  activePage?: string
  className?: string
}

export function SubPageTransition({ children, activePage, className }: SubPageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {activePage ? (
        <motion.div
          key={activePage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={cn('h-full', className)}
        >
          {children}
        </motion.div>
      ) : (
        <div className={cn('h-full', className)}>
          {children}
        </div>
      )}
    </AnimatePresence>
  )
}
