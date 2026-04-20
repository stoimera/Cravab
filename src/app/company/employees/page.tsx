'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Users, 
  Edit, 
  Trash2,
  Mail,
  Shield,
  User
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'worker'
  status: 'active' | 'inactive'
  created_at: string
}

export default function CompanyEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'worker' as 'admin' | 'worker'
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/company/employees')
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      const data = await response.json()
      setEmployees(data.employees)
    } catch (error) {
      setError('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/company/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      })

      if (!response.ok) {
        throw new Error('Failed to add employee')
      }

      await fetchEmployees()
      setNewEmployee({ name: '', email: '', role: 'worker' })
      setShowAddForm(false)
    } catch (error) {
      setError('Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmployee = async (employee: Employee) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/company/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })

      if (!response.ok) {
        throw new Error('Failed to update employee')
      }

      await fetchEmployees()
      setEditingEmployee(null)
    } catch (error) {
      setError('Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete employee')
      }

      await fetchEmployees()
    } catch (error) {
      setError('Failed to delete employee')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="outline" className="text-purple-600 border-purple-600"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'worker':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><User className="h-3 w-3 mr-1" />Worker</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading employees...</p>
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
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-sm text-gray-600">Manage your company employees</p>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(emp => emp.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workers</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(emp => emp.role === 'worker').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
              <CardDescription>
                Add a new team member to your company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <select
                      id="role"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value as 'admin' | 'worker' }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="worker">Worker</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Employee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your company employees and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  No employees found. Add your first team member above.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{employee.name}</h3>
                        {getRoleBadge(employee.role)}
                        {getStatusBadge(employee.status)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{employee.email}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
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
