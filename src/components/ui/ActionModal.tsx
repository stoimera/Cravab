'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Eye, 
  MoreHorizontal,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  actions: ActionItem[]
  onAction: (action: string) => void
  className?: string
  userRole?: string
}

interface ActionItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  disabled?: boolean
}

const actionIcons = {
  edit: Edit,
  delete: Trash2,
  duplicate: Copy,
  export: Download,
  view: Eye,
  more: MoreHorizontal
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
  onAction,
  className,
  userRole
}: ActionModalProps) {
  const handleAction = (actionId: string) => {
    onAction(actionId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6",
        className
      )}>
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-2">
          {actions.map((action) => {
            const IconComponent = action.icon
            const isDeleteAction = action.id === 'delete'
            const isAdminOnly = isDeleteAction && userRole !== 'admin'
            
            return (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start h-12 px-4 text-left bg-white border border-gray-300 hover:bg-gray-50",
                    isDeleteAction ? "text-red-600 hover:text-red-700" : "text-black hover:text-gray-900"
                  )}
                  onClick={() => handleAction(action.id)}
                  disabled={action.disabled || isAdminOnly}
                >
                  <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">
                    {isAdminOnly ? `${action.label} (Admin Only)` : action.label}
                  </span>
                </Button>
              </motion.div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Predefined action sets for different card types
export const actionSets = {
  client: [
    { id: 'view', label: 'View Details', icon: actionIcons.view },
    { id: 'edit', label: 'Edit Client', icon: actionIcons.edit },
    { id: 'export', label: 'Export Data', icon: actionIcons.export },
    { id: 'delete', label: 'Delete Client', icon: actionIcons.delete }
  ],
  call: [
    { id: 'view', label: 'View Details', icon: actionIcons.view },
    { id: 'edit', label: 'Edit Call', icon: actionIcons.edit },
    { id: 'export', label: 'Export Data', icon: actionIcons.export },
    { id: 'delete', label: 'Delete Call', icon: actionIcons.delete }
  ],
  appointment: [
    { id: 'view', label: 'View Details', icon: actionIcons.view },
    { id: 'edit', label: 'Edit Appointment', icon: actionIcons.edit },
    { id: 'export', label: 'Export Data', icon: actionIcons.export },
    { id: 'delete', label: 'Delete Appointment', icon: actionIcons.delete }
  ]
}
