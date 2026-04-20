'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Clock, 
  User, 
  MapPin, 
  MessageSquare, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { CallWithClient } from '@/types/database-comprehensive';

type VapiCall = CallWithClient;

interface VapiCallCardProps {
  call: VapiCall;
  onViewDetails?: (call: VapiCall) => void;
  onCreateAppointment?: (callId: string) => void;
}

export function VapiCallCard({ call, onViewDetails, onCreateAppointment }: VapiCallCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'busy':
      case 'no_answer':
        return 'bg-red-100 text-red-800';
      case 'queued':
      case 'ringing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFollowUpUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'standard':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'N/A';
    // Simple formatting for US numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {call.clients ? `${call.clients.first_name} ${call.clients.last_name}` : 'Unknown Caller'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {call.from_number || 'Unknown Number'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(call.status)}>
              {call.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {call.priority === 'emergency' && (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                EMERGENCY
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Call Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span>{formatDuration(call.duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Time:</span>
            <span>{formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Transcript */}
        {call.transcript && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Transcript:</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {call.transcript}
            </p>
          </div>
        )}

        {/* Priority */}
        {call.priority && call.priority !== 'normal' && (
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(call.priority)}>
              {call.priority.toUpperCase()} PRIORITY
            </Badge>
          </div>
        )}

        {/* Contact Information */}
        {call.clients && (call.clients.email || call.clients.address) && (
          <div className="space-y-2">
            {call.clients.email && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{call.clients.email}</span>
              </div>
            )}
            {call.clients.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Address:</span>
                <span className="truncate">{call.clients.address}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {call.ai_summary && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Summary:</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {call.ai_summary}
            </p>
            {(call.ai_sentiment || call.ai_intent) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                {call.ai_sentiment && (
                  <span>Sentiment: {call.ai_sentiment}</span>
                )}
                {call.ai_intent && (
                  <span>• Intent: {call.ai_intent}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Follow-up Status */}
        {call.follow_up_required && (
          <div className="flex items-center gap-2">
            <Badge 
              className={`${getFollowUpUrgencyColor(call.follow_up_urgency)} border`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {call.follow_up_urgency === 'emergency' ? 'EMERGENCY' :
               call.follow_up_urgency === 'urgent' ? 'URGENT' :
               'Follow-up Required'}
            </Badge>
            {call.follow_up_callback_timeframe && (
              <span className="text-xs text-gray-600">
                {call.follow_up_callback_timeframe}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(call)}
            >
              View Details
            </Button>
          )}
          {onCreateAppointment && (
            <Button
              size="sm"
              onClick={() => onCreateAppointment(call.id)}
            >
              Create Appointment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
