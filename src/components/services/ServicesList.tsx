'use client'

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddService } from './AddService'
import { EditService } from './EditService'
import { Service, CreateService } from '@/lib/schemas'
import { Plus, Edit, Trash2, DollarSign, Clock, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { AnimatedListItem } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useQueries'

interface ServicesListProps {
  tenantId: string
}

export interface ServicesListRef {
  openAddService: () => void
}

const ServicesListContent = forwardRef<ServicesListRef, ServicesListProps>(({ tenantId }, ref) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [deleteService, setDeleteService] = useState<Service | null>(null)
  const supabase = createClient()

  // React Query hooks for data fetching and mutations
  const { 
    data: services = [], 
    isLoading: loading, 
    error: servicesError,
    refetch: refetchServices
  } = useServices(tenantId)
  
  const createServiceMutation = useCreateService(tenantId)
  const updateServiceMutation = useUpdateService(tenantId)
  const deleteServiceMutation = useDeleteService(tenantId)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openAddService: () => setShowAddForm(true)
  }))

  // React Query handles data fetching automatically

  const handleAddService = async (serviceData: CreateService) => {
    try {
      await createServiceMutation.mutateAsync(serviceData)
      setShowAddForm(false)
      toast.success('Service created successfully')
    } catch (error) {
      // Error creating service
      const errorMessage = error instanceof Error ? error.message : 'Failed to create service';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('A service with this name already exists. Please use a different name.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your service information and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to create services. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to create service. Please check your connection and try again.');
      } else {
        toast.error('Failed to create service. Please try again.');
      }
    }
  }

  const handleUpdateService = async (serviceData: Partial<Service>) => {
    if (!editingService) return

    try {
      await updateServiceMutation.mutateAsync({
        serviceId: editingService.id,
        serviceData
      })
      setEditingService(null)
      toast.success('Service updated successfully')
    } catch (error) {
      // Error updating service
      const errorMessage = error instanceof Error ? error.message : 'Failed to update service';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('A service with this name already exists. Please use a different name.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your service information and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to update services. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to update service. Please check your connection and try again.');
      } else {
        toast.error('Failed to update service. Please try again.');
      }
    }
  }

  const handleDeleteService = async () => {
    if (!deleteService) return

    try {
      await deleteServiceMutation.mutateAsync(deleteService.id)
      toast.success('Service deleted successfully')
      setDeleteService(null)
    } catch (error) {
      // Error deleting service
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        toast.error('This service cannot be deleted because it has associated appointments. Please remove the appointments first.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to delete services. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to delete service. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete service. Please try again.');
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mobile-card">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Services List */}
      {services.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-8 w-8 text-gray-400" />}
          title="No Services Yet"
          description="Add your first service to get started"
          actionLabel="Add Service"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        (services as Service[]).map((service, index) => (
          <AnimatedListItem 
            key={service.id} 
            index={index}
            animationType="fade"
            staggerDelay={index * 50}
            enableSwipeToDelete={false}
            onDelete={() => {}}
            isDeleting={false}
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="w-full text-left p-4 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer interactive"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
                      {service.base_price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">
                            {formatPrice(service.base_price || 0)}
                          </span>
                        </div>
                      )}
                      
                      {service.hourly_rate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">
                            {formatPrice(service.hourly_rate)}/hr
                          </span>
                        </div>
                      )}
                      
                      {service.estimated_duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-500">
                            {formatDuration(service.estimated_duration_minutes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingService(service)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 touch-target"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteService(service)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-50 touch-target"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatedListItem>
        ))
      )}

      {/* Add Service Modal */}
      <AddService
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAddService}
        tenantId={tenantId}
      />

      {/* Edit Service Modal */}
      <EditService
        service={editingService}
        onClose={() => setEditingService(null)}
        onUpdate={handleUpdateService}
        tenantId={tenantId}
      />

      {/* Delete Confirmation Modal */}
      {deleteService && (
        <DeleteConfirmationModal
          isOpen={!!deleteService}
          onClose={() => setDeleteService(null)}
          onConfirm={handleDeleteService}
          title="Delete Service"
          description="This action cannot be undone. This will permanently delete the service."
          itemName={deleteService.name}
          itemType="Service"
          loading={deleteServiceMutation.isPending}
        />
      )}
    </div>
  )
})
ServicesListContent.displayName = 'ServicesListContent'

export const ServicesList = forwardRef<ServicesListRef, ServicesListProps>(({ tenantId }, ref) => {
  return (
    <APIErrorBoundary context="services list">
      <ServicesListContent ref={ref} tenantId={tenantId} />
    </APIErrorBoundary>
  )
})
ServicesList.displayName = 'ServicesList'
