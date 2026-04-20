'use client'

import { logger } from '@/lib/logger'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, FileText, Trash2 } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Document {
  id: string
  filename: string
  file_type: string
  storage_path: string
  mime_type: string
  file_size: number
  created_at: string
}

interface DocumentViewerProps {
  document: Document
  onClose: () => void
  onDelete?: () => void
  canDelete?: boolean
  downloadOnly?: boolean
}

export function DocumentViewer({ document: doc, onClose, onDelete, canDelete = false, downloadOnly = false }: DocumentViewerProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const supabase = createClient()
  
  const isImage = doc.mime_type.startsWith('image/')
  const isPdf = doc.mime_type === 'application/pdf'

  // Get the public URL for the image
  const imageUrl = supabase.storage.from('client-documents').getPublicUrl(doc.storage_path).data.publicUrl

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleDownload = async () => {
    try {
      // Get the public URL from Supabase storage
      const { data } = supabase.storage
        .from('client-documents')
        .getPublicUrl(doc.storage_path)

      const link = document.createElement('a')
      link.href = data.publicUrl
      link.download = doc.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      logger.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete()
      setShowDeleteModal(false)
      onClose()
    } catch (error) {
      logger.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {doc.filename}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              {!downloadOnly && canDelete && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isImage ? (
            <div className="flex justify-center items-center min-h-[50vh] relative">
              {/* Always render the image so onLoad/onError can fire */}
              <img
                src={imageUrl}
                alt={doc.filename}
                className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg ios-image-container ${
                  imageLoading || imageError ? 'hidden' : ''
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  display: imageLoading || imageError ? 'none' : 'block'
                }}
              />
              {/* Show loading spinner while image is loading */}
              {imageLoading && (
                <div className="absolute flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Loading image...</p>
                </div>
              )}
              {/* Show error message if image fails to load */}
              {imageError && (
                <div className="absolute flex flex-col items-center justify-center text-gray-500">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Failed to load image</p>
                  <p className="text-sm mb-4">The image could not be displayed</p>
                  <Button
                    onClick={handleDownload}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              )}
            </div>
          ) : isPdf ? (
            <div className="w-full h-[70vh]">
              <iframe
                src={supabase.storage.from('client-documents').getPublicUrl(doc.storage_path).data.publicUrl}
                className="w-full h-full border-0 rounded-lg"
                title={doc.filename}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Preview not available</p>
              <p className="text-sm">Click download to view this file</p>
              <Button
                className="mt-4"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Uploaded on {new Date(doc.created_at).toLocaleDateString()}
        </div>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Document"
          description="This action cannot be undone. This will permanently delete the document."
          itemName={doc.filename}
          itemType="Document"
          loading={isDeleting}
        />
      )}
    </Dialog>
  )
}