'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedLayoutProps {
  children: ReactNode
  activeTab: string
  className?: string
  direction?: 'horizontal' | 'vertical'
  duration?: number
}

// Tab switching animation variants
const tabVariants = {
  initial: (direction: 'horizontal' | 'vertical') => ({
    opacity: 0,
    x: direction === 'horizontal' ? 20 : 0,
    y: direction === 'vertical' ? 20 : 0,
    scale: 0.95
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.05
    }
  },
  exit: (direction: 'horizontal' | 'vertical') => ({
    opacity: 0,
    x: direction === 'horizontal' ? -20 : 0,
    y: direction === 'vertical' ? -20 : 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
}

// Staggered children animation for content
const staggerVariants = {
  initial: {
    opacity: 0,
    y: 10
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Mobile-optimized variants
const mobileTabVariants = {
  initial: (direction: 'horizontal' | 'vertical') => ({
    opacity: 0,
    x: direction === 'horizontal' ? 15 : 0,
    y: direction === 'vertical' ? 15 : 0,
    scale: 0.97
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.03
    }
  },
  exit: (direction: 'horizontal' | 'vertical') => ({
    opacity: 0,
    x: direction === 'horizontal' ? -15 : 0,
    y: direction === 'vertical' ? -15 : 0,
    scale: 0.97,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
}

export function AnimatedLayout({ 
  children, 
  activeTab, 
  className = '',
  direction = 'horizontal',
  duration = 0.25
}: AnimatedLayoutProps) {
  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  // Use mobile variants on mobile devices
  const variants = isMobile ? mobileTabVariants : tabVariants

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeTab}
        custom={direction}
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

// Specialized layout for card grids
export function AnimatedGrid({ 
  children, 
  activeTab, 
  className = '',
  columns = 1
}: AnimatedLayoutProps & { columns?: number }) {
  const gridVariants = {
    initial: {
      opacity: 0,
      scale: 0.9
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeTab}
        variants={gridVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : columns === 3 ? 'md:grid-cols-3' : ''} gap-4 ${className}`}
        style={{
          willChange: 'transform, opacity'
        }}
      >
        {Array.isArray(children) ? children.map((child, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="w-full"
          >
            {child}
          </motion.div>
        )) : (
          <motion.div variants={itemVariants}>
            {children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// List layout with staggered animations
export function AnimatedList({ 
  children, 
  activeTab, 
  className = '',
  staggerDelay = 0.05
}: AnimatedLayoutProps & { staggerDelay?: number }) {
  const listVariants = {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.2,
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15
      }
    }
  }

  const itemVariants = {
    initial: {
      opacity: 0,
      x: -20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeTab}
        variants={listVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{
          willChange: 'transform, opacity'
        }}
      >
        {Array.isArray(children) ? children.map((child, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="w-full"
          >
            {child}
          </motion.div>
        )) : (
          <motion.div variants={itemVariants}>
            {children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
