/**
 * Extract client name from call transcript using common patterns
 */
export function extractNameFromTranscript(transcript: string | null): string | null {
  if (!transcript) return null

  // Common patterns: "John Doe called", "This is John Doe", "My name is John Doe", etc.
  const namePatterns = [
    /(?:called|is|name is|this is|I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:called|says|said|wants|needs|requested)/i,
    /(?:client|customer|caller):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+called/i
  ]

  for (const pattern of namePatterns) {
    const match = transcript.match(pattern)
    if (match && match[1]) {
      const extractedName = match[1].trim()
      // Validate it looks like a name (2-3 words, capitalized)
      const nameParts = extractedName.split(/\s+/)
      if (nameParts.length >= 2 && nameParts.length <= 3 && nameParts.every(part => /^[A-Z][a-z]+$/.test(part))) {
        return extractedName
      }
    }
  }

  return null
}

/**
 * Get display name for a call, prioritizing client name over phone number
 */
export function getCallDisplayName(
  call: {
    clients?: { first_name?: string; last_name?: string; phone?: string } | null
    from_number?: string | null
    transcript?: string | null
  },
  clientLookupCache?: Map<string, { first_name: string; last_name: string } | null>
): { name: string; showPhone: boolean } {
  // Priority 1: Check if client is already joined
  if (call.clients?.first_name || call.clients?.last_name) {
    const name = `${call.clients.first_name || ''} ${call.clients.last_name || ''}`.trim()
    if (name) {
      // Show phone if it exists and is different from client's phone
      const showPhone = !!call.from_number && 
        (!call.clients.phone || call.clients.phone !== call.from_number)
      return {
        name,
        showPhone
      }
    }
  }

  // Priority 2: Extract name from transcript
  const transcriptName = extractNameFromTranscript(call.transcript || null)
  if (transcriptName) {
    return {
      name: transcriptName,
      showPhone: !!call.from_number
    }
  }

  // Priority 3: Look up client by phone number from cache
  if (call.from_number && clientLookupCache) {
    const cached = clientLookupCache.get(call.from_number)
    if (cached) {
      const name = `${cached.first_name || ''} ${cached.last_name || ''}`.trim()
      if (name) {
        return {
          name,
          showPhone: false // Phone already shown as fallback
        }
      }
    }
  }

  // Fallback to phone number
  return {
    name: call.from_number || 'Unknown Caller',
    showPhone: false
  }
}
