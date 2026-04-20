'use client'

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends Omit<MotionProps, 'children'> {
  children: ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
  loading?: boolean
  hapticFeedback?: boolean
  animationType?: 'scale' | 'bounce' | 'pulse' | 'wiggle'
  onClick?: () => void
}

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
}

const sizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10'
}

const animationVariants = {
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  },
  bounce: {
    whileHover: { 
      scale: 1.05,
      y: -2
    },
    whileTap: { 
      scale: 0.95,
      y: 0
    },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  pulse: {
    whileHover: { 
      scale: 1.02,
      boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.1)'
    },
    whileTap: { 
      scale: 0.98,
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)'
    },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  },
  wiggle: {
    whileHover: { 
      scale: 1.02,
      rotate: [0, -2, 2, -2, 2, 0]
    },
    whileTap: { 
      scale: 0.98,
      rotate: 0
    },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  }
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    children,
    variant = 'default',
    size = 'default',
    className,
    disabled = false,
    loading = false,
    hapticFeedback = true,
    animationType = 'scale',
    onClick,
    ...props
  }, ref) => {
    const { triggerHaptic, shouldAnimate } = useMobileAnimation()

    const handleClick = () => {
      if (disabled || loading) return
      
      if (hapticFeedback) {
        triggerHaptic('light')
      }
      
      onClick?.()
    }

    const baseClasses = cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant],
      sizeVariants[size],
      className
    )

    const animationProps = shouldAnimate() ? animationVariants[animationType] : {}

    if (loading) {
      return (
        <motion.button
          ref={ref}
          className={baseClasses}
          disabled
          style={{ willChange: 'transform' }}
          {...props}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </motion.button>
      )
    }

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled}
        onClick={handleClick}
        style={{ willChange: 'transform' }}
        {...animationProps}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

// Specialized button variants
export const FloatingActionButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant' | 'size'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        variant="default"
        size="icon"
        className={cn(
          'fixed bottom-4 right-4 z-40 rounded-full shadow-lg',
          className
        )}
        animationType="bounce"
        {...props}
      />
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

export const IconButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant' | 'size'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', className)}
        animationType="scale"
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'

// Loading button with skeleton animation
export const LoadingButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, loading, className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        className={cn(loading && 'animate-pulse', className)}
        loading={loading}
        {...props}
      >
        {children}
      </AnimatedButton>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'
