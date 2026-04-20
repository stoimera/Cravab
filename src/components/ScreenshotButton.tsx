'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useScreenshot } from '@/hooks/useScreenshot'
import { Camera, Download, Share, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ScreenshotButtonProps {
  targetElementId?: string
  filename?: string
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ScreenshotButton({
  targetElementId,
  filename = 'screenshot',
  className,
  variant = 'outline',
  size = 'default'
}: ScreenshotButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const { takeScreenshot, downloadScreenshot, shareScreenshot } = useScreenshot()

  const handleScreenshot = async (action: 'download' | 'share') => {
    try {
      setIsCapturing(true)

      // Find target element
      let targetElement: HTMLElement | null = null
      
      if (targetElementId) {
        targetElement = document.getElementById(targetElementId)
      } else {
        // Default to the main content area
        targetElement = document.querySelector('main') || document.body
      }

      if (!targetElement) {
        throw new Error('Target element not found')
      }

      // Take screenshot
      if (action === 'download') {
        await downloadScreenshot(targetElement, filename, {
          quality: 0.9,
          format: 'png',
          scale: 2 // Higher resolution for better quality
        })
        toast.success('Screenshot Downloaded', {
          description: 'Screenshot has been saved to your device.',
        })
      } else {
        await shareScreenshot(targetElement, {
          quality: 0.9,
          format: 'png',
          scale: 2
        })
        toast.success('Screenshot Shared', {
          description: 'Screenshot has been shared successfully.',
        })
      }

    } catch (error) {
      logger.error('Screenshot failed:', error)
      toast.error('Screenshot Failed', {
        description: error instanceof Error ? error.message : 'Failed to take screenshot',
      })
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleScreenshot('download')}
        disabled={isCapturing}
        variant={variant}
        size={size}
        className={className}
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="ml-2">Download</span>
      </Button>
      
      <Button
        onClick={() => handleScreenshot('share')}
        disabled={isCapturing}
        variant={variant}
        size={size}
        className={className}
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share className="h-4 w-4" />
        )}
        <span className="ml-2">Share</span>
      </Button>
    </div>
  )
}

// Specialized screenshot button for reports
export function ReportScreenshotButton({ 
  reportId, 
  className 
}: { 
  reportId: string
  className?: string 
}) {
  return (
    <ScreenshotButton
      targetElementId={`report-${reportId}`}
      filename={`report-${reportId}-${new Date().toISOString().split('T')[0]}`}
      className={className}
      variant="outline"
      size="sm"
    />
  )
}

// Specialized screenshot button for dashboards
export function DashboardScreenshotButton({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <ScreenshotButton
      targetElementId="dashboard-content"
      filename={`dashboard-${new Date().toISOString().split('T')[0]}`}
      className={className}
      variant="outline"
      size="sm"
    />
  )
}
