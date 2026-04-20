'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { formatTime, formatDate } from '@/lib/utils'
import { Calendar, Clock, MapPin, Car, Edit, Trash2 } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'
import { LongPressCard } from '@/components/mobile/LongPressCard'
import { usePWAInstallStatus } from '@/hooks/usePWAInstallStatus'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { ExportConfirmationModal } from '@/components/ui/export-confirmation-modal'
import { useState } from 'react'
import { useAndroidDetection, getAndroidClasses } from '@/hooks/useAndroidDetection'

// Define a specific type for this component's data structure
type AppointmentListItem = {
  id: string
  tenant_id: string
  client_id: string
  service_id: string | null
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled'
  priority: 'normal' | 'high' | 'emergency'
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  coordinates: Record<string, unknown> | null
  eta_minutes: number | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  clients: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
    address: string | null
  } | null
  services: {
    id: string
    name: string
    description: string | null
    category: string | null
    base_price: number | null
    hourly_rate: number | null
    estimated_duration_minutes: number | null
    is_emergency_service: boolean | null
    requires_equipment: boolean | null
  } | null
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: string
  } | null
}

interface AppointmentCardProps {
  appointment: AppointmentListItem
  onClick?: (appointment: AppointmentListItem) => void
  onEdit?: (appointment: AppointmentListItem) => void
  onDelete?: (appointment: AppointmentListItem) => void
  userRole?: string
  // Selection props
  isSelectionEnabled?: boolean
  isSelectionMode?: boolean
  isSelected?: boolean
  onLongPress?: () => void
  onToggleSelection?: () => void
  longPressDuration?: number
}

export function AppointmentCard({ 
  appointment, 
  onClick, 
  onEdit, 
  onDelete, 
  userRole,
  // Selection props
  isSelectionEnabled = false,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelection,
  longPressDuration = 1500
}: AppointmentCardProps) {
  // Detect if PWA is installed on mobile - hide buttons in that case
  const { showButtons } = usePWAInstallStatus()
  const androidInfo = useAndroidDetection()
  const { shouldAnimate, triggerHaptic } = useMobileAnimation()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const getDuration = () => {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    return `${diffInMinutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'confirmed':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300'
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  const getFullAddress = () => {
    const parts = []
    
    // First try appointment address fields
    if (appointment.address) parts.push(appointment.address)
    if (appointment.city) parts.push(appointment.city)
    if (appointment.state) parts.push(appointment.state)
    if (appointment.zip_code) parts.push(appointment.zip_code)
    
    // If no appointment address, fall back to client address
    if (parts.length === 0 && appointment.clients?.address) {
      parts.push(appointment.clients.address)
    }
    
    return parts.length > 0 ? parts.join(', ') : null
  }

  const handleDeleteConfirm = async () => {
    try {
      await onDelete?.(appointment)
      setShowDeleteModal(false)
    } catch (error) {
      // Error deleting appointment
    }
  }

  const handleExportConfirm = async () => {
    try {
      // Create CSV data for the appointment
      const csvData = [
        {
          'Appointment ID': appointment.id,
          'Title': appointment.title,
          'Client': appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'N/A',
          'Service': appointment.services?.name || 'N/A',
          'Start Time': formatTime(appointment.starts_at),
          'End Time': formatTime(appointment.ends_at),
          'Status': appointment.status,
          'Address': getFullAddress() || 'No address provided',
          'Notes': appointment.notes || 'No notes'
        }
      ]

      // Convert to CSV
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `appointment-${appointment.id}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setShowExportModal(false)
    } catch (error) {
      // Error exporting appointment
    }
  }

  const handleClick = () => {
    if (onClick) {
      triggerHaptic('light')
      onClick(appointment)
    }
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    triggerHaptic('light')
    onEdit?.(appointment)
  }

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    triggerHaptic('medium')
    onDelete?.(appointment)
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1
    },
    whileHover: shouldAnimate() ? { 
      y: -2,
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    } : {},
    whileTap: shouldAnimate() ? { 
      scale: 0.98
    } : {}
  }

  return (
    <>
    <LongPressCard
      onLongPress={isSelectionEnabled ? onLongPress : undefined}
      onSelect={isSelectionMode && onToggleSelection ? onToggleSelection : undefined}
      onDeselect={isSelectionMode && onToggleSelection ? onToggleSelection : undefined}
      isSelected={isSelected}
      duration={longPressDuration}
      showSelectionUI={isSelectionMode}
      className="mb-3"
      // Action modal props
      cardType="appointment"
      onAction={(action) => {
        switch (action) {
          case 'view':
            // Open appointment details modal
            onClick?.(appointment)
            break
          case 'edit':
            onEdit?.(appointment)
            break
          case 'export':
            setShowExportModal(true)
            break
          case 'delete':
            setShowDeleteModal(true)
            break
        }
      }}
      showActionModal={!showButtons} // Enable action modal when buttons are hidden (PWA installed on mobile)
      userRole={userRole}
    >
      <motion.div 
        className={`bg-white rounded-lg p-3 sm:p-4 ${
          onClick ? 'hover:bg-gray-50' : ''
        }`}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="whileHover"
        whileTap="whileTap"
        transition={{
          duration: 0.3,
          ease: "easeOut"
        }}
        style={{ willChange: 'transform, opacity' }}
      >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-4 w-4 text-gray-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Clickable content area */}
          <div 
            className="cursor-pointer"
            onClick={(e) => {
              // When buttons are hidden (PWA installed), clicking card opens details
              if (!showButtons && onClick) {
                onClick(appointment)
              } else if (!showButtons) {
                // If no onClick handler but buttons are hidden, do nothing (action modal will handle)
                return
              } else {
                // When buttons are visible, use normal click handler
                handleClick()
              }
            }}
          >
            {/* Header with client name and status */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {appointment.clients 
                    ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
                    : appointment.title
                  }
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {appointment.title}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <Badge className={`${getStatusColor(appointment.status)} text-xs px-2 py-1`}>
                  {appointment.status.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-gray-500">{getDuration()}</p>
              </div>
            </div>
            
            {/* Service tags */}
            {appointment.services && (
              <div className="flex flex-wrap items-center gap-1 mb-2">
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {appointment.services.category || 'Service'}
                </span>
                {appointment.services.is_emergency_service && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Emergency
                  </span>
                )}
                {appointment.services.requires_equipment && (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    Equipment
                  </span>
                )}
              </div>
            )}
            
            {/* Service Description */}
            {appointment.services?.description && (
              <div className="mb-2">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {appointment.services.description}
                </p>
              </div>
            )}
            
            {/* Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {formatDate(appointment.starts_at)} at {formatTime(appointment.starts_at)}
                </span>
              </div>
              {getFullAddress() && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words leading-relaxed">{getFullAddress()}</span>
                </div>
              )}
              {appointment.eta_minutes && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Car className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{appointment.eta_minutes}min travel</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons - only show when NOT installed on mobile (web/desktop mode) */}
          {showButtons && (
            <div className="flex items-center justify-end gap-1 mt-2">
              <AnimatedButton
                variant="outline"
                size="icon"
                onClick={() => {
                  handleEdit()
                }}
                animationType="scale"
                className="h-5 w-5 p-0 bg-white border border-gray-300 hover:bg-gray-50"
              >
                <Edit className="h-3 w-3" />
              </AnimatedButton>
              {userRole === 'admin' && (
                <AnimatedButton
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    handleDelete()
                  }}
                  animationType="scale"
                  className="h-5 w-5 p-0 bg-white border border-gray-300 hover:bg-gray-50 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </AnimatedButton>
              )}
            </div>
          )}
        </div>
      </div>
      </motion.div>
    </LongPressCard>

    {/* Modals */}
    <DeleteConfirmationModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleDeleteConfirm}
      title="Delete Appointment"
      description="Are you sure you want to delete this appointment? This action cannot be undone."
      itemName={appointment.title}
      itemType="appointment"
    />

    <ExportConfirmationModal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      onConfirm={handleExportConfirm}
      itemName={appointment.title}
      itemType="appointment"
      description={`Export appointment data for "${appointment.title}"`}
    />
  </>
  )
}
