'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CreateClient } from '@/lib/schemas'
import { useCreateClient } from '@/hooks/useQueries'
// Removed tenantHelpers import - no longer needed

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
  tenantId: string
}

export function AddClientModal({ isOpen, onClose, onClientAdded, tenantId }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  })

  const supabase = createClient()
  
  // Mutation hook for instant updates
  const createClientMutation = useCreateClient(tenantId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate phone number format
    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      toast.error('Phone number must be at least 10 digits')
      return
    }

    try {
      // Validate tenant exists before attempting to create client
      if (!tenantId) {
        toast.error('No company associated with your account. Please contact support.')
        return
      }
      
      const clientData: CreateClient = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email?.trim() || null,
        phone: phoneDigits, // Use normalized phone number
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        country: 'US',
        preferred_contact_method: 'phone',
        preferred_appointment_time: 'any',
        status: 'active',
        notes: formData.notes.trim() || null,
        tags: []
      }

      await createClientMutation.mutateAsync(clientData)

      toast.success('Client created successfully!')
      onClientAdded()
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create client'
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to create client. Please check your connection and try again.')
      } else {
        toast.error('Failed to create client. Please try again.')
      }
    }
  }

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Add New Client</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Add a new client to your database. Fill in their contact information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Doe"
                required
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john.doe@example.com"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address" className="text-sm font-medium">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Anytown"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-sm font-medium">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="NY"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="zip_code" className="text-sm font-medium">ZIP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="12345"
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the client..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createClientMutation.isPending}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={createClientMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 !text-white border border-black h-9 px-4"
            >
              {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
