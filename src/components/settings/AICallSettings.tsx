'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Bot, Clock, Phone, MessageSquare, AlertTriangle, Globe, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AICallSettings {
  after_hours_enabled: boolean
  overflow_enabled: boolean
  consent_message: string
  escalation_number: string
  escalation_sla_minutes: number
  barge_in_enabled: boolean
  language: string
  retention_days: number
  max_call_duration_minutes: number
  ai_confidence_threshold: number
  emergency_keywords: string[]
  business_hours_start: string
  business_hours_end: string
}

interface AICallSettingsProps {
  tenantId: string
  initialData?: AICallSettings
}

export function AICallSettings({ tenantId, initialData }: AICallSettingsProps) {
  const [data, setData] = useState<AICallSettings>(initialData || {
    after_hours_enabled: true,
    overflow_enabled: true,
    consent_message: "Hi! I'm an AI assistant for [Company Name]. I can help you schedule appointments, answer questions, or connect you with a human if needed. Is it okay if I assist you today?",
    escalation_number: '',
    escalation_sla_minutes: 5,
    barge_in_enabled: true,
    language: 'en-US',
    retention_days: 90,
    max_call_duration_minutes: 5, // Changed from 3 to 5 minutes for better customer service
    ai_confidence_threshold: 0.7,
    emergency_keywords: ['emergency', 'urgent', 'flood', 'fire', 'gas leak', 'no water', 'sewage backup'], // Better emergency keywords - removed 'leak' and 'burst' as they're not always emergencies
    business_hours_start: '08:00',
    business_hours_end: '17:00'
  })
  const [loading, setLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const { toast } = useToast()

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-US', name: 'Spanish (US)' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' }
  ]

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/company/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenant_id: tenantId })
      })

      if (!response.ok) {
        throw new Error('Failed to save AI settings')
      }

      toast('AI call settings have been updated successfully.', {
        description: 'Settings saved'
      })
    } catch (error) {
      toast('Failed to save settings. Please try again.', {
        description: 'Error'
      })
    } finally {
      setLoading(false)
    }
  }

  const addEmergencyKeyword = () => {
    if (newKeyword.trim() && !data.emergency_keywords.includes(newKeyword.trim().toLowerCase())) {
      setData(prev => ({
        ...prev,
        emergency_keywords: [...prev.emergency_keywords, newKeyword.trim().toLowerCase()]
      }))
      setNewKeyword('')
    }
  }

  const removeEmergencyKeyword = (keyword: string) => {
    setData(prev => ({
      ...prev,
      emergency_keywords: prev.emergency_keywords.filter(k => k !== keyword)
    }))
  }

  return (
    <div className="space-y-6">
      {/* AI Call Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Call Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <Label className="text-foreground font-inter font-medium">After Hours</Label>
                <p className="text-sm text-muted-foreground font-inter">AI handles calls outside business hours</p>
              </div>
              <Switch
                checked={data.after_hours_enabled}
                onCheckedChange={(checked) => setData(prev => ({ ...prev, after_hours_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <Label className="text-foreground font-inter font-medium">Overflow Handling</Label>
                <p className="text-sm text-muted-foreground font-inter">AI handles calls when all humans are busy</p>
              </div>
              <Switch
                checked={data.overflow_enabled}
                onCheckedChange={(checked) => setData(prev => ({ ...prev, overflow_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg sm:col-span-2">
              <div className="flex-1 min-w-0">
                <Label className="text-foreground font-inter font-medium">Barge-in Enabled</Label>
                <p className="text-sm text-muted-foreground font-inter">Humans can interrupt AI conversations</p>
              </div>
              <Switch
                checked={data.barge_in_enabled}
                onCheckedChange={(checked) => setData(prev => ({ ...prev, barge_in_enabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent & Escalation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Consent & Escalation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consent-message" className="text-foreground font-inter">Consent Message</Label>
            <Textarea
              id="consent-message"
              value={data.consent_message}
              onChange={(e) => setData(prev => ({ ...prev, consent_message: e.target.value }))}
              rows={3}
              placeholder="Enter the message AI will use to ask for consent..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="escalation-number" className="text-foreground font-inter">Escalation Number</Label>
              <Input
                id="escalation-number"
                value={data.escalation_number}
                onChange={(e) => setData(prev => ({ ...prev, escalation_number: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="escalation-sla" className="text-foreground font-inter">Escalation SLA (minutes)</Label>
              <Input
                id="escalation-sla"
                type="number"
                value={data.escalation_sla_minutes}
                onChange={(e) => setData(prev => ({ ...prev, escalation_sla_minutes: parseInt(e.target.value) || 5 }))}
                min="1"
                max="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-foreground font-inter">Language</Label>
              <Select value={data.language} onValueChange={(value) => setData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retention-days" className="text-foreground font-inter">Retention Days</Label>
              <Select 
                value={data.retention_days.toString()} 
                onValueChange={(value) => setData(prev => ({ ...prev, retention_days: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days (default)</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-foreground font-inter">Max Call Duration: {data.max_call_duration_minutes} minutes</Label>
              <p className="text-sm text-gray-600">How long the AI will talk before escalating to a human. 5 minutes is recommended for most service calls.</p>
            </div>
            <Slider
              value={[data.max_call_duration_minutes]}
              onValueChange={([value]: number[]) => setData(prev => ({ ...prev, max_call_duration_minutes: value }))}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-foreground font-inter">AI Confidence Threshold: {Math.round(data.ai_confidence_threshold * 100)}%</Label>
              <p className="text-sm text-gray-600">How confident the AI must be before taking action. 70% means it only acts when 70%+ sure. Higher = more cautious, Lower = more aggressive.</p>
            </div>
            <Slider
              value={[data.ai_confidence_threshold]}
              onValueChange={([value]: number[]) => setData(prev => ({ ...prev, ai_confidence_threshold: value }))}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Keywords that trigger emergency response. Only use words that indicate true emergencies (flood, fire, gas leak) - not routine issues like "leak" or "burst".</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add emergency keyword..."
              onKeyPress={(e) => e.key === 'Enter' && addEmergencyKeyword()}
              className="flex-1"
            />
            <Button
              onClick={addEmergencyKeyword}
              disabled={!newKeyword.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {data.emergency_keywords.map((keyword, index) => (
              <Badge
                key={index}
                className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1"
              >
                {keyword}
                <button
                  onClick={() => removeEmergencyKeyword(keyword)}
                  className="ml-1 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          {loading ? 'Saving...' : 'Save AI Settings'}
        </Button>
      </div>
    </div>
  )
}
