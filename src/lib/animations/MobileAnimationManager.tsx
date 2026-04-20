'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// Animation types
export type SlideDirection = 'up' | 'down' | 'left' | 'right'
export type ScaleType = 'in' | 'out'
export type FadeType = 'in' | 'out'
export type GestureType = 'bounce' | 'shake' | 'pulse' | 'wiggle'

// Haptic feedback patterns
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

// Mobile Animation Manager Class
export class MobileAnimationManager {
  private static instance: MobileAnimationManager
  private isReducedMotion: boolean = false

  private constructor() {
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  public static getInstance(): MobileAnimationManager {
    if (!MobileAnimationManager.instance) {
      MobileAnimationManager.instance = new MobileAnimationManager()
    }
    return MobileAnimationManager.instance
  }

  // Haptic feedback
  public triggerHaptic(pattern: HapticPattern = 'light'): void {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 5, 10],
      warning: [20, 10, 20],
      error: [30, 10, 30]
    }

    navigator.vibrate(patterns[pattern])
  }

  // Check if reduced motion is enabled
  public shouldAnimate(): boolean {
    return !this.isReducedMotion
  }

  // Get animation variants based on type
  public getSlideVariants(direction: SlideDirection) {
    if (!this.shouldAnimate()) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    }

    const directions = {
      up: { y: '100%' },
      down: { y: '-100%' },
      left: { x: '100%' },
      right: { x: '-100%' }
    }

    return {
      initial: {
        opacity: 0,
        ...directions[direction]
      },
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      },
      exit: {
        opacity: 0,
        ...directions[direction],
        transition: {
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    }
  }

  public getScaleVariants(type: ScaleType) {
    if (!this.shouldAnimate()) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    }

    const scale = type === 'in' ? 0.8 : 1.2

    return {
      initial: {
        opacity: 0,
        scale
      },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      },
      exit: {
        opacity: 0,
        scale,
        transition: {
          duration: 0.15,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    }
  }

  public getFadeVariants(type: FadeType) {
    if (!this.shouldAnimate()) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    }

    return {
      initial: {
        opacity: 0
      },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.2,
          ease: 'easeInOut'
        }
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.15,
          ease: 'easeInOut'
        }
      }
    }
  }

  public getGestureVariants(type: GestureType) {
    if (!this.shouldAnimate()) {
      return {
        initial: {},
        animate: {},
        exit: {}
      }
    }

    const gestures = {
      bounce: {
        animate: {
          scale: [1, 1.1, 1],
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      },
      shake: {
        animate: {
          x: [0, -10, 10, -10, 10, 0],
          transition: {
            duration: 0.5,
            ease: 'easeInOut'
          }
        }
      },
      pulse: {
        animate: {
          scale: [1, 1.05, 1],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse' as const
          }
        }
      },
      wiggle: {
        animate: {
          rotate: [0, -5, 5, -5, 5, 0],
          transition: {
            duration: 0.4,
            ease: 'easeInOut'
          }
        }
      }
    }

    return gestures[type]
  }
}

// React Hook for Mobile Animations
export function useMobileAnimation() {
  const manager = MobileAnimationManager.getInstance()
  
  return {
    triggerHaptic: manager.triggerHaptic.bind(manager),
    shouldAnimate: manager.shouldAnimate.bind(manager),
    getSlideVariants: manager.getSlideVariants.bind(manager),
    getScaleVariants: manager.getScaleVariants.bind(manager),
    getFadeVariants: manager.getFadeVariants.bind(manager),
    getGestureVariants: manager.getGestureVariants.bind(manager)
  }
}

// Note: Swipe gestures are now in @/lib/gestures/gesture-recognition.ts

// Note: Pull to refresh gestures are now in @/lib/gestures/gesture-recognition.ts

// Mobile Modal Component
interface MobileModalProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  direction?: SlideDirection
  className?: string
}

export function MobileModal({ 
  children, 
  isOpen, 
  onClose, 
  direction = 'up',
  className = ''
}: MobileModalProps) {
  const { getSlideVariants, triggerHaptic } = useMobileAnimation()
  const variants = getSlideVariants(direction)

  const handleClose = () => {
    triggerHaptic('light')
    onClose()
  }

  return (
    <motion.div
      initial="initial"
      animate={isOpen ? 'animate' : 'exit'}
      variants={variants}
      className={`fixed inset-0 z-50 ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

// Bottom Sheet Component
interface BottomSheetProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function BottomSheet({ children, isOpen, onClose, className = '' }: BottomSheetProps) {
  const { triggerHaptic } = useMobileAnimation()

  const handleClose = () => {
    triggerHaptic('light')
    onClose()
  }

  return (
    <motion.div
      initial={false}
      animate={isOpen ? 'animate' : 'exit'}
      variants={{
        initial: { y: '100%', opacity: 0 },
        animate: { 
          y: 0, 
          opacity: 1,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        },
        exit: { 
          y: '100%', 
          opacity: 0,
          transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

// Floating Action Button Component
interface FloatingActionButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function FloatingActionButton({ 
  children, 
  onClick, 
  className = '',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const { triggerHaptic } = useMobileAnimation()

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  const handleClick = () => {
    triggerHaptic('medium')
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`fixed z-40 ${positionClasses[position]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30
      }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.button>
  )
}
