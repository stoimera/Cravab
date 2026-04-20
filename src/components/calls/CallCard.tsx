'use client'

import { Phone, PhoneCall, PhoneOff } from 'lucide-react'
import { CallWithClient } from '@/types/database-comprehensive'
import { getCallDisplayName } from '@/lib/call-utils'

type Call = CallWithClient

interface CallCardProps {
  call: Call
}

export function CallCard({ call }: CallCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <PhoneCall className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Phone className="h-5 w-5 text-blue-500" />
      case 'started':
        return <Phone className="h-5 w-5 text-yellow-500" />
      case 'failed':
      case 'busy':
      case 'no_answer':
        return <PhoneOff className="h-5 w-5 text-red-500" />
      case 'ringing':
        return <Phone className="h-5 w-5 text-yellow-500" />
      default:
        return <Phone className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'started':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'busy':
      case 'no_answer':
        return 'bg-red-100 text-red-800'
      case 'ringing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'started':
        return 'Started'
      case 'failed':
        return 'Failed'
      case 'busy':
        return 'Busy'
      case 'no_answer':
        return 'No Answer'
      case 'ringing':
        return 'Ringing'
      default:
        return 'Unknown'
    }
  }

  const formatDuration = (durationSeconds?: number | null) => {
    if (!durationSeconds || durationSeconds === 0) return '0 min'
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date()
    const callTime = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    } else {
      return 'over 1 year ago'
    }
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-4 bg-white rounded-lg border border-gray-200">
      {/* Phone Icon */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
          {getStatusIcon(call.status)}
        </div>
      </div>

      {/* Call Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex-1 min-w-0">
            {(() => {
              const displayInfo = getCallDisplayName(call)
              return (
                <>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {displayInfo.name}
                  </p>
                  {displayInfo.showPhone && call.from_number && (
                    <p className="text-xs text-gray-600 truncate">
                      {call.from_number}
                    </p>
                  )}
                </>
              )
            })()}
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
              {getStatusLabel(call.status)}
            </span>
            {call.direction === 'inbound' && (
              <p className="text-xs sm:text-sm font-medium text-blue-600 mt-0.5 sm:mt-1">
                Inbound
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1">
          <span className="truncate">{call.direction === 'inbound' ? 'Inbound Call' : 'Outbound Call'}</span>
          <span>•</span>
          <span>{formatDuration(call.duration_seconds)}</span>
        </div>
        
        {call.transcript && (
          <p className="text-xs sm:text-sm text-gray-700 mb-1 line-clamp-2">
            {call.transcript}
          </p>
        )}
        
        <p className="text-xs text-gray-500">
          {formatTimeAgo(call.created_at)}
        </p>
      </div>
    </div>
  )
}
