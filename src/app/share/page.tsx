'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share, FileText, ImageIcon, Link, Calendar, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SharedData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export default function SharePage() {
  const router = useRouter()
  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're in a PWA share context
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search)
      const title = urlParams.get('title')
      const text = urlParams.get('text')
      const url = urlParams.get('url')
      
      if (title || text || url) {
        setSharedData({
          title: title || undefined,
          text: text || undefined,
          url: url || undefined
        })
      }
    }
    
    setLoading(false)
  }, [])

  const handleProcessShare = async (type: 'document' | 'appointment' | 'client') => {
    if (!sharedData) return

    try {
      // Process the shared content based on type
      let message = ''
      
      switch (type) {
        case 'document':
          message = 'Document shared successfully!'
          // Here you would process the shared document
          break
        case 'appointment':
          message = 'Appointment information shared!'
          // Here you would process appointment data
          break
        case 'client':
          message = 'Client information shared!'
          // Here you would process client data
          break
      }

      toast.success('Content Processed', {
        description: message,
      })

      // Redirect to appropriate page
      router.push(`/${type}s`)
    } catch (error) {
      toast.error('Processing Failed', {
        description: 'Failed to process shared content',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              No Shared Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No shared content was received. This page is designed to handle content shared from other apps.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Shared Content Received
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sharedData.title && (
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Title</h3>
                <p className="text-gray-600">{sharedData.title}</p>
              </div>
            )}
            
            {sharedData.text && (
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Text</h3>
                <p className="text-gray-600">{sharedData.text}</p>
              </div>
            )}
            
            {sharedData.url && (
              <div>
                <h3 className="font-medium text-gray-900 mb-1">URL</h3>
                <a 
                  href={sharedData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Link className="h-4 w-4" />
                  {sharedData.url}
                </a>
              </div>
            )}

            {sharedData.files && sharedData.files.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Files</h3>
                <div className="space-y-2">
                  {sharedData.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-3">What would you like to do with this content?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleProcessShare('document')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Create Document</span>
                </Button>
                
                <Button
                  onClick={() => handleProcessShare('appointment')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Schedule Appointment</span>
                </Button>
                
                <Button
                  onClick={() => handleProcessShare('client')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Add Client</span>
                </Button>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => window.close()} className="flex-1">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
