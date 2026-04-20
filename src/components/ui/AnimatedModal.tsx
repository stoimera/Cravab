'use client'

import { motion, AnimatePresence, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef, useEffect } from 'react'
import { useMobileAnimation, MobileModal, BottomSheet } from '@/lib/animations/MobileAnimationManager'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface AnimatedModalProps extends Omit<MotionProps, 'children'> {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'modal' | 'bottom-sheet' | 'drawer' | 'popover'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
  contentClassName?: string
}

const sizeVariants = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full'
}

const animationVariants = {
  modal: {
    initial: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: {
        duration: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  'bottom-sheet': {
    initial: { 
      opacity: 0, 
      y: '100%' 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      y: '100%',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  drawer: {
    initial: { 
      opacity: 0, 
      x: '-100%' 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      x: '-100%',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  popover: {
    initial: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transition: {
        duration: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }
}

export const AnimatedModal = forwardRef<HTMLDivElement, AnimatedModalProps>(
  ({
    children,
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    variant = 'modal',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className,
    overlayClassName,
    contentClassName,
    ...props
  }, ref) => {
    const { shouldAnimate, triggerHaptic } = useMobileAnimation()

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          triggerHaptic('light')
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose, triggerHaptic])

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && closeOnOverlayClick) {
        triggerHaptic('light')
        onClose()
      }
    }

    const handleClose = () => {
      triggerHaptic('light')
      onClose()
    }

    if (!isOpen) return null

    // Use mobile-specific components for mobile devices
    if (variant === 'bottom-sheet' && typeof window !== 'undefined' && window.innerWidth < 768) {
      return (
        <BottomSheet
          isOpen={isOpen}
          onClose={onClose}
          className={cn('bg-white rounded-t-xl shadow-xl', className)}
        >
          <div className="p-6">
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between mb-4">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {description && (
              <p className="text-sm text-gray-600 mb-4">{description}</p>
            )}
            <div className={contentClassName}>{children}</div>
          </div>
        </BottomSheet>
      )
    }

    const overlayVariants = shouldAnimate() ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    } : {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }

    const contentVariants = shouldAnimate() ? animationVariants[variant] : {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4',
              variant === 'drawer' && 'items-start justify-start',
              variant === 'bottom-sheet' && 'items-end justify-center',
              overlayClassName
            )}
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleOverlayClick}
          >
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              ref={ref}
              className={cn(
                'relative bg-white rounded-lg shadow-xl w-full',
                sizeVariants[size],
                variant === 'drawer' && 'h-full rounded-none',
                variant === 'bottom-sheet' && 'rounded-t-xl',
                variant === 'popover' && 'shadow-2xl',
                className
              )}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ willChange: 'transform, opacity' }}
              {...props}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="px-6 pt-4">
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              )}

              {/* Content */}
              <div className={cn('p-6', contentClassName)}>
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

AnimatedModal.displayName = 'AnimatedModal'

// Specialized modal variants
export const AnimatedBottomSheet = forwardRef<HTMLDivElement, Omit<AnimatedModalProps, 'variant' | 'size'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedModal
        ref={ref}
        variant="bottom-sheet"
        size="full"
        className={cn('mx-4 mb-4', className)}
        {...props}
      />
    )
  }
)

AnimatedBottomSheet.displayName = 'AnimatedBottomSheet'

export const AnimatedDrawer = forwardRef<HTMLDivElement, Omit<AnimatedModalProps, 'variant' | 'size'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedModal
        ref={ref}
        variant="drawer"
        size="sm"
        className={cn('h-full', className)}
        {...props}
      />
    )
  }
)

AnimatedDrawer.displayName = 'AnimatedDrawer'

export const AnimatedPopover = forwardRef<HTMLDivElement, Omit<AnimatedModalProps, 'variant' | 'size'>>(
  ({ className, ...props }, ref) => {
    return (
      <AnimatedModal
        ref={ref}
        variant="popover"
        size="sm"
        className={cn('shadow-2xl', className)}
        {...props}
      />
    )
  }
)

AnimatedPopover.displayName = 'AnimatedPopover'

// Confirmation modal
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmationModalProps) {
  const { triggerHaptic } = useMobileAnimation()

  const handleConfirm = () => {
    triggerHaptic('medium')
    onConfirm()
  }

  const handleCancel = () => {
    triggerHaptic('light')
    onClose()
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AnimatedModal>
  )
}
