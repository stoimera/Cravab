'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createServiceSchema, CreateService } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { KeywordsInput } from '@/components/ui/KeywordsInput'
import { createClient } from '@/lib/supabase/client'
import { getServiceCategories } from '@/lib/service-categories'

interface AddServiceProps {
  onClose: () => void
  onAdd: (service: CreateService) => void
  isOpen: boolean
  tenantId?: string
}

export function AddService({ onClose, onAdd, isOpen, tenantId }: AddServiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch business type when component mounts or tenantId changes
  useEffect(() => {
    const fetchBusinessType = async () => {
      if (!tenantId) return
      
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('business_type')
          .eq('id', tenantId)
          .single()

        if (!error && data) {
          setBusinessType((data as any).business_type || null)
        }
      } catch (error) {
        logger.error('Error fetching business type:', error)
      }
    }

    fetchBusinessType()
  }, [tenantId, supabase])

  const categories = getServiceCategories(businessType)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
    trigger,
  } = useForm<CreateService>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
      description: null,
      price: null,
      duration_minutes: 60,
      category: null,
      base_price: null,
      hourly_rate: null,
      minimum_charge: null,
      estimated_duration_minutes: null,
      is_active: true,
      is_emergency_service: false,
      requires_equipment: false,
      equipment_list: null,
      required_permits: null,
      keywords: [],
    },
  })

  const onSubmit = async (data: CreateService) => {
    // Check if form has validation errors
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await onAdd(data)
      reset()
    } catch (error) {
      // Error adding service
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add New Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Repair, Maintenance"
                className="mobile-input"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Service Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Service Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
                    <SelectTrigger className="mobile-input">
                      <SelectValue placeholder="Repair, Maintenance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the service..."
                className="mobile-input min-h-[80px]"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>


            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">
                Base Price (optional)
              </Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                {...register('base_price', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="0.00"
                className="mobile-input"
              />
              {errors.base_price && (
                <p className="text-sm text-red-600">{errors.base_price.message}</p>
              )}
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">
                Hourly Rate (optional)
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                {...register('hourly_rate', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="0.00"
                className="mobile-input"
              />
              {errors.hourly_rate && (
                <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>
              )}
            </div>

            {/* Minimum Charge */}
            <div className="space-y-2">
              <Label htmlFor="minimum_charge">
                Minimum Charge
              </Label>
              <Input
                id="minimum_charge"
                type="number"
                step="0.01"
                min="0"
                {...register('minimum_charge', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="0.00"
                className="mobile-input"
              />
              {errors.minimum_charge && (
                <p className="text-sm text-red-600">{errors.minimum_charge.message}</p>
              )}
            </div>


            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">
                Duration (minutes) *
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                {...register('duration_minutes', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? 60 : Number(value)
                })}
                placeholder="60"
                className="mobile-input"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="estimated_duration_minutes">
                Estimated Duration (minutes) (optional)
              </Label>
              <Input
                id="estimated_duration_minutes"
                type="number"
                min="0"
                {...register('estimated_duration_minutes', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="60"
                className="mobile-input"
              />
              {errors.estimated_duration_minutes && (
                <p className="text-sm text-red-600">{errors.estimated_duration_minutes.message}</p>
              )}
            </div>

            {/* Service Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  id="is_emergency_service"
                  type="checkbox"
                  {...register('is_emergency_service')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <Label htmlFor="is_emergency_service" className="text-sm">
                  Emergency service (optional)
                </Label>
              </div>


              <div className="flex items-center space-x-2">
                <input
                  id="is_active"
                  type="checkbox"
                  {...register('is_active')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="is_active" className="text-sm">
                  Service is active (optional)
                </Label>
              </div>
            </div>

            {/* Keywords for AI Matching */}
            <div className="space-y-2">
              <Label htmlFor="keywords">
                Keywords for AI Matching (2-10 keywords)
              </Label>
              <div className="text-sm text-muted-foreground mb-2">
                Add keywords that help the AI agent match this service to customer requests.
                <br />
                Examples: repair, install, maintenance, service, fix, emergency, urgent
              </div>
              <KeywordsInput
                value={watch('keywords') || []}
                onChange={(keywords) => setValue('keywords', keywords)}
                maxKeywords={10}
                minKeywords={0}
              />
              {errors.keywords && (
                <p className="text-sm text-red-600">{errors.keywords.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 mobile-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="outline"
                className="flex-1 mobile-button"
                onClick={async () => {
                  // Trigger validation
                  const isValid = await trigger()
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add Service'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
