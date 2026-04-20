'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneOff, Calendar, Clock } from 'lucide-react'

interface KPIData {
  answerRateToday: number
  answerRate7d: number
  missedCalls: number
  bookedJobs: number
  medianContactTime: number
}

interface CallsKPIsProps {
  data: KPIData
}

export function CallsKPIs({ data }: CallsKPIsProps) {
  const kpis = [
    {
      title: 'Answer Rate (Today)',
      value: `${data.answerRateToday}%`,
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Answer Rate (7d)',
      value: `${data.answerRate7d}%`,
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Missed Calls',
      value: data.missedCalls.toString(),
      icon: PhoneOff,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Booked Jobs',
      value: data.bookedJobs.toString(),
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Median Contact Time',
      value: `${data.medianContactTime}m`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-inter mb-1 truncate">{kpi.title}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-foreground font-inter">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-xl ${kpi.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
