'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, description?: string) => void
}

export function DocumentUploadModal({ isOpen, onClose, onUpload }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only JPEG, PNG, GIF, and PDF files are allowed')
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    setLoading(true)
    try {
      await onUpload(file, description.trim() || undefined)
      handleClose()
    } catch (error) {
      logger.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setDescription('')
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for this client. Supported formats: JPEG, PNG, GIF, PDF (max 10MB)
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">File *</Label>
            <div className="mt-1">
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">JPEG, PNG, GIF, PDF (MAX. 10MB)</p>
                </div>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                />
              </label>
            </div>
            
            {file && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}