'use client'

import { logger } from '@/lib/logger'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Trash2, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { EditClientForm } from './EditClientForm'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { LongPressCard } from '@/components/mobile/LongPressCard'
import { usePWAInstallStatus } from '@/hooks/usePWAInstallStatus'
import { Checkbox } from '@/components/ui/checkbox'
import { Client } from '@/lib/schemas'
import { useDeleteClient } from '@/hooks/useQueries'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database-comprehensive'

type UserRole = Database['public']['Tables']['users']['Row']['role']
type User = Database['public']['Tables']['users']['Row']
type Appointment = Database['public']['Tables']['appointments']['Row']

interface ClientCardProps {
  client: Client
  // Selection props
  isSelectionEnabled?: boolean
  isSelectionMode?: boolean
  isSelected?: boolean
  onLongPress?: () => void
  onToggleSelection?: () => void
  longPressDuration?: number
}

export function ClientCard({ 
  client, 
  isSelectionEnabled = false,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelection,
  longPressDuration = 1500
}: ClientCardProps) {
  // Detect if PWA is installed on mobile - hide buttons in that case
  const { showButtons } = usePWAInstallStatus()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const router = useRouter()
  const [appointmentData, setAppointmentData] = useState<{
    lastService: string | null
    nextService: string | null
    isFirstTime: boolean
  } | null>(null)

  const { user } = useAuth()
  const deleteClientMutation = useDeleteClient(client.tenant_id)
  const supabase = createClient()

  // Handle successful deletion
  useEffect(() => {
    if (deleteClientMutation.isSuccess) {
      toast.success('Client deleted successfully')
    }
  }, [deleteClientMutation.isSuccess])

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) {
        setRoleLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          // Error loading user role
          setUserRole(null)
        } else {
          const user = userData as User
          setUserRole(user?.role || null)
        }
      } catch (error) {
        // Error loading user role
        setUserRole(null)
      } finally {
        setRoleLoading(false)
      }
    }

    loadUserRole()
  }, [user])

  // Load appointment data
  useEffect(() => {
    const loadAppointmentData = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('starts_at, status')
          .eq('client_id', client.id)
          .order('starts_at', { ascending: false })

        if (error) {
          // Error loading appointments
          return
        }

        if (appointments && appointments.length > 0) {
          const now = new Date()
          
          // Past appointments: any status except cancelled, ordered by most recent first
          const pastAppointments = appointments
            .filter((apt: any) => 
              new Date(apt.starts_at) < now && apt.status !== 'cancelled'
            )
            .sort((a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
          
          // Future appointments: any status except cancelled, ordered by earliest first
          const futureAppointments = appointments
            .filter((apt: any) => 
              new Date(apt.starts_at) > now && apt.status !== 'cancelled'
            )
            .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

          const appointmentData = {
            lastService: pastAppointments.length > 0 ? pastAppointments[0].starts_at : null,
            nextService: futureAppointments.length > 0 ? futureAppointments[0].starts_at : null,
            isFirstTime: pastAppointments.length === 0
          }
          
          
          setAppointmentData(appointmentData)
        } else {
          setAppointmentData({
            lastService: null,
            nextService: null,
            isFirstTime: true
          })
        }
      } catch (error) {
        // Error loading appointment data
      }
    }

    loadAppointmentData()
  }, [client.id, user])

  const handleDelete = async () => {
    try {
      await deleteClientMutation.mutateAsync(client.id)
      // Success message and modal close are handled by the mutation's onSuccess callback
      setIsDeleteOpen(false)
    } catch (error) {
      // Error deleting client
      toast.error('Failed to delete client')
    }
  }

  const formatServiceDate = (dateString: string | null, isFuture: boolean = false) => {
    if (!dateString) return isFuture ? 'No upcoming service' : 'No previous service'
    
    const appointmentDate = new Date(dateString)
    const now = new Date()
    
    // Normalize dates to start of day for accurate day comparison
    const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffInDays = Math.floor((appointmentDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    
    if (isFuture) {
      // For future appointments
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Tomorrow'
      if (diffInDays < 7) return `In ${diffInDays} days`
      if (diffInDays < 30) return `In ${Math.floor(diffInDays / 7)} weeks`
      if (diffInDays < 365) return `In ${Math.floor(diffInDays / 30)} months`
      return `In ${Math.floor(diffInDays / 365)} years`
    } else {
      // For past appointments
      const pastDiffInDays = Math.abs(diffInDays)
      if (pastDiffInDays === 0) return 'Today'
      if (pastDiffInDays === 1) return 'Yesterday'
      if (pastDiffInDays < 7) return `${pastDiffInDays} days ago`
      if (pastDiffInDays < 30) return `${Math.floor(pastDiffInDays / 7)} weeks ago`
      if (pastDiffInDays < 365) return `${Math.floor(pastDiffInDays / 30)} months ago`
      return `${Math.floor(pastDiffInDays / 365)} years ago`
    }
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
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 hover:shadow-md transition-shadow"
        // Action modal props
        cardType="client"
        onAction={(action) => {
          switch (action) {
            case 'view':
              // Navigate to client details page
              router.push(`/clients/${client.id}`)
              break
            case 'edit':
              setIsEditOpen(true)
              break
            case 'delete':
              setIsDeleteOpen(true)
              break
            default:
              break
          }
        }}
        userRole={userRole || undefined}
        showActionModal={!showButtons} // Enable action modal when buttons are hidden (PWA installed on mobile)
      >
        {/* Selection checkbox */}
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="h-4 w-4"
            />
          </div>
        )}

        {/* Main content */}
        <div 
          className="cursor-pointer"
          onClick={() => {
            // When buttons are hidden (PWA installed), clicking card opens details
            if (!showButtons) {
              router.push(`/clients/${client.id}`)
            }
          }}
        >
          {/* Header with name and action buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {client.first_name} {client.last_name}
                </h3>
                {client.tags && client.tags.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                    {client.tags[0]}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons - only show when NOT installed on mobile (web/desktop mode) */}
            {showButtons && (
              <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/clients/${client.id}`)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {/* Delete button - only show for admin users */}
                {!roleLoading && (userRole === 'admin' || process.env.NODE_ENV === 'development') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-gray-200 hover:border-gray-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Contact Info - below the header */}
          <div className="space-y-2 text-sm text-gray-600">
            {client.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
            {appointmentData && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  {appointmentData.nextService ? 
                    `Next service: ${formatServiceDate(appointmentData.nextService, true)}` :
                    appointmentData.lastService ? 
                      `Last service: ${formatServiceDate(appointmentData.lastService, false)}` :
                      'No service history'
                  }
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
            </div>
          )}
        </div>
      </LongPressCard>

      {/* Edit Modal */}
      {isEditOpen && (
        <EditClientForm
          client={client}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdate={async (clientId, clientData) => {
            try {
              const response = await fetch(`/api/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientData),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update client')
              }

              toast.success('Client updated successfully')
              setIsEditOpen(false)
              // The API route will handle cache invalidation automatically
            } catch (error) {
              logger.error('Error updating client:', error)
              toast.error('Failed to update client')
            }
          }}
        />
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Client"
          description={`Are you sure you want to delete ${client.first_name} ${client.last_name}? This action cannot be undone.`}
          itemName={`${client.first_name} ${client.last_name}`}
          itemType="client"
          loading={deleteClientMutation.isPending}
        />
      )}
    </>
  )
}