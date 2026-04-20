'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  FileText, 
  Receipt, 
  Award, 
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Eye
} from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { DocumentViewer } from '@/components/clients/DocumentViewer'

interface Document {
  id: string
  title: string
  type: 'contract' | 'invoice' | 'certificate' | 'photo' | 'estimate' | 'document'
  owner?: string
  size: string
  tags: string[]
  uploadedAt: string
  category: string
  storage_path: string
  mime_type: string
  file_size: number
  client_id: string | null
}


const filterTypes = [
  { id: 'all', label: 'All' },
  { id: 'document', label: 'Documents' },
  { id: 'photo', label: 'Photos' }
]

// Photo MIME types based on the specified formats
const PHOTO_MIME_TYPES = [
  // Photography
  'image/jpeg',
  'image/jpg', 
  'image/heif',
  'image/heic',
  'image/raw',
  // Transparency
  'image/png',
  'image/webp',
  // Printing
  'image/tiff',
  'image/tif',
  'image/eps',
  // Animation
  'image/gif',
  // Scalable graphics
  'image/svg+xml'
]

// Function to determine if a file is a photo based on MIME type
const isPhotoFile = (mimeType: string): boolean => {
  return PHOTO_MIME_TYPES.includes(mimeType.toLowerCase())
}

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'contract':
      return <FileText className="h-8 w-8 text-purple-500" />
    case 'invoice':
      return <Receipt className="h-8 w-8 text-purple-500" />
    case 'certificate':
      return <Award className="h-8 w-8 text-yellow-500" />
    case 'photo':
      return <Camera className="h-8 w-8 text-purple-500" />
    default:
      return <FileText className="h-8 w-8 text-purple-500" />
  }
}

const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case 'contract':
      return 'bg-blue-500 text-white'
    case 'invoice':
      return 'bg-gray-200 text-gray-700'
    case 'certificate':
      return 'bg-gray-200 text-gray-700'
    case 'photo':
      return 'bg-gray-200 text-gray-700'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}

export default function DocumentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadOnly, setIsDownloadOnly] = useState(false)
  const supabase = createClient()

  // Check if user is admin
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setTenantId((userData as any).tenant_id)
          setUserRole((userData as any).role)
        }
      }
      
      setLoading(false)
      setRoleLoading(false)
    }
    
    getUser()
  }, [supabase])

  // Fetch documents when tenantId is available
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!tenantId) return

      try {
        setLoading(true)
        

        const { data: documentsData, error } = await supabase
          .from('documents')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (error) {
          // Error fetching documents
          setDocuments([])
        } else {
          // Transform the data to match the expected format
          const transformedDocuments = (documentsData || []).map((doc: any) => {
            const isPhoto = isPhotoFile(doc.mime_type)
            return {
              id: doc.id,
              title: doc.original_filename || doc.filename,
              type: (isPhoto ? 'photo' : 'document') as 'photo' | 'document',
              owner: 'System', // You could fetch client name if needed
              size: formatFileSize(doc.file_size),
              tags: doc.tags || [],
              uploadedAt: formatRelativeTime(doc.created_at),
              category: isPhoto ? 'photo' : 'document', // Use MIME type detection for category
              storage_path: doc.storage_path,
              mime_type: doc.mime_type,
              file_size: doc.file_size,
              client_id: doc.client_id
            }
          }) || []
          
          setDocuments(transformedDocuments)
        }
      } catch (error) {
        // Error fetching documents
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    if (tenantId && user) {
      fetchDocuments()
    }
  }, [tenantId, user, supabase])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return '1 day ago'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    let matchesFilter = true
    if (activeFilter === 'document') {
      // Show non-photo files (documents, PDFs, etc.)
      matchesFilter = !isPhotoFile(doc.mime_type)
    } else if (activeFilter === 'photo') {
      // Show photo/image files (PNG, JPEG, etc.)
      matchesFilter = isPhotoFile(doc.mime_type)
    }
    
    return matchesSearch && matchesFilter
  })


  const handleUpload = () => {
    setShowUpload(true)
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    // Refresh documents list
    if (tenantId && user) {
      const fetchDocuments = async () => {
        try {
          setLoading(true)
          

          const { data: documentsData, error } = await supabase
            .from('documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

          if (error) {
            // Error fetching documents
            setDocuments([])
          } else {
            // Transform the data to match the expected format
            const transformedDocuments = (documentsData || []).map((doc: any) => ({
              id: doc.id,
              title: doc.original_filename || doc.filename,
              type: (isPhotoFile(doc.mime_type) ? 'photo' : 'document') as 'photo' | 'document',
              owner: 'System', // You could fetch client name if needed
              size: formatFileSize(doc.file_size),
              tags: doc.tags || [],
              uploadedAt: formatRelativeTime(doc.created_at),
              category: doc.category,
              storage_path: doc.storage_path,
              mime_type: doc.mime_type,
              file_size: doc.file_size,
              client_id: doc.client_id
            })) || []
            
            setDocuments(transformedDocuments)
          }
        } catch (error) {
          // Error fetching documents
          setDocuments([])
        } finally {
          setLoading(false)
        }
      }
      
      fetchDocuments()
    }
  }

  const handleDocumentClick = (document: Document) => {
    setIsDownloadOnly(false)
    setSelectedDocument(document)
  }

  const handleDownload = async (doc: Document) => {
    // Open DocumentViewer in download-only mode
    setIsDownloadOnly(true)
    setSelectedDocument(doc)
  }

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return
    
    setIsDeleting(true)
    try {

      // For real data, delete from database and storage
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete.id)

      if (error) {
        // Error deleting document
        return
      }

      // Remove from state
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      setShowDeleteModal(false)
      setDocumentToDelete(null)
    } catch (error) {
      logger.error('Error deleting document:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ResponsiveLayout 
      activeTab="more" 
      title="Documents" 
      showBackButton={true}
      actions={
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={handleUpload}
        >
          <Plus className="h-4 w-4" />
          Upload
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-md w-full"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {filterTypes.map(filter => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter.id)}
                className="px-4 py-2 text-sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && tenantId && (
          <DocumentUpload 
            tenantId={tenantId}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {/* Documents List */}
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'No documents match your search.' : 'Upload your first document to get started.'}
                </p>
                <Button onClick={handleUpload} className="bg-purple-600 text-white hover:bg-purple-700 btn-transition">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Document Icon */}
                      <div className="flex-shrink-0">
                        {getDocumentIcon(doc.type)}
                      </div>

                      {/* Document Info - Clickable */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleDocumentClick(doc)}
                      >
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {doc.owner && `${doc.owner} • `}{doc.size}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Right Side Info and Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500">
                          {doc.uploadedAt}
                        </span>
                        <Badge
                          className={`text-xs px-2 py-1 ${getCategoryBadgeColor(doc.category)}`}
                        >
                          {doc.category}
                        </Badge>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDocumentClick(doc)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(doc)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete button - only visible for admin users */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(doc)
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={{
            id: selectedDocument.id,
            filename: selectedDocument.title,
            file_type: selectedDocument.type,
            storage_path: selectedDocument.storage_path,
            mime_type: selectedDocument.mime_type,
            file_size: selectedDocument.file_size,
            created_at: new Date().toISOString()
          }}
          onClose={() => setSelectedDocument(null)}
          onDelete={isAdmin ? () => handleDeleteClick(selectedDocument) : undefined}
          canDelete={isAdmin}
          downloadOnly={isDownloadOnly}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && documentToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDocumentToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Document"
          description="This action cannot be undone. This will permanently delete the document."
          itemName={documentToDelete.title}
          itemType="Document"
          loading={isDeleting}
        />
      )}
      </div>
    </ResponsiveLayout>
  )
}
