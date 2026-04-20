'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, FileText, Calendar } from 'lucide-react'

interface ExportConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType: string
  description?: string
  loading?: boolean
}

export function ExportConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  description = `Export data for ${itemName}`,
  loading = false
}: ExportConfirmationModalProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleConfirm = async () => {
    setIsExporting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      logger.error('Error during export:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export {itemType}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Item:</span>
              <span>{itemName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Format:</span>
              <span>CSV (Excel compatible)</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            The exported file will contain all available data for this {itemType.toLowerCase()}, including details, timestamps, and related information.
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isExporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
