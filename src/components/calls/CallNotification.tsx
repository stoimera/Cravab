'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, X, Play, Eye } from 'lucide-react'
// import { cn } from '@/lib/utils'

interface Call {
  id: string
  time: string
  caller: string
  phone: string
  line: 'treated' | 'holdout'
  disposition: 'answered' | 'missed' | 'voicemail' | 'busy'
  duration: number
  booking: boolean
  csat: number | null
  recordingUrl?: string
  transcript?: string
  aiHandled?: boolean
  escalated?: boolean
  status: 'ringing' | 'in_progress' | 'completed' | 'failed'
}

interface CallNotificationProps {
  call: Call
  onDismiss: () => void
  onViewCall: (call: Call) => void
}

export function CallNotification({ call, onDismiss, onViewCall }: CallNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Wait for animation
    }, 10000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getLineColor = (line: string) => {
    return line === 'treated' 
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <Card className="w-80 bg-card border-border shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground font-inter">New Call</h3>
                <p className="text-xs text-muted-foreground font-inter">
                  {timeElapsed}s ago
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <p className="font-medium text-foreground font-inter">{call.caller}</p>
              <p className="text-sm text-muted-foreground font-inter">{call.phone}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(call.status)}>
                {call.status}
              </Badge>
              <Badge className={getLineColor(call.line)}>
                {call.line}
              </Badge>
              {call.aiHandled && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  AI
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground/70 font-inter">
                {formatTime(call.time)}
              </span>
              <div className="flex items-center gap-1">
                {call.recordingUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewCall(call)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
