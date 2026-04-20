'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/schemas'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  MapPin, 
  Calendar,
  FileText,
  Upload,
  Download,
  User as UserIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { EditClientForm } from '@/components/clients/EditClientForm'
import { DocumentUploadModal } from '@/components/clients/DocumentUploadModal'
import { DocumentViewer } from '@/components/clients/DocumentViewer'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { BottomNav } from '@/components/layout/BottomNav'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { PageTransition } from '@/components/ui/PageTransition'
import { FloatingCard } from '@/components/ui/AnimatedCard'
import { motion } from 'framer-motion'

interface Appointment {
  id: string
  title: string
  starts_at: string
  status: string
  description?: string
}

interface Document {
  id: string
  filename: string
  file_type: string
  storage_path: string
  mime_type: string
  file_size: number
  created_at: string
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const supabase = createClient()
  
  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId, supabase])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        toast.error('Failed to load client details')
        return
      }

      setClient(clientData as any || null)

      // Fetch appointments for this client
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, title, starts_at, status, description')
        .eq('client_id', clientId)
        .order('starts_at', { ascending: false })

      if (appointmentsError) {
        // Silently handle appointments error
      } else {
        setAppointments((appointmentsData as any) || [])
      }

      // Fetch documents for this client
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, filename, file_type, storage_path, mime_type, file_size, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (documentsError) {
        // Silently handle documents error
      } else {
        setDocuments(documentsData || [])
      }

    } catch (error) {
      toast.error('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClient = async (clientId: string, clientData: Partial<Client>) => {
    try {
      const { error } = await (supabase as any)
        .from('clients')
        .update(clientData)
        .eq('id', clientId)

      if (error) {
        toast.error('Failed to update client')
        return
      }

      toast.success('Client updated successfully')
      setIsEditOpen(false)
      fetchClientData() // Refresh data
    } catch (error) {
      toast.error('Failed to update client')
    }
  }

  const handleDeleteClient = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        toast.error('Failed to delete client')
        return
      }

      toast.success('Client deleted successfully')
      router.push('/clients')
    } catch (error) {
      toast.error('Failed to delete client')
    }
  }

  const handleDocumentUpload = async (file: File, description?: string) => {
    try {
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      // Get tenant_id from users table to ensure RLS compliance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('Failed to verify user permissions')
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file)

      if (uploadError) {
        toast.error('Failed to upload document')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName)

      // Save document record
      const { error: dbError } = await (supabase as any)
        .from('documents')
        .insert({
          tenant_id: (userData as any).tenant_id,
          client_id: clientId,
          filename: file.name,
          original_filename: file.name,
          file_type: file.type,
          storage_path: fileName,
          mime_type: file.type,
          file_size: file.size,
          created_by: user.id,
          description: description || null
        })

      if (dbError) {
        toast.error(`Failed to save document record: ${dbError.message || 'Unknown error'}`)
        return
      }

      toast.success('Document uploaded successfully')
      setIsUploadOpen(false)
      fetchClientData() // Refresh data
    } catch (error) {
      toast.error('Failed to upload document')
    }
  }

  // Fetch user role from users table (same as ClientCard)
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'worker' | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const supabase = createClient()
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email || '')
            .single()
          
          if (userData && !error) {
            setUserRole((userData as any).role)
          } else {
            // Fallback: try by ID
            const { data: userDataById, error: errorById } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (userDataById && !errorById) {
              setUserRole((userDataById as any).role)
            } else {
              // No role found - this is an error state
              // No user role found in database
              setUserRole('worker') // Only fallback for error cases
            }
          }
        } catch (err) {
          setUserRole('worker') // Only fallback for error cases
        }
      } else {
        setUserRole('worker') // No user - default to worker
      }
      setRoleLoading(false)
    }
    fetchUserRole()
  }, [user])

  const isAdmin = userRole === 'admin'

  // Debug logging (remove in production)

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
          <Button onClick={() => router.push('/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveLayout 
      activeTab="clients" 
      title={`${client.first_name} ${client.last_name}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="h-8 w-8 p-0 bg-white border border-gray-200 hover:bg-gray-50"
            size="sm"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
              className="h-8 w-8 p-0"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 transition-all duration-200 bg-transparent border-none p-2 rounded-lg font-medium interactive"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </motion.button>
        </div>
      }
    >
      <PageTransition>
        <div className="p-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Client Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <FloatingCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5" />
                  <h3 className="text-lg font-medium">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {client.address}
                        {client.city && `, ${client.city}`}
                        {client.state && `, ${client.state}`}
                        {client.zip_code && ` ${client.zip_code}`}
                      </span>
                    </div>
                  )}
                </div>
                {client.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{client.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </FloatingCard>

            {/* Appointments */}
            <FloatingCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-lg font-medium">Recent Appointments ({appointments.length})</h3>
                </div>
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No appointments yet</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm">{appointment.title}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(appointment.starts_at).toLocaleDateString()} at{' '}
                            {new Date(appointment.starts_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {appointment.description && (
                            <p className="text-xs text-gray-600 mt-1">{appointment.description}</p>
                          )}
                        </div>
                        <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FloatingCard>
          </div>

          {/* Documents Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <FloatingCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Documents ({documents.length})</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm truncate">{doc.filename}</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FloatingCard>
          </div>
        </div>

      {/* Modals */}
      {isEditOpen && client && (
        <div>
          <EditClientForm
            client={client}
            isOpen={isEditOpen}
            onClose={() => {
              setIsEditOpen(false)
            }}
            onUpdate={handleUpdateClient}
          />
        </div>
      )}

      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleDocumentUpload}
        />
      )}

      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDelete={async () => {
            try {
              const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', selectedDocument.id)
              
              if (error) throw error
              
              toast.success('Document deleted successfully')
              fetchClientData() // Refresh the data
            } catch (error) {
              throw error
            }
          }}
          canDelete={isAdmin}
        />
      )}

      {isDeleteOpen && client && (
        <div>
          <DeleteConfirmationModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false)
            }}
            onConfirm={handleDeleteClient}
            title="Delete Client"
            description="This action cannot be undone. This will permanently delete the client and all associated data."
            itemName={`${client.first_name} ${client.last_name}`}
            itemType="Client"
          />
        </div>
      )}

        </div>
      </PageTransition>
    </ResponsiveLayout>
  )
}