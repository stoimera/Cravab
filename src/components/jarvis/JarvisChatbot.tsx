'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User, X } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  message: string
  timestamp: Date
  intent?: string
  response_source?: string
  confidence_score?: number
}

interface JarvisChatbotProps {
  isOpen: boolean
}

export function JarvisChatbot({ isOpen }: JarvisChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chatbot opens
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        message: 'Hello! I\'m Jarvis, your AI assistant to help you navigate CRAVAB. What can I help you with today?',
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.message,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        message: data.message,
        timestamp: new Date(),
        intent: data.intent,
        response_source: data.response_source,
        confidence_score: data.confidence_score
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      logger.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        message: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }


  const quickQuestions = [
    "How do I create a new appointment?",
    "How do I add a new client?",
    "How do I manage my services?",
    "How do I view my call history?",
    "How do I access SOP materials?",
    "How do I configure notifications?"
  ]

  if (!isOpen) return null

  return (
    <div className="h-[calc(100vh-80px)] bg-white flex flex-col relative">
      {/* Chat Area - Takes up remaining space with proper spacing */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'assistant' && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.response_source && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {message.response_source}
                        </Badge>
                        {message.confidence_score && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence_score * 100)}% confident
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Jarvis is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area - Positioned directly above bottom nav */}
      <div className="absolute bottom-16 left-0 right-0 p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Jarvis anything..."
            disabled={isLoading}
            className="flex-1 rounded-lg"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className={`rounded-full w-10 h-10 p-0 ${
              !inputMessage.trim() || isLoading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
