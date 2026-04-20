import { useState, useEffect } from 'react'
import { getTenantTimezone } from '@/lib/timezone-utils'
import { logger } from '@/lib/logger'

export function useTenantTimezone(tenantId: string) {
  const [timezone, setTimezone] = useState<string>('America/Chicago')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const tenantTimezone = await getTenantTimezone(tenantId)
        setTimezone(tenantTimezone)
      } catch (error) {
        logger.error('Error fetching tenant timezone:', error)
        setTimezone('America/Chicago') // fallback
      } finally {
        setLoading(false)
      }
    }

    if (tenantId) {
      fetchTimezone()
    }
  }, [tenantId])

  return { timezone, loading }
}
