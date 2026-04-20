'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause, 
  Volume2, 
  MessageSquare, 
  Calendar, 
  Tag, 
  Copy, 
  ExternalLink,
  Clock,
  User,
  Phone,
  Bot,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  timeline?: Array<{
    time: string
    action: string
    description: string
    type: 'ring' | 'consent' | 'agent' | 'escalation' | 'booking' | 'end'
  }>
  auditTrail?: Array<{
    time: string
    user: string
    action: string
    details: string
  }>
}

interface CallDrawerProps {
  call: Call | null
  isOpen: boolean
  onClose: () => void
}

export function CallDrawer({ call, isOpen, onClose }: CallDrawerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)

  if (!call) return null

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'ring':
        return <Phone className="h-4 w-4" />
      case 'consent':
        return <User className="h-4 w-4" />
      case 'agent':
        return <Bot className="h-4 w-4" />
      case 'escalation':
        return <AlertTriangle className="h-4 w-4" />
      case 'booking':
        return <Calendar className="h-4 w-4" />
      case 'end':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'ring':
        return 'text-primary bg-primary/10'
      case 'consent':
        return 'text-green-600 bg-green-500/10'
      case 'agent':
        return 'text-purple-600 bg-purple-500/10'
      case 'escalation':
        return 'text-red-600 bg-red-500/10'
      case 'booking':
        return 'text-amber-600 bg-amber-500/10'
      case 'end':
        return 'text-gray-600 bg-gray-500/10'
      default:
        return 'text-gray-600 bg-gray-500/10'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] lg:w-[800px] bg-background border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg sm:text-xl font-semibold text-foreground font-inter">
                {call.caller}
              </SheetTitle>
              <p className="text-muted-foreground font-inter">{call.phone}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {call.line}
                </Badge>
                {call.aiHandled && (
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                    AI Handled
                  </Badge>
                )}
                {call.escalated && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                    Escalated
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground font-inter flex-shrink-0 ml-4">
              <p>{formatTime(call.time)}</p>
              <p>{formatDuration(call.duration)}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
            {/* Timeline */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground font-inter">
                  Call Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {call.timeline?.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        getTimelineColor(event.type)
                      )}>
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-sm font-medium text-foreground font-inter">
                            {event.action}
                          </span>
                          <span className="text-xs text-muted-foreground font-inter">
                            {event.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-inter mt-1">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recording Player */}
            {call.recordingUrl && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground font-inter">
                    Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1 bg-muted rounded-lg h-2">
                      <div className="bg-primary h-2 rounded-lg w-1/3"></div>
                    </div>
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript */}
            {call.transcript && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground font-inter">
                    Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {call.transcript.split('\n').slice(0, transcriptExpanded ? undefined : 12).map((line, index) => (
                      <p key={index} className="text-sm text-muted-foreground font-inter">
                        {line}
                      </p>
                    ))}
                    {call.transcript.split('\n').length > 12 && (
                      <Button
                        variant="ghost"
                        onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                        className="text-primary hover:text-primary/80 p-0 h-auto"
                      >
                        {transcriptExpanded ? 'Show less' : 'Show more'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground font-inter">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Callback SMS
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Booking Link
                  </Button>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                    <Tag className="h-4 w-4 mr-2" />
                    Tag Client
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            {call.auditTrail && call.auditTrail.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground font-inter">
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {call.auditTrail.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-sm font-medium text-foreground font-inter">
                              {entry.user}
                            </span>
                            <span className="text-xs text-muted-foreground font-inter">
                              {entry.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-inter">
                            {entry.action}
                          </p>
                          {entry.details && (
                            <p className="text-xs text-muted-foreground/70 font-inter mt-1">
                              {entry.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
