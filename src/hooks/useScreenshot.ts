import { useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import { logger } from '@/lib/logger'

interface ScreenshotOptions {
  quality?: number
  format?: 'png' | 'jpeg' | 'webp'
  backgroundColor?: string
  scale?: number
}

interface ScreenshotResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
}

/**
 * Custom hook for taking screenshots of DOM elements
 * Works on iOS Safari and other modern browsers
 */
export function useScreenshot() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const takeScreenshot = useCallback(async (
    element: HTMLElement,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult | null> => {
    const {
      quality = 0.9,
      format = 'png',
      backgroundColor = '#ffffff',
      scale = 1
    } = options

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Get element dimensions
      const rect = element.getBoundingClientRect()
      const width = rect.width * scale
      const height = rect.height * scale

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Set background color
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      // Use html2canvas for better compatibility
      if (typeof window !== 'undefined') {
        const canvasElement = await html2canvas(element, {
          background: backgroundColor,
          useCORS: true,
          allowTaint: true
        })

        const dataUrl = canvasElement.toDataURL(`image/${format}`, quality)
        const blob = await new Promise<Blob>((resolve) => {
          canvasElement.toBlob((blob: Blob | null) => {
            resolve(blob || new Blob())
          }, `image/${format}`, quality)
        })

        return {
          dataUrl,
          blob,
          width: canvasElement.width,
          height: canvasElement.height
        }
      }

      // Fallback: Use native canvas API (limited functionality)
      // This won't work for complex layouts but provides basic functionality
      const dataUrl = canvas.toDataURL(`image/${format}`, quality)
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          resolve(blob || new Blob())
        }, `image/${format}`, quality)
      })

      return {
        dataUrl,
        blob,
        width,
        height
      }

    } catch (error) {
      logger.error('Screenshot failed:', error)
      return null
    }
  }, [])

  const downloadScreenshot = useCallback(async (
    element: HTMLElement,
    filename: string = 'screenshot',
    options: ScreenshotOptions = {}
  ) => {
    const result = await takeScreenshot(element, options)
    
    if (!result) {
      throw new Error('Failed to take screenshot')
    }

    // Create download link
    const url = URL.createObjectURL(result.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${options.format || 'png'}`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
  }, [takeScreenshot])

  const shareScreenshot = useCallback(async (
    element: HTMLElement,
    options: ScreenshotOptions = {}
  ) => {
    const result = await takeScreenshot(element, options)
    
    if (!result) {
      throw new Error('Failed to take screenshot')
    }

    // Check if Web Share API is available (iOS Safari supports this)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([result.blob], 'screenshot.png', {
          type: 'image/png'
        })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Screenshot',
            text: 'Screenshot from CRAVAB',
            files: [file]
          })
          return
        }
      } catch (error) {
        logger.warn('Web Share API failed:', error)
      }
    }

    // Fallback: Copy to clipboard (iOS Safari supports this)
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
        const clipboardItem = new ClipboardItem({
          'image/png': result.blob
        })
        await navigator.clipboard.write([clipboardItem])
        return
      } catch (error) {
        logger.warn('Clipboard API failed:', error)
      }
    }

    // Final fallback: Download
    await downloadScreenshot(element, 'screenshot', options)
  }, [takeScreenshot, downloadScreenshot])

  return {
    takeScreenshot,
    downloadScreenshot,
    shareScreenshot,
    canvasRef
  }
}
