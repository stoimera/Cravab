'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SOPVideoPlayer } from './SOPVideoPlayer'
import { SOPTextGuide } from './SOPTextGuide'
import { sopSections, SOPSection } from '@/lib/sop-data'
import { Play, BookOpen, ChevronRight, Clock, Users, Calendar, Bot, DollarSign, Wrench } from 'lucide-react'

const sectionIcons = {
  'getting-started': '🚀',
  'client-management': '👥',
  'appointment-scheduling': '📅',
  'ai-call-handling': '🤖',
  'services-pricing': '💰',
  'troubleshooting': '🔧'
}

const sectionIconComponents = {
  'getting-started': Play,
  'client-management': Users,
  'appointment-scheduling': Calendar,
  'ai-call-handling': Bot,
  'services-pricing': DollarSign,
  'troubleshooting': Wrench
}

export function SOPHub() {
  const [selectedSection, setSelectedSection] = useState<SOPSection | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)

  const handleSectionSelect = (section: SOPSection) => {
    setSelectedSection(section)
    setSelectedVideo(null)
    setSelectedGuide(null)
  }

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId)
    setSelectedGuide(null)
  }

  const handleGuideSelect = (guideId: string) => {
    setSelectedGuide(guideId)
    setSelectedVideo(null)
  }

  const handleBack = () => {
    if (selectedVideo || selectedGuide) {
      setSelectedVideo(null)
      setSelectedGuide(null)
    } else {
      setSelectedSection(null)
    }
  }

  // If a video is selected, show video player
  if (selectedVideo) {
    const video = selectedSection?.videos.find(v => v.id === selectedVideo)
    if (video) {
      return (
        <SOPVideoPlayer
          video={video}
          onBack={handleBack}
        />
      )
    }
  }

  // If a guide is selected, show text guide
  if (selectedGuide) {
    const guide = selectedSection?.guides.find(g => g.id === selectedGuide)
    if (guide) {
      return (
        <SOPTextGuide
          guide={guide}
          onBack={handleBack}
        />
      )
    }
  }

  // If a section is selected, show section content
  if (selectedSection) {
    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="text-2xl">{selectedSection.icon}</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedSection.title}</h2>
            <p className="text-gray-600">{selectedSection.description}</p>
          </div>
        </div>

        {/* Videos Section */}
        {selectedSection.videos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Video Tutorials
            </h3>
            {selectedSection.videos.map((video) => (
              <Card key={video.id} className="mobile-card hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Play className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {video.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {video.duration}
                        </span>
                        <Badge variant="secondary">Video</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVideoSelect(video.id)}
                    >
                      Watch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Text Guides Section */}
        {selectedSection.guides.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Text Guides
            </h3>
            {selectedSection.guides.map((guide) => (
              <Card key={guide.id} className="mobile-card hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {guide.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {guide.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <Badge variant="secondary">Guide</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGuideSelect(guide.id)}
                    >
                      Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Show main sections list
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600">Learn how to use CRAVAB effectively</p>
      </div>

      {sopSections.map((section, index) => {
        const IconComponent = sectionIconComponents[section.id as keyof typeof sectionIconComponents]
        const isLast = index === sopSections.length - 1
        
        return (
          <Card key={section.id} className={`mobile-card hover:bg-gray-50 transition-colors ${isLast ? 'mb-8' : ''}`}>
            <CardContent className="p-0">
              <button
                onClick={() => handleSectionSelect(section)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {section.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{section.videos.length} videos</span>
                    <span>{section.guides.length} guides</span>
                  </div>
                </div>
                
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
