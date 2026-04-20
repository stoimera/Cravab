'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLongPressGesture } from '@/lib/gestures/gesture-recognition'
import { useState } from 'react'
import { Check, X, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionModal, actionSets } from '@/components/ui/ActionModal'
import { cn } from '@/lib/utils'

interface LongPressCardProps {
  children: React.ReactNode
  onLongPress?: () => void
  onSelect?: () => void
  onDeselect?: () => void
  isSelected?: boolean
  className?: string
  duration?: number
  showSelectionUI?: boolean
  // Action modal props
  cardType?: 'client' | 'call' | 'appointment'
  onAction?: (action: string) => void
  showActionModal?: boolean
  userRole?: string
}

export function LongPressCard({
  children,
  onLongPress,
  onSelect,
  onDeselect,
  isSelected = false,
  className,
  duration = 500,
  showSelectionUI = true,
  // Action modal props
  cardType,
  onAction,
  showActionModal = false,
  userRole
}: LongPressCardProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)

  const { isActive, longPressHandlers } = useLongPressGesture({
    onLongPress: () => {
      setIsPressed(true)
      setShowActions(true)
      onLongPress?.()
      
      // Open action modal for client and appointment cards on long press
      if (cardType === 'client' || cardType === 'appointment') {
        setIsActionModalOpen(true)
      }
    },
    duration
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    longPressHandlers.onTouchStart(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    longPressHandlers.onTouchMove(e)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    longPressHandlers.onTouchEnd()
    setIsPressed(false)
  }

  const handleSelect = () => {
    if (isSelected) {
      onDeselect?.()
    } else {
      onSelect?.()
    }
    setShowActions(false)
  }

  const handleAction = (action: string) => {
    onAction?.(action)
    setIsActionModalOpen(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation()
    
    // When buttons are hidden (PWA installed on mobile), allow tap to open action modal
    if (showActionModal && cardType) {
      setIsActionModalOpen(true)
      return
    }
    
    // When buttons are visible (web/desktop), clicking the card should navigate
    // This is handled by the parent component's onClick handler on the card content
    // For client/appointment cards, the parent handles navigation
    if (cardType === 'client' || cardType === 'appointment') {
      // Parent component handles navigation - this is a fallback
      return
    }
  }

  return (
    <div className={cn('relative', className)}>
      <motion.div
        className={cn(
          'relative transition-all duration-200',
          isSelected && 'ring-2 ring-blue-500 bg-blue-50',
          isPressed && 'scale-95',
          isActive && 'scale-105'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={showActionModal ? handleCardClick : (cardType === 'client' || cardType === 'appointment') ? handleCardClick : handleSelect}
        animate={{
          scale: isPressed ? 0.95 : isActive ? 1.05 : 1,
          backgroundColor: isSelected ? '#eff6ff' : '#ffffff'
        }}
        transition={{ duration: 0.2 }}
      >
        {children}

        {/* Selection indicator */}
        {isSelected && showSelectionUI && (
          <motion.div
            className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Long press indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                Long press detected
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelect}
                  className="flex-1"
                >
                  {isSelected ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Deselect
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Select
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowActions(false)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      {cardType && (
        <ActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Actions`}
          subtitle="Choose an action to perform"
          actions={actionSets[cardType]}
          onAction={handleAction}
          userRole={userRole}
        />
      )}
    </div>
  )
}
