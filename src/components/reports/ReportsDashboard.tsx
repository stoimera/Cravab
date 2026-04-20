'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard, AnimatedCardGrid } from '@/components/ui/AnimatedCard'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { 
  Phone, 
  Clock, 
  Users, 
  Calendar,
  Camera
} from 'lucide-react'
import { useReportsData, useRealtimeUpdates, useOfflineSupport } from '@/hooks/useQueries'
import { useAuth } from '@/components/providers'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'

interface ReportsData {
  metrics: {
    totalCalls: { value: number; change: number; trend: 'up' | 'down' }
    avgCallTime: { value: number; change: number; trend: 'up' | 'down' }
  }
  quickStats: {
    totalClients: number
    thisWeekNewClients: number
    thisWeekAppointments: number
    thisMonthAppointments: number
    callsToday: number
  }
  period: string
  lastUpdated: string
}

interface ReportsDashboardProps {
  tenantId: string
}

function ReportsDashboardContent({ tenantId }: ReportsDashboardProps) {
  const { user } = useAuth()
  const { shouldAnimate } = useMobileAnimation()
  
  // Use the new global storage hooks
  const { 
    data, 
    isLoading: loading, 
    error: reportsError 
  } = useReportsData(tenantId, '30d')

  // Enable real-time updates and offline support
  useRealtimeUpdates(tenantId)
  useOfflineSupport()

  // Handle errors
  const error = reportsError?.message || ''

  // Use fetched data directly
  const reportsData = data


  const formatChange = (change: number, trend: 'up' | 'down') => {
    const sign = trend === 'up' ? '+' : ''
    return `${sign}${change}% vs last period`
  }

  const getChangeColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? (
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )
  }

  if (loading) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatedCardGrid columns={2} className="gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <AnimatedCard
              key={i}
              loading
              animationType="lift"
              delay={i * 100}
              className="p-4"
            >
              <div />
            </AnimatedCard>
          ))}
        </AnimatedCardGrid>
        <AnimatedCard
          loading
          animationType="lift"
          delay={200}
          className="p-4"
        >
          <div />
        </AnimatedCard>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-red-500">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {error === 'No reports data available' ? 'No Reports Data' : 'Failed to Load Reports'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error === 'No reports data available' 
              ? 'No reports data is available yet. Start making calls and appointments to see your analytics.'
              : 'Unable to load reports data. Please try again.'
            }
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {error === 'No reports data available' ? 'Refresh' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  if (!reportsData || !reportsData.metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Data</h3>
          <p className="text-gray-500 mb-4">
            No reports data is available yet. Start making calls and appointments to see your analytics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <main 
      id="dashboard-content"
      className="space-y-6"
      role="main"
      aria-label="Reports Dashboard"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, staggerChildren: 0.1 }}
      >
        {/* Key Metrics Cards */}
        <section aria-label="Key Performance Metrics">
          <AnimatedCardGrid columns={2} className="gap-4">
        <AnimatedCard
          animationType="lift"
          delay={0}
          className="p-4"
          aria-label="Total Calls Metric"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900" aria-label={`Total calls: ${reportsData.metrics.totalCalls?.value || 0}`}>
            {reportsData.metrics.totalCalls?.value || 0}
          </p>
          <p className={`text-sm flex items-center ${getChangeColor(reportsData.metrics.totalCalls?.trend || 'up')}`} aria-label={`Change: ${formatChange(reportsData.metrics.totalCalls?.change || 0, reportsData.metrics.totalCalls?.trend || 'up')}`}>
            {getChangeIcon(reportsData.metrics.totalCalls?.trend || 'up')}
            {formatChange(reportsData.metrics.totalCalls?.change || 0, reportsData.metrics.totalCalls?.trend || 'up')}
          </p>
        </AnimatedCard>

        <AnimatedCard
          animationType="lift"
          delay={100}
          className="p-4"
        >
          <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Call Time</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportsData.metrics.avgCallTime?.value || 0}m</p>
            <p className={`text-sm flex items-center ${getChangeColor(reportsData.metrics.avgCallTime?.trend || 'up')}`}>
              {getChangeIcon(reportsData.metrics.avgCallTime?.trend || 'up')}
              {formatChange(reportsData.metrics.avgCallTime?.change || 0, reportsData.metrics.avgCallTime?.trend || 'up')}
            </p>
        </AnimatedCard>
          </AnimatedCardGrid>
        </section>

        {/* Quick Stats */}
        <section aria-label="Quick Statistics" className="mt-6">
      <AnimatedCard
        animationType="lift"
        delay={200}
        className="p-4"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Calls Today</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">{reportsData.quickStats?.callsToday || 0}</span>
          </motion.div>
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Total Clients</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">{reportsData.quickStats?.totalClients || 0}</span>
          </motion.div>
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">This Week's New Clients</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">{reportsData.quickStats?.thisWeekNewClients || 0}</span>
          </motion.div>
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">This Week&apos;s Appointments</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">{reportsData.quickStats?.thisWeekAppointments || 0}</span>
          </motion.div>
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">This Month&apos;s Appointments</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">{reportsData.quickStats?.thisMonthAppointments || 0}</span>
          </motion.div>
        </div>
      </AnimatedCard>
        </section>
      </motion.div>
    </main>
  )
}

export function ReportsDashboard({ tenantId }: ReportsDashboardProps) {
  return (
    <APIErrorBoundary context="reports dashboard">
      <ReportsDashboardContent tenantId={tenantId} />
    </APIErrorBoundary>
  )
}
