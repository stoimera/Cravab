'use client'

import { logger } from '@/lib/logger'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface APIErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  context?: string
}

function APIErrorFallback({ onRetry, context }: { onRetry?: () => void; context?: string }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Data Loading Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {context ? `Failed to load ${context}. ` : 'Failed to load data. '}
            Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function APIErrorBoundary({ children, fallback, onRetry, context }: APIErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback || <APIErrorFallback onRetry={onRetry} context={context} />}
      onError={(error, errorInfo) => {
        logger.error('API Error:', error, errorInfo)
        // Could send to error reporting service in the future
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
