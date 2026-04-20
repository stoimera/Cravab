'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  Mail, 
  Phone, 
  Users,
  Plus,
  Eye,
  UserCheck,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
// Admin sub-pages will be loaded via regular navigation

interface AccessRequest {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  companySize: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const fetchAccessRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/access-requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch access requests')
      }
      
      const data = await response.json()
      
      // Transform the data to match the expected format
      const transformedRequests = data.accessRequests.map((request: any) => ({
        id: request.id,
        companyName: request.company_name,
        contactName: request.contact_name,
        email: request.email,
        phone: request.phone,
        companySize: request.company_size,
        message: request.message,
        status: request.status,
        createdAt: request.created_at
      }))
      
      setRequests(transformedRequests)
      setError(null)
    } catch (error) {
      // Error fetching access requests
      setError('Failed to load access requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessRequests()
  }, [])

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      setError(null)

      const request = requests.find(r => r.id === requestId)
      if (!request) {
        throw new Error('Request not found')
      }

      // Create company account
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: request.companyName,
          contactName: request.contactName,
          email: request.email,
          phone: request.phone,
          companySize: request.companySize,
          message: request.message,
          // Vapi is configured per-tenant - each tenant provides their own API keys
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }

      const result = await response.json()
      
      // Update access request status in database
      const statusResponse = await fetch('/api/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status: 'approved'
        })
      })

      if (!statusResponse.ok) {
        // Failed to update access request status
        // Continue anyway since company was created successfully
      }

      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved' as const }
            : req
        )
      )

      // TODO: Implement email invitation system
      // Company created successfully
      // Invitation should be sent
      
    } catch (error) {
      // Error approving request
      setError(error instanceof Error ? error.message : 'Failed to approve request')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      setError(null)

      const response = await fetch('/api/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status: 'rejected'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject access request')
      }

      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const }
            : req
        )
      )

      // Access request rejected successfully
      
    } catch (error) {
      // Error rejecting request
      setError(error instanceof Error ? error.message : 'Failed to reject request')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const approvedRequests = requests.filter(req => req.status === 'approved')
  const rejectedRequests = requests.filter(req => req.status === 'rejected')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage company access requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={fetchAccessRequests}
                disabled={loading}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/admin/companies">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Companies
                </Button>
              </Link>
              <Link href="/admin/create-company">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Companies</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Active companies
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Not approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-600" />
              Pending Access Requests
            </CardTitle>
            <CardDescription>
              Review and approve company access requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No pending requests at the moment.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.companyName}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-2" />
                            <span>{request.contactName}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{request.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{request.companySize} employees</span>
                          </div>
                        </div>
                        {request.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingRequests.has(request.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          {processingRequests.has(request.id) ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className="border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {processingRequests.has(request.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {processingRequests.has(request.id) ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Approved Companies
            </CardTitle>
            <CardDescription>
              Companies with active access to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvedRequests.length === 0 ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  No approved companies yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {approvedRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.companyName}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Contact:</span> {request.contactName} ({request.email})
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
