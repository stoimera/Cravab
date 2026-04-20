'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  itemType: string
  loading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  loading = false
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm()
      handleClose()
    } catch (error) {
      logger.error('Error during deletion:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setIsDeleting(false)
    onClose()
  }

  const isConfirmValid = confirmText.toLowerCase() === 'delete'
  const isLoading = loading || isDeleting

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>{itemType}:</strong> {itemName}
            </p>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              To confirm deletion, type <span className="font-bold text-red-600">delete</span> below:
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="border-red-200 focus:border-red-500 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete {itemType}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
