'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Trash2 className="h-5 w-5 text-gray-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className="flex-1"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
