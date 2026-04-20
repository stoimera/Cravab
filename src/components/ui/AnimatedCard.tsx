'use client'

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends Omit<MotionProps, 'children'> {
  children: ReactNode
  variant?: 'default' | 'outline' | 'elevated' | 'flat'
  className?: string
  hoverable?: boolean
  clickable?: boolean
  loading?: boolean
  animationType?: 'lift' | 'glow' | 'scale' | 'tilt'
  delay?: number
  onClick?: () => void
}

const cardVariants = {
  default: 'bg-card text-card-foreground shadow-sm',
  outline: 'bg-card text-card-foreground border border-border',
  elevated: 'bg-card text-card-foreground shadow-lg',
  flat: 'bg-card text-card-foreground'
}

const animationVariants = {
  lift: {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileHover: { 
      y: -4,
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileTap: { 
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  },
  glow: {
    initial: { 
      opacity: 0, 
      scale: 0.9 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileHover: { 
      scale: 1.02,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileTap: { 
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  },
  scale: {
    initial: { 
      opacity: 0, 
      scale: 0.8 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileHover: { 
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileTap: { 
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  },
  tilt: {
    initial: { 
      opacity: 0, 
      y: 20, 
      rotateX: -10 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileHover: { 
      y: -2,
      rotateX: 5,
      rotateY: 2,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    whileTap: { 
      scale: 0.98,
      rotateX: 0,
      rotateY: 0,
      transition: {
        duration: 0.1
      }
    }
  }
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({
    children,
    variant = 'default',
    className,
    hoverable = true,
    clickable = false,
    loading = false,
    animationType = 'lift',
    delay = 0,
    onClick,
    ...props
  }, ref) => {
    const { shouldAnimate, triggerHaptic } = useMobileAnimation()

    const handleClick = () => {
      if (clickable && onClick) {
        triggerHaptic('light')
        onClick()
      }
    }

    const baseClasses = cn(
      'rounded-lg border border-gray-200',
      cardVariants[variant],
      hoverable && 'transition-all duration-200 ease-in-out',
      clickable && 'cursor-pointer',
      loading && 'animate-pulse',
      className
    )

    const animationProps = shouldAnimate() ? {
      ...animationVariants[animationType],
      initial: {
        ...animationVariants[animationType].initial,
        transition: {
          delay: delay / 1000
        }
      }
    } : {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(baseClasses, 'animate-shimmer')}
        >
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        style={{ willChange: 'transform, opacity' }}
        {...animationProps}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

// Specialized card variants
export const FloatingCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'variant' | 'animationType'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedCard
        ref={ref}
        variant="elevated"
        animationType="lift"
        className={cn('shadow-xl', className)}
        {...props}
      />
    )
  }
)

FloatingCard.displayName = 'FloatingCard'

export const InteractiveCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'clickable' | 'animationType'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedCard
        ref={ref}
        clickable
        animationType="glow"
        className={cn('hover:shadow-lg', className)}
        {...props}
      />
    )
  }
)

InteractiveCard.displayName = 'InteractiveCard'

// Card with skeleton loading
export const SkeletonCard = forwardRef<HTMLDivElement, Omit<AnimatedCardProps, 'loading' | 'children'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedCard
        ref={ref}
        loading
        className={cn('animate-shimmer', className)}
        {...props}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
          </div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>
      </AnimatedCard>
    )
  }
)

SkeletonCard.displayName = 'SkeletonCard'

// Card grid with staggered animations
interface AnimatedCardGridProps {
  children: ReactNode[]
  className?: string
  columns?: 1 | 2 | 3 | 4
  staggerDelay?: number
}

export function AnimatedCardGrid({ 
  children, 
  className, 
  columns = 1, 
  staggerDelay = 100 
}: AnimatedCardGridProps) {
  const { shouldAnimate } = useMobileAnimation()

  const gridClasses = cn(
    'grid gap-4',
    columns === 1 && 'grid-cols-1',
    columns === 2 && 'grid-cols-1 md:grid-cols-2',
    columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    className
  )

  if (!shouldAnimate()) {
    return <div className={gridClasses}>{children}</div>
  }

  return (
    <motion.div
      className={gridClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3,
        staggerChildren: staggerDelay / 1000
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * (staggerDelay / 1000),
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
