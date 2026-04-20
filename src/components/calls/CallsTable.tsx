'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Play, Eye, MessageSquare, Calendar, Tag } from 'lucide-react'
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
}

interface CallsTableProps {
  calls: Call[]
  onCallSelect: (call: Call) => void
  isMobile?: boolean
}

export function CallsTable({ calls, onCallSelect, isMobile = false }: CallsTableProps) {
  const [selectedCall, setSelectedCall] = useState<string | null>(null)

  const handleCallClick = (call: Call) => {
    setSelectedCall(call.id)
    onCallSelect(call)
  }

  const getDispositionColor = (disposition: string) => {
    switch (disposition) {
      case 'answered':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'missed':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'voicemail':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'busy':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getLineColor = (line: string) => {
    return line === 'treated' 
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {calls.map((call) => (
          <Card 
            key={call.id} 
            className={cn(
              "bg-card border-border cursor-pointer transition-colors",
              selectedCall === call.id && "ring-2 ring-primary"
            )}
            onClick={() => handleCallClick(call)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground font-inter truncate">{call.caller}</h3>
                  <p className="text-sm text-muted-foreground font-inter">{call.phone}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm text-muted-foreground font-inter">{formatTime(call.time)}</p>
                  <p className="text-xs text-muted-foreground/70 font-inter">{formatDuration(call.duration)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={getDispositionColor(call.disposition)}>
                  {call.disposition}
                </Badge>
                <Badge className={getLineColor(call.line)}>
                  {call.line}
                </Badge>
                {call.booking && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Booked
                  </Badge>
                )}
                {call.csat && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {call.csat}★
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {call.recordingUrl && (
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground font-inter">Time</TableHead>
            <TableHead className="text-muted-foreground font-inter">Caller</TableHead>
            <TableHead className="text-muted-foreground font-inter">Line</TableHead>
            <TableHead className="text-muted-foreground font-inter">Disposition</TableHead>
            <TableHead className="text-muted-foreground font-inter">Duration</TableHead>
            <TableHead className="text-muted-foreground font-inter">Booking</TableHead>
            <TableHead className="text-muted-foreground font-inter">CSAT</TableHead>
            <TableHead className="text-muted-foreground font-inter">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow 
              key={call.id}
              className={cn(
                "border-border hover:bg-muted/50 cursor-pointer",
                selectedCall === call.id && "bg-primary/5"
              )}
              onClick={() => handleCallClick(call)}
            >
              <TableCell className="text-foreground font-inter">
                {formatTime(call.time)}
              </TableCell>
              <TableCell className="text-foreground font-inter">
                <div>
                  <div className="font-medium">{call.caller}</div>
                  <div className="text-sm text-muted-foreground">{call.phone}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getLineColor(call.line)}>
                  {call.line}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getDispositionColor(call.disposition)}>
                  {call.disposition}
                </Badge>
              </TableCell>
              <TableCell className="text-foreground font-inter">
                {formatDuration(call.duration)}
              </TableCell>
              <TableCell>
                {call.booking ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Booked
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/50">-</span>
                )}
              </TableCell>
              <TableCell>
                {call.csat ? (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {call.csat}★
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/50">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {call.recordingUrl && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
