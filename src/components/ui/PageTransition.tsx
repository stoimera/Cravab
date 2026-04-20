'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

// Animation variants for different transition types
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth feel
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Staggered children animation
const staggerVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Mobile-optimized variants
const mobilePageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  
  // Detect if we're on mobile (you can enhance this with proper mobile detection)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  // Use mobile variants on mobile devices
  const variants = isMobile ? mobilePageVariants : pageVariants

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{
          willChange: 'transform, opacity'
        }}
      >
        <motion.div variants={staggerVariants}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Specialized page transition for modals and overlays
export function ModalTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
      style={{
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  )
}

// Slide transition for mobile bottom sheets
export function SlideUpTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
      style={{
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  )
}

// Fade transition for simple content changes
export function FadeTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }}
      className={className}
      style={{
        willChange: 'opacity'
      }}
    >
      {children}
    </motion.div>
  )
}