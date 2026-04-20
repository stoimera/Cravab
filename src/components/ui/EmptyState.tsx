'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={`mobile-card ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <Button 
          variant="outline" 
          onClick={onAction} 
          className="w-full sm:w-auto sm:max-w-xs mobile-button"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
