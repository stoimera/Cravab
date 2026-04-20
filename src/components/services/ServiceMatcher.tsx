'use client'

import { useState } from 'react'
import { useServiceMatching } from '@/hooks/useServiceMatching'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react'

interface ServiceMatcherProps {
  tenantId: string
  onServiceSelected?: (serviceId: string, serviceName: string) => void
}

export function ServiceMatcher({ tenantId, onServiceSelected }: ServiceMatcherProps) {
  const [clientRequest, setClientRequest] = useState('')
  const { findServiceMatch, isLoading, error, lastMatch } = useServiceMatching(tenantId)

  const handleMatch = async () => {
    if (!clientRequest.trim()) return
    
    const match = await findServiceMatch(clientRequest)
    if (match && onServiceSelected) {
      onServiceSelected(match.service.id, match.service.name)
    }
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800'
      case 'keyword': return 'bg-blue-100 text-blue-800'
      case 'general': return 'bg-yellow-100 text-yellow-800'
      case 'none': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact':
      case 'keyword':
      case 'general':
        return <CheckCircle className="h-4 w-4" />
      case 'none':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Service Matcher
          </CardTitle>
          <CardDescription>
            Describe what the client needs and we'll find the best matching service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'My equipment is not working' or 'Need emergency service'"
              value={clientRequest}
              onChange={(e) => setClientRequest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMatch()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleMatch} 
              disabled={isLoading || !clientRequest.trim()}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {lastMatch && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{lastMatch.service.name}</CardTitle>
                  <Badge className={getMatchTypeColor(lastMatch.matchType)}>
                    <div className="flex items-center gap-1">
                      {getMatchTypeIcon(lastMatch.matchType)}
                      {lastMatch.matchType.toUpperCase()}
                    </div>
                  </Badge>
                </div>
                <CardDescription>
                  Match Score: {(lastMatch.matchScore * 100).toFixed(1)}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lastMatch.service.description && (
                  <p className="text-sm text-gray-600">{lastMatch.service.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {lastMatch.service.price && (
                    <span>Price: ${lastMatch.service.price}</span>
                  )}
                  <span>Duration: {lastMatch.service.duration_minutes} min</span>
                  {lastMatch.service.category && (
                    <span>Category: {lastMatch.service.category}</span>
                  )}
                  {lastMatch.service.is_emergency_service && (
                    <Badge variant="destructive" className="text-xs">Emergency</Badge>
                  )}
                </div>

                {lastMatch.matchedKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Matched Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {lastMatch.matchedKeywords.slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {lastMatch.matchedKeywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{lastMatch.matchedKeywords.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {lastMatch.service.id.startsWith('general-service-') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This is a general service match. No specific service was found, 
                      so we're using our comprehensive general service as a fallback.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
