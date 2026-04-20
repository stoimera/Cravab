/**
 * Selection Toolbar Component
 * Shows when items are selected with bulk actions
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Trash2, 
  Download, 
  Mail, 
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectionToolbarProps {
  selectedCount: number
  totalCount: number
  onClear: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkDelete?: () => void
  onBulkExport?: () => void
  onBulkEmail?: () => void
  onBulkAction?: (action: string) => void
  className?: string
  isVisible: boolean
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onClear,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  onBulkAction,
  className,
  isVisible
}: SelectionToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0

  if (!isVisible || selectedCount === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Badge variant="secondary" className="px-2 py-1">
              {selectedCount} of {totalCount} selected
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}

            {onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}

            {onBulkEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEmail}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}

            {onBulkAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('more')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
