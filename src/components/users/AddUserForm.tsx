'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, X, UserPlus } from 'lucide-react'

interface AddUserFormProps {
  onClose: () => void
  onAdd: (userData: any) => void
}

export function AddUserForm({ onClose, onAdd }: AddUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    title: '',
    role: 'worker' as 'owner' | 'admin' | 'worker' | 'viewer',
    permissions: {
      can_manage_clients: true,
      can_manage_appointments: true,
      can_manage_services: false,
      can_manage_users: false,
      can_view_reports: true
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onAdd(formData)
    } catch (error) {
      logger.error('Error adding user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Add New User
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Technician, Manager, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_clients"
                    checked={formData.permissions.can_manage_clients}
                    onCheckedChange={(checked) => handlePermissionChange('can_manage_clients', checked as boolean)}
                  />
                  <Label htmlFor="can_manage_clients" className="text-sm">Manage Clients</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_appointments"
                    checked={formData.permissions.can_manage_appointments}
                    onCheckedChange={(checked) => handlePermissionChange('can_manage_appointments', checked as boolean)}
                  />
                  <Label htmlFor="can_manage_appointments" className="text-sm">Manage Appointments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_services"
                    checked={formData.permissions.can_manage_services}
                    onCheckedChange={(checked) => handlePermissionChange('can_manage_services', checked as boolean)}
                  />
                  <Label htmlFor="can_manage_services" className="text-sm">Manage Services</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_users"
                    checked={formData.permissions.can_manage_users}
                    onCheckedChange={(checked) => handlePermissionChange('can_manage_users', checked as boolean)}
                  />
                  <Label htmlFor="can_manage_users" className="text-sm">Manage Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_view_reports"
                    checked={formData.permissions.can_view_reports}
                    onCheckedChange={(checked) => handlePermissionChange('can_view_reports', checked as boolean)}
                  />
                  <Label htmlFor="can_view_reports" className="text-sm">View Reports</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
