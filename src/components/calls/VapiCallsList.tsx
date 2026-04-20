'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VapiCallCard } from './VapiCallCard';
import { CallDetailsModal } from './CallDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { CallWithClient } from '@/types/database-comprehensive';
import { useCalls } from '@/hooks/useQueries';
import { useAppContext } from '@/contexts/AppContext';

type VapiCall = CallWithClient;

interface VapiCallOld {
  id: string;
  vapi_call_id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer';
  duration_seconds: number | null;
  transcript: string | null;
  ai_summary: string | null;
  ai_sentiment: string | null;
  ai_intent: string | null;
  ai_confidence_score: number | null;
  caller_name: string | null;
  caller_email: string | null;
  caller_address: string | null;
  job_description: string | null;
  job_priority: string | null;
  job_category: string | null;
  preferred_appointment_date: string | null;
  preferred_appointment_time: string | null;
  emergency_service: boolean;
  appointment_created: boolean;
  appointment_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface VapiCallsListProps {
  tenantId: string;
}

export function VapiCallsList({ tenantId }: VapiCallsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [emergencyFilter, setEmergencyFilter] = useState<boolean | null>(null);
  const [selectedCall, setSelectedCall] = useState<VapiCall | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Use React Query for data fetching
  const { data: allCalls = [], isLoading: loading, refetch } = useCalls(tenantId);

  // Type assertion to ensure proper typing
  const typedCalls = allCalls as VapiCall[];

  // Apply filters to the calls data
  const calls = typedCalls.filter(call => {
    // Status filter
    if (statusFilter !== 'all' && call.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && call.priority !== priorityFilter) {
      return false;
    }

    // Emergency filter
    if (emergencyFilter !== null) {
      const isEmergency = call.priority === 'emergency';
      if (emergencyFilter !== isEmergency) {
        return false;
      }
    }

    return true;
  });

  // Filter calls based on search term
  const filteredCalls = calls.filter(call => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      call.clients?.first_name?.toLowerCase().includes(searchLower) ||
      call.clients?.last_name?.toLowerCase().includes(searchLower) ||
      call.from_number?.includes(searchTerm) ||
      call.ai_summary?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (call: VapiCall) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  const handleCreateAppointment = (callId: string) => {
    // TODO: Implement appointment creation from call
    // Create appointment for call
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedCall(null);
  };

  const getCallStats = () => {
    const total = calls.length;
    const completed = calls.filter(c => c.status === 'completed').length;
    const emergency = calls.filter(c => c.priority === 'emergency').length;
    const appointmentsCreated = calls.filter(c => c.follow_up_required).length;

    return { total, completed, emergency, appointmentsCreated };
  };

  const stats = getCallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading calls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Total Calls</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Emergencies</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.emergency}</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Appointments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.appointmentsCreated}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calls by name, phone, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="no_answer">No Answer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setStatusFilter('all');
            setPriorityFilter('all');
            setEmergencyFilter(null);
            setSearchTerm('');
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear
        </Button>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No calls found
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || emergencyFilter !== null
              ? 'Try adjusting your filters'
              : 'Calls will appear here when customers contact you via Vapi AI'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCalls.map((call) => (
            <VapiCallCard
              key={call.id}
              call={call}
              onViewDetails={handleViewDetails}
              onCreateAppointment={handleCreateAppointment}
            />
          ))}
        </div>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
