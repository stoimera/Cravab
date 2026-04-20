// User-Friendly Error Display Component
// Displays technical errors as user-friendly messages

import React from 'react'
import { AlertTriangle, RefreshCw, XCircle, CheckCircle, Info } from 'lucide-react'
import { getUserMessage, UserMessage } from '@/lib/user-messages'

interface UserErrorDisplayProps {
  error: Error | string
  context?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showTitle?: boolean
  showAction?: boolean
}

export function UserErrorDisplay({
  error,
  context,
  onRetry,
  onDismiss,
  className = '',
  showTitle = true,
  showAction = true
}: UserErrorDisplayProps) {
  const userMessage = getUserMessage(error, context)
  
  const getIcon = () => {
    switch (userMessage.severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }
  
  const getBackgroundColor = () => {
    switch (userMessage.severity) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }
  
  const getTextColor = () => {
    switch (userMessage.severity) {
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      case 'success':
        return 'text-green-800'
      default:
        return 'text-gray-800'
    }
  }
  
  return (
    <div className={`rounded-lg border p-4 ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {showTitle && (
            <h3 className={`text-sm font-medium ${getTextColor()}`}>
              {userMessage.title}
            </h3>
          )}
          <div className={`mt-1 text-sm ${getTextColor()}`}>
            <p>{userMessage.message}</p>
          </div>
          {showAction && (onRetry || onDismiss || userMessage.action) && (
            <div className="mt-3 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {userMessage.action || 'Try Again'}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Dismiss
                </button>
              )}
              {!onRetry && !onDismiss && userMessage.action && (
                <span className="text-sm text-gray-600">
                  {userMessage.action}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline error display for forms
export function InlineErrorDisplay({ 
  error, 
  context, 
  className = '' 
}: { 
  error: Error | string
  context?: string
  className?: string 
}) {
  const userMessage = getUserMessage(error, context)
  
  return (
    <div className={`text-sm text-red-600 ${className}`}>
      {userMessage.message}
    </div>
  )
}

// Toast-friendly error message
export function getToastMessage(error: Error | string, context?: string): string {
  const userMessage = getUserMessage(error, context)
  return userMessage.message
}

// Success message display
export function SuccessDisplay({ 
  message, 
  action = 'Success',
  className = '' 
}: { 
  message: string
  action?: string
  className?: string 
}) {
  return (
    <div className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">
            {action}
          </h3>
          <div className="mt-1 text-sm text-green-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
