'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  AlertTriangle, 
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RuntimeData {
  current_month: {
    minutes_used: number
    minutes_limit: number
    sms_sent: number
    sms_limit: number
    cost: number
    cost_limit: number
  }
  usage_trend: {
    minutes: 'up' | 'down' | 'stable'
    sms: 'up' | 'down' | 'stable'
    cost: 'up' | 'down' | 'stable'
  }
  alerts_enabled: boolean
  billing_portal_url: string
  last_updated: string
}

interface RuntimeMonitoringProps {
  tenantId: string
}

export function RuntimeMonitoring({ tenantId }: RuntimeMonitoringProps) {
  const [data, setData] = useState<RuntimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const fetchRuntimeData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/company/runtime?tenant_id=${tenantId}`)
      const data = await response.json()
      setData(data)
    } catch (error) {
      logger.error('Error fetching runtime data:', error)
      toast('Failed to load runtime data.', {
        description: 'Error'
      })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchRuntimeData()
  }, [tenantId, fetchRuntimeData])

  const toggleAlerts = async () => {
    if (!data) return

    try {
      setUpdating(true)
      const response = await fetch('/api/company/runtime/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          alerts_enabled: !data.alerts_enabled
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update alerts')
      }

      setData(prev => prev ? { ...prev, alerts_enabled: !prev.alerts_enabled } : null)
      
      toast(`80% usage alerts ${!data.alerts_enabled ? 'enabled' : 'disabled'}.`, {
        description: 'Alerts updated'
      })
    } catch (error) {
      toast('Failed to update alerts. Please try again.', {
        description: 'Error'
      })
    } finally {
      setUpdating(false)
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-green-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground font-inter">Failed to load runtime data</p>
        <Button onClick={fetchRuntimeData} className="mt-4 bg-primary hover:bg-primary/90">
          Retry
        </Button>
      </div>
    )
  }

  const minutesPercentage = getUsagePercentage(data?.current_month?.minutes_used || 0, data?.current_month?.minutes_limit || 1000)
  const smsPercentage = getUsagePercentage(data?.current_month?.sms_sent || 0, data?.current_month?.sms_limit || 500)
  const costPercentage = getUsagePercentage(data?.current_month?.cost || 0, data?.current_month?.cost_limit || 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground font-inter">Runtime Monitoring</h2>
          <p className="text-muted-foreground font-inter">Current month usage and billing</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.alerts_enabled}
              onCheckedChange={toggleAlerts}
              disabled={updating}
            />
            <span className="text-foreground font-inter text-sm">80% alerts</span>
          </div>
          
          <Button
            onClick={() => window.open(data.billing_portal_url, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Billing Portal
          </Button>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Minutes Usage */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold text-foreground font-inter">
                  {formatNumber(data?.current_month?.minutes_used || 0)}
                </span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(data?.usage_trend?.minutes || 'stable')}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-inter">of {formatNumber(data?.current_month?.minutes_limit || 1000)}</span>
                  <span className={`font-medium ${getUsageColor(minutesPercentage)}`}>
                    {Math.round(minutesPercentage)}%
                  </span>
                </div>
                <Progress 
                  value={minutesPercentage} 
                  className="h-2"
                />
              </div>
              
              {minutesPercentage >= 80 && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Usage
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMS Usage */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold text-foreground font-inter">
                  {formatNumber(data?.current_month?.sms_sent || 0)}
                </span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(data?.usage_trend?.sms || 'stable')}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-inter">of {formatNumber(data?.current_month?.sms_limit || 500)}</span>
                  <span className={`font-medium ${getUsageColor(smsPercentage)}`}>
                    {Math.round(smsPercentage)}%
                  </span>
                </div>
                <Progress 
                  value={smsPercentage} 
                  className="h-2"
                />
              </div>
              
              {smsPercentage >= 80 && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Usage
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost */}
        <Card className="bg-card border-border sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold text-foreground font-inter">
                  {formatCurrency(data?.current_month?.cost || 0)}
                </span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(data?.usage_trend?.cost || 'stable')}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-inter">of {formatCurrency(data?.current_month?.cost_limit || 100)}</span>
                  <span className={`font-medium ${getUsageColor(costPercentage)}`}>
                    {Math.round(costPercentage)}%
                  </span>
                </div>
                <Progress 
                  value={costPercentage} 
                  className="h-2"
                />
              </div>
              
              {costPercentage >= 80 && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Cost
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground font-inter">
            <span>Last updated: {new Date(data.last_updated).toLocaleString()}</span>
            <Button
              variant="ghost"
              onClick={fetchRuntimeData}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
