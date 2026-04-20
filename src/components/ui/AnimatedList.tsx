'use client'

import { motion, AnimatePresence, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef, useState } from 'react'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'
import { useSwipeGesture } from '@/lib/gestures/gesture-recognition'
import { cn } from '@/lib/utils'

interface AnimatedListProps extends Omit<MotionProps, 'children'> {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce'
  enableSwipeToDelete?: boolean
  onItemDelete?: (index: number) => void
  emptyState?: ReactNode
  loading?: boolean
  loadingCount?: number
}

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  bounce: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
}

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({
    children,
    className,
    staggerDelay = 100,
    animationType = 'slide',
    enableSwipeToDelete = false,
    onItemDelete,
    emptyState,
    loading = false,
    loadingCount = 3,
    ...props
  }, ref) => {
    const { shouldAnimate } = useMobileAnimation()
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

    const handleDelete = (index: number) => {
      setDeletingIndex(index)
      setTimeout(() => {
        onItemDelete?.(index)
        setDeletingIndex(null)
      }, 300)
    }

    if (loading) {
      return (
        <div ref={ref} className={cn('space-y-2', className)}>
          {Array.from({ length: loadingCount }).map((_, index) => (
            <div
              key={index}
              className="animate-shimmer bg-gray-200 rounded-lg p-4 h-16"
            />
          ))}
        </div>
      )
    }

    if (children.length === 0) {
      return (
        <div ref={ref} className={cn('flex items-center justify-center py-8', className)}>
          {emptyState || (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No items to display</p>
            </div>
          )}
        </div>
      )
    }

    if (!shouldAnimate()) {
      return (
        <div ref={ref} className={cn('space-y-2', className)}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn('space-y-2', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <AnimatePresence mode="popLayout">
          {children.map((child, index) => (
            <AnimatedListItem
              key={index}
              index={index}
              animationType={animationType}
              staggerDelay={staggerDelay}
              enableSwipeToDelete={enableSwipeToDelete}
              onDelete={() => handleDelete(index)}
              isDeleting={deletingIndex === index}
            >
              {child}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </motion.div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'

// Individual list item component
interface AnimatedListItemProps {
  children: ReactNode
  index: number
  animationType: 'fade' | 'slide' | 'scale' | 'bounce'
  staggerDelay: number
  enableSwipeToDelete: boolean
  onDelete: () => void
  isDeleting: boolean
}

export function AnimatedListItem({
  children,
  index,
  animationType,
  staggerDelay,
  enableSwipeToDelete,
  onDelete,
  isDeleting
}: AnimatedListItemProps) {
  const { shouldAnimate } = useMobileAnimation()
  
  const swipeHookResult = useSwipeGesture({ onSwipeLeft: onDelete })
  const swipeProps = enableSwipeToDelete ? swipeHookResult : {}
  
  const variants = shouldAnimate() ? animationVariants[animationType] : {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  return (
    <motion.div
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.3,
        delay: index * (staggerDelay / 1000),
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      style={{
        willChange: 'transform, opacity',
        ...swipeProps
      }}
      className={cn(
        'transition-all duration-200 ease-in-out',
        isDeleting && 'opacity-0 scale-95'
      )}
      {...swipeProps}
    >
      {children}
    </motion.div>
  )
}

// Specialized list variants
export const AnimatedListGrid = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedList
        ref={ref}
        className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}
        animationType="scale"
        {...props}
      />
    )
  }
)

AnimatedListGrid.displayName = 'AnimatedListGrid'

export const AnimatedListHorizontal = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedList
        ref={ref}
        className={cn('flex space-x-4 overflow-x-auto pb-2', className)}
        animationType="slide"
        staggerDelay={50}
        {...props}
      />
    )
  }
)

AnimatedListHorizontal.displayName = 'AnimatedListHorizontal'

// List with pull-to-refresh
interface PullToRefreshListProps extends AnimatedListProps {
  onRefresh: () => void
  refreshThreshold?: number
}

export const PullToRefreshList = forwardRef<HTMLDivElement, PullToRefreshListProps>(
  ({ onRefresh, refreshThreshold = 80, ...props }, ref) => {
    // Pull to refresh is handled by parent component

    return (
      <div ref={ref} className="w-full">
        <AnimatedList {...props} />
      </div>
    )
  }
)

PullToRefreshList.displayName = 'PullToRefreshList'

// Skeleton list for loading states
interface SkeletonListProps {
  count?: number
  className?: string
  itemHeight?: string
}

export function SkeletonList({ 
  count = 3, 
  className,
  itemHeight = 'h-16'
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-shimmer bg-gray-200 rounded-lg p-4',
            itemHeight
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  )
}

// List with search and filter animations
interface SearchableListProps extends AnimatedListProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  placeholder?: string
}

export function SearchableList({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  ...props
}: SearchableListProps) {
  return (
    <div className="space-y-4">
      <motion.input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      />
      <AnimatedList {...props} />
    </div>
  )
}
