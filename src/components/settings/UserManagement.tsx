'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Mail, Shield, Trash2, Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useQueries'
import { useAppContext } from '@/contexts/AppContext'

interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'worker'
  status: 'active' | 'pending' | 'inactive'
  last_login: string | null
  created_at: string
  invitation_expires_at?: string | null
}

interface UserManagementProps {
  tenantId: string
  currentUserRole: 'owner' | 'manager' | 'worker'
}

export function UserManagement({ tenantId, currentUserRole }: UserManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'worker'>('worker')
  const { toast } = useToast()
  
  // Use React Query hooks for data fetching and mutations
  const { data: usersData = [], isLoading: loading, refetch } = useUsers(tenantId)
  const users = usersData as User[]
  const createUserMutation = useCreateUser(tenantId)
  const updateUserMutation = useUpdateUser(tenantId)
  const deleteUserMutation = useDeleteUser(tenantId)

  // Data fetching is now handled by React Query hooks

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) return

    try {
      await createUserMutation.mutateAsync({
        name: inviteEmail.split('@')[0], // Use email prefix as name
        email: inviteEmail,
        role: inviteRole,
        first_name: inviteEmail.split('@')[0], // Required by validation
        last_name: 'User' // Required by validation
      })

      toast(`Invitation sent to ${inviteEmail}`)

      setInviteEmail('')
      setInviteRole('worker')
      setInviteDialogOpen(false)
    } catch (error) {
      logger.error('Invite user error:', error)
      toast(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        userData: { role: newRole }
      })

      toast('User role has been updated successfully.')
    } catch (error) {
      toast('Failed to update role. Please try again.')
    }
  }

  const handleResendInvitation = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/company/users/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tenant_id: tenantId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      toast(`Invitation resent to ${userEmail}`)
      refetch()
    } catch (error) {
      toast(`Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return

    try {
      await deleteUserMutation.mutateAsync(userId)

      toast('User has been removed from the company.')
    } catch (error) {
      toast('Failed to remove user. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'manager':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'worker':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'inactive':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const isInvitationExpired = (user: User) => {
    if (user.status !== 'pending' || !user.invitation_expires_at) return false
    return new Date(user.invitation_expires_at) < new Date()
  }

  const getInvitationStatus = (user: User) => {
    if (user.status === 'active') return null
    if (isInvitationExpired(user)) return 'expired'
    return 'pending'
  }

  const formatExpirationDate = (expiresAt: string | null) => {
    if (!expiresAt) return 'N/A'
    return new Date(expiresAt).toLocaleDateString()
  }

  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'manager'
  const canInviteUsers = currentUserRole === 'owner' || currentUserRole === 'manager'
  
  // Debug logging removed for production

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground font-inter">User Management</h2>
          <p className="text-muted-foreground font-inter">Manage team members and their roles</p>
        </div>
        
        {canInviteUsers && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6 border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground font-inter">Invite New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-foreground font-inter">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invite-role" className="text-foreground font-inter">Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'manager' | 'worker')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInviteUser}
                    disabled={createUserMutation.isPending || !inviteEmail}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {createUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users Table */}
      <Card className="bg-card border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-muted/50">
                  <TableHead className="text-muted-foreground font-inter">User</TableHead>
                  <TableHead className="text-muted-foreground font-inter">Role</TableHead>
                  <TableHead className="text-muted-foreground font-inter">Status</TableHead>
                  <TableHead className="text-muted-foreground font-inter">Invitation</TableHead>
                  <TableHead className="text-muted-foreground font-inter">Last Login</TableHead>
                  <TableHead className="text-muted-foreground font-inter">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-gray-200 hover:bg-muted/50">
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground font-inter truncate">{user.name || 'No name'}</div>
                        <div className="text-sm text-muted-foreground font-inter truncate">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManageUsers ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                          disabled={user.role === 'owner'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="worker">Worker</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getInvitationStatus(user) === 'pending' && (
                        <div className="space-y-1">
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            Pending
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Expires: {formatExpirationDate(user.invitation_expires_at || null)}
                          </div>
                        </div>
                      )}
                      {getInvitationStatus(user) === 'expired' && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                          Expired
                        </Badge>
                      )}
                      {getInvitationStatus(user) === null && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground font-inter">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canManageUsers && user.role !== 'owner' && (
                          <>
                            {getInvitationStatus(user) === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvitation(user.id, user.email)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                                title="Resend invitation"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                              title="Remove user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invite User Button - Always visible for debugging */}
      <div className="flex justify-center">
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl border border-gray-300">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6 border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground font-inter">Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-foreground font-inter">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role" className="text-foreground font-inter">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'manager' | 'worker')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  className="border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={createUserMutation.isPending || !inviteEmail}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border border-gray-300"
                >
                  {createUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
