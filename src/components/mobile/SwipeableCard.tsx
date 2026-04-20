'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Trash2, Edit, MoreHorizontal } from 'lucide-react'
import { useSwipeGesture } from '@/lib/gestures/gesture-recognition'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMore?: () => void
  className?: string
  swipeThreshold?: number
  showActions?: boolean
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onEdit,
  onDelete,
  onMore,
  className,
  swipeThreshold = 100,
  showActions = true
}: SwipeableCardProps) {
  const { x, gestureState, dragHandlers } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: swipeThreshold
  })

  const leftActionOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0])
  const rightActionOpacity = useTransform(x, [0, swipeThreshold], [0, 1])
  const leftActionScale = useTransform(x, [-swipeThreshold, 0], [1, 0.8])
  const rightActionScale = useTransform(x, [0, swipeThreshold], [0.8, 1])

  const hasLeftActions = onSwipeLeft || onDelete
  const hasRightActions = onSwipeRight || onEdit || onMore

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left actions */}
      {hasLeftActions && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-center gap-2 px-4 bg-red-500 text-white"
          style={{
            opacity: leftActionOpacity,
            scale: leftActionScale,
            width: swipeThreshold
          }}
        >
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-red-600"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {onSwipeLeft && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-red-600"
              onClick={onSwipeLeft}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Right actions */}
      {hasRightActions && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-4 bg-blue-500 text-white"
          style={{
            opacity: rightActionOpacity,
            scale: rightActionScale,
            width: swipeThreshold
          }}
        >
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-600"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onMore && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-600"
              onClick={onMore}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
          {onSwipeRight && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-600"
              onClick={onSwipeRight}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        className="relative bg-white"
        style={{ x }}
        {...dragHandlers}
      >
        {children}
      </motion.div>

      {/* Swipe indicator */}
      {gestureState.isActive && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs">
            {gestureState.direction === 'left' && 'Swipe left for actions'}
            {gestureState.direction === 'right' && 'Swipe right for actions'}
            {gestureState.direction === 'up' && 'Swipe up'}
            {gestureState.direction === 'down' && 'Swipe down'}
          </div>
        </motion.div>
      )}
    </div>
  )
}
