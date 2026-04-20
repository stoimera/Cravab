'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditClientForm } from './EditClientForm'
import { DocumentUploadModal } from './DocumentUploadModal'
import { DocumentViewer } from './DocumentViewer'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Upload,
  // Tag,
  Edit,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/database-comprehensive'
import { toast } from 'sonner'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientDocument {
  id: string
  filename: string
  file_type: string
  storage_path: string
  mime_type: string
  file_size: number
  created_at: string
  description?: string | null
  category?: string | null
  uploaded_by?: string
  status?: string
}

interface ClientOverviewProps {
  client: Client
}

function ClientOverviewContent({ client }: ClientOverviewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null)
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch client documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/clients/${client.id}/documents`)
        if (response.ok) {
          const data = await response.json()
          setDocuments(data)
        }
      } catch (error) {
        // Error fetching documents
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [client.id])

  const handleUpdate = async (clientId: string, clientData: Partial<Client>) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (response.ok) {
        // The API route will handle cache invalidation automatically
        // No need to reload the page
        toast.success('Client updated successfully')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }
    } catch (error) {
      logger.error('Error updating client:', error)
      toast.error('Failed to update client')
    }
  }

  const formatFileSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    return '📁'
  }

  const handleUpload = async (file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', 'general')
    formData.append('category', 'client_documents')
    formData.append('description', description || '')

    const response = await fetch(`/api/clients/${client.id}/documents`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload document')
    }

    // Refresh documents list
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/clients/${client.id}/documents`)
        if (response.ok) {
          const data = await response.json()
          setDocuments(data)
        }
      } catch (error) {
        // Error fetching documents
      }
    }
    
    await fetchDocuments()
  }

  const handleViewDocument = (document: ClientDocument) => {
    setSelectedDocument(document)
    setIsViewerOpen(true)
  }

  const handleDownloadDocument = async (document: ClientDocument) => {
    try {
      // TODO: Implement actual download from Supabase Storage
      // Download document
      // For now, just show an alert
      alert(`Download functionality for ${document.filename} will be implemented with Supabase Storage integration`)
    } catch (error) {
      // Download error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-gray-600">Client Overview</p>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{client.address}</span>
              </div>
            )}
          </div>

          {/* Status and Contact Preferences */}
          <div className="flex items-center gap-2">
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status}
            </Badge>
            {client.preferred_contact_method && (
              <Badge variant="outline">
                Prefers {client.preferred_contact_method}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documents
            </CardTitle>
            <Button 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(doc.file_type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • {doc.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No documents uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload contracts, invoices, or photos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Appointments and calls will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Client Modal */}
      {isEditOpen && (
        <EditClientForm
          client={client}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          onClose={() => {
            setIsViewerOpen(false)
            setSelectedDocument(null)
          }}
          document={selectedDocument}
        />
      )}
    </div>
  )
}

export function ClientOverview({ client }: ClientOverviewProps) {
  return (
    <APIErrorBoundary context="client overview">
      <ClientOverviewContent client={client} />
    </APIErrorBoundary>
  )
}
