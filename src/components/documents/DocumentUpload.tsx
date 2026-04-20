'use client'

import { logger } from '@/lib/logger'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploadProps {
  tenantId: string
  clientId?: string
  onUploadComplete?: () => void
}

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

export function DocumentUpload({ tenantId, clientId, onUploadComplete }: DocumentUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]

      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has an unsupported format.`)
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      uploadFiles(validFiles)
    }
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    
    // Initialize upload tracking
    const initialFiles: UploadedFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setUploadedFiles(initialFiles)

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Generate unique filename
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `documents/${tenantId}/${fileName}`

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (error) throw error

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)

          // Get tenant_id from users table to ensure RLS compliance
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user?.id)
            .single()

          if (userError || !userData) {
            logger.error('Error fetching user data:', userError)
            throw new Error('Failed to verify user permissions')
          }

          // Save document metadata to database
          const { error: dbError } = await (supabase as any)
            .from('documents')
            .insert({
              tenant_id: (userData as any).tenant_id,
              client_id: clientId || null,
              filename: fileName,
              original_filename: file.name,
              file_type: file.type,
              file_size: file.size,
              mime_type: file.type,
              storage_path: filePath,
              category: getDocumentType(file.type),
              description: null,
              tags: [],
              is_public: false,
              created_by: (user as any)?.id || ''
            })

          if (dbError) throw dbError

          // Update progress
          setUploadedFiles(prev => prev.map((item, i) => 
            i === index 
              ? { ...item, progress: 100, status: 'success', url: urlData.publicUrl }
              : item
          ))

          return { success: true, file }
        } catch (error: any) {
          logger.error('Upload error:', error)
          
          // Update error status
          setUploadedFiles(prev => prev.map((item, i) => 
            i === index 
              ? { ...item, status: 'error', error: error.message }
              : item
          ))

          return { success: false, file, error: error.message }
        }
      })

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded successfully!`)
        onUploadComplete?.()
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} file(s) failed to upload.`)
      }

    } catch (error: any) {
      logger.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const getDocumentType = (mimeType: string): 'invoice' | 'contract' | 'estimate' | 'photo' | 'receipt' | 'other' => {
    if (mimeType.startsWith('image/')) return 'photo'
    if (mimeType === 'application/pdf') return 'contract'
    if (mimeType.includes('word')) return 'other'
    if (mimeType === 'text/plain') return 'other'
    return 'other'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="card-transition">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload contracts, photos, invoices, and other documents. Maximum file size: 10MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Files</Label>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="form-transition"
          />
          <p className="text-sm text-gray-500">
            Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX, TXT
          </p>
        </div>

        {/* Upload Progress */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Upload Progress</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
                className="btn-transition"
              >
                Clear All
              </Button>
            </div>

            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(uploadedFile.file.size)})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <Badge variant="secondary" className="text-xs">
                        {uploadedFile.progress}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="h-2" />
                )}

                {uploadedFile.status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {uploadedFile.error}
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFile.status === 'success' && uploadedFile.url && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      File uploaded successfully. 
                      <a 
                        href={uploadedFile.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        View file
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full btn-transition"
        >
          {isUploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
