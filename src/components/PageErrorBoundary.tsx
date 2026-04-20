'use client'

import { logger } from '@/lib/logger'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ReactNode } from 'react'

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName: string
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error(`${pageName} page error:`, error, errorInfo)
        // Could send to error reporting service in the future
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
