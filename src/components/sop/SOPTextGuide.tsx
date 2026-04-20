'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SOPTextGuide as SOPTextGuideType } from '@/lib/sop-data'
import { ChevronLeft, BookOpen, ExternalLink } from 'lucide-react'

interface SOPTextGuideProps {
  guide: SOPTextGuideType
  onBack: () => void
}

export function SOPTextGuide({ guide, onBack }: SOPTextGuideProps) {
  const formatContent = (content: string) => {
    // Convert markdown-like content to HTML
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-gray-900 mb-2 mt-4">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-medium text-gray-900 mb-2 mt-3">$1</h4>')
      .replace(/^\*\* (.*?) \*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4">')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside mb-4">$1</ul>')
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
          <h2 className="text-xl font-bold text-gray-900">{guide.title}</h2>
          <p className="text-gray-600">{guide.description}</p>
        </div>
      </div>

      {/* Guide Content */}
      <Card className="mobile-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Text Guide
            </CardTitle>
            <Badge variant="secondary">Guide</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div 
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700"
            dangerouslySetInnerHTML={{ __html: formatContent(guide.content) }}
          />
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Additional Resources</h4>
          <p className="text-sm text-gray-600 mb-3">
            Need more help? Check out these additional resources:
          </p>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Video Tutorials
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={onBack}>
              Back to Guides
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
