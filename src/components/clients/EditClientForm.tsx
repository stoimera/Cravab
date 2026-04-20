'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Client } from '@/lib/schemas'
import { toast } from 'sonner'

interface EditClientFormProps {
  client: Client
  isOpen: boolean
  onClose: () => void
  onUpdate: (clientId: string, clientData: Partial<Client>) => void
}

export function EditClientForm({ client, isOpen, onClose, onUpdate }: EditClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    phone: client.phone,
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    tags: client.tags ? client.tags.join(', ') : ''
  })

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Convert tags string back to array
      const tagsArray = formData.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
      
      // Only send fields that have actually changed
      const clientData: any = {}
      
      if (formData.first_name !== client.first_name) {
        clientData.first_name = formData.first_name
      }
      if (formData.last_name !== client.last_name) {
        clientData.last_name = formData.last_name
      }
      if (formData.phone !== client.phone) {
        clientData.phone = formData.phone
      }
      if (formData.email !== (client.email || '')) {
        clientData.email = formData.email
      }
      if (formData.address !== (client.address || '')) {
        clientData.address = formData.address
      }
      if (formData.notes !== (client.notes || '')) {
        clientData.notes = formData.notes
      }
      
      // Always include tags if they were modified
      const currentTags = client.tags ? client.tags.join(', ') : ''
      const currentTagsArray = client.tags || []
      
      // Compare arrays properly
      const tagsChanged = JSON.stringify(tagsArray.sort()) !== JSON.stringify(currentTagsArray.sort())
      
      if (tagsChanged) {
        clientData.tags = tagsArray
      }
      
      // Only proceed if there are actual changes
      if (Object.keys(clientData).length === 0) {
        toast.info('No changes to save')
        onClose()
        return
      }
      
      await onUpdate(client.id, clientData)
    } catch (error) {
      logger.error('Error updating client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">
            Edit Client
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Field */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
              <Input
                id="name"
                value={`${formData.first_name} ${formData.last_name}`}
                onChange={(e) => {
                  const names = e.target.value.split(' ')
                  setFormData(prev => ({
                    ...prev,
                    first_name: names[0] || '',
                    last_name: names.slice(1).join(' ') || ''
                  }))
                }}
                placeholder="Emma Wilson"
                required
                className="w-full h-9"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 345-6789"
                required
                className="h-9"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="client@example.com"
                className="h-9"
              />
            </div>

            {/* Address Field */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Address"
                className="h-9"
              />
            </div>

            {/* Tags Field */}
            <div className="space-y-1">
              <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="VIP, Regular, Lead"
                className="h-9"
              />
            </div>

            {/* Notes Field */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this client..."
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 !text-white border border-black h-9"
              >
                {isSubmitting ? 'Updating...' : 'Update Client'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
