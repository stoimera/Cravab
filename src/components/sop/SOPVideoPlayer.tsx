'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SOPVideo } from '@/lib/sop-data'
import { ChevronLeft, Clock, ExternalLink, Play } from 'lucide-react'

interface SOPVideoPlayerProps {
  video: SOPVideo
  onBack: () => void
}

export function SOPVideoPlayer({ video, onBack }: SOPVideoPlayerProps) {
  const handleWatchOnLoom = () => {
    window.open(video.loomUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{video.title}</h2>
          <p className="text-gray-600">{video.description}</p>
        </div>
      </div>

      {/* Video Card */}
      <Card className="mobile-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-red-600" />
              Video Tutorial
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Video Placeholder */}
          <div className="relative bg-gray-100 rounded-lg aspect-video mb-4 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600 font-medium">Click to watch on Loom</p>
              </div>
            </div>
            
            {/* Overlay for click to open */}
            <button
              onClick={handleWatchOnLoom}
              className="absolute inset-0 w-full h-full"
              aria-label="Open video on Loom"
            />
          </div>

          {/* Video Info */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">About this video</h3>
              <p className="text-sm text-gray-600">{video.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-gray-500">
                Duration: {video.duration}
              </div>
              <Button
                onClick={handleWatchOnLoom}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Watch on Loom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Need help?</h4>
          <p className="text-sm text-gray-600 mb-3">
            If you have trouble accessing the video or need additional support, 
            please contact our support team.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              Back to Guides
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
