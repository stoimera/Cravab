'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Smartphone, Monitor } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, showInstallPrompt, installApp, dismissInstallPrompt } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || !showInstallPrompt || dismissed) {
    return null
  }

  const handleInstall = async () => {
    await installApp()
    setDismissed(true)
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Install CRAVAB
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                Install this app on your device for a better experience. Access it quickly from your home screen.
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Smartphone className="w-3 h-3" />
                  <Monitor className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
