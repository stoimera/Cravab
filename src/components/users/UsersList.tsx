'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Users, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { AddUserForm } from './AddUserForm'
import { EditUserForm } from './EditUserForm'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useQueries'
import { useAppContext } from '@/contexts/AppContext'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  title?: string
  role: 'owner' | 'admin' | 'worker' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  permissions: any
  created_at: string
  last_login_at?: string
}

function UsersListContent() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const { tenantId } = useAppContext()
  
  // Use React Query hooks for data fetching and mutations
  const { data: usersData = [], isLoading: loading, error } = useUsers(tenantId || '')
  const users = usersData as User[]
  const createUserMutation = useCreateUser(tenantId || '')
  const updateUserMutation = useUpdateUser(tenantId || '')
  const deleteUserMutation = useDeleteUser(tenantId || '')

  const handleAddUser = async (userData: Omit<User, 'id' | 'created_at' | 'last_login_at'>) => {
    try {
      await createUserMutation.mutateAsync(userData)
      setShowAddForm(false)
      toast.success('User created successfully')
    } catch (error) {
      // Error creating user
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
      toast.error(errorMessage)
    }
  }

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await updateUserMutation.mutateAsync({ userId, userData })
      setEditingUser(null)
      toast.success('User updated successfully')
    } catch (error) {
      // Error updating user
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('A user with this email already exists. Please use a different email address.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your information and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to update users. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to update user. Please check your connection and try again.');
      } else {
        toast.error('Failed to update user. Please try again.');
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await deleteUserMutation.mutateAsync(userId)
      toast.success('User deleted successfully')
    } catch (error) {
      // Error deleting user
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        toast.error('This user cannot be deleted because they have associated data. Please remove their data first.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to delete users. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to delete user. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete user. Please try again.');
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'worker': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage your team members and their permissions
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">Add your first team member to get started</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.title && (
                        <p className="text-sm text-gray-400">{user.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddForm && (
        <AddUserForm
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddUser}
        />
      )}

      {editingUser && (
        <EditUserForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  )
}

export function UsersList() {
  return (
    <APIErrorBoundary context="users list">
      <UsersListContent />
    </APIErrorBoundary>
  )
}
