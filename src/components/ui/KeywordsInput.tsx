'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'

interface KeywordsInputProps {
  value: string[]
  onChange: (keywords: string[]) => void
  maxKeywords: number
  minKeywords: number
}

export function KeywordsInput({ value, onChange, maxKeywords, minKeywords }: KeywordsInputProps) {
  const [newKeyword, setNewKeyword] = useState('')

  const addKeyword = () => {
    if (newKeyword.trim() && value.length < maxKeywords && !value.includes(newKeyword.trim().toLowerCase())) {
      onChange([...value, newKeyword.trim().toLowerCase()])
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add keyword..."
          className="flex-1"
          disabled={value.length >= maxKeywords}
        />
        <Button
          type="button"
          onClick={addKeyword}
          disabled={!newKeyword.trim() || value.length >= maxKeywords || value.includes(newKeyword.trim().toLowerCase())}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((keyword, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        {value.length}/{maxKeywords} keywords {minKeywords > 0 ? `(${minKeywords} minimum required)` : '(optional)'}
        {value.length === 0 && (
          <div className="mt-1 text-blue-600">
            💡 Tip: Add keywords like "repair", "install", "maintenance", "service" to help AI match your service
          </div>
        )}
      </div>
    </div>
  )
}
