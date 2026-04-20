import { logger } from '@/lib/logger'
export interface ServiceMatch {
  service: {
    id: string
    name: string
    description: string | null
    price: number | null
    duration_minutes: number
    category: string | null
    is_emergency_service: boolean | null
  }
  matchScore: number
  matchType: 'exact' | 'keyword' | 'general' | 'none'
  matchedKeywords: string[]
}

export interface TenantService {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number
  category: string | null
  is_emergency_service: boolean | null
  keywords?: string[] // Optional custom keywords for tenant services
}

/**
 * Service matching utility that matches client requests to available services
 * Falls back to general service if no specific service matches
 * Uses tenant-specific services and keywords from database
 */
export class ServiceMatcher {

  /**
   * Find the best matching service for a client request
   * @param clientRequest - The client's service request description
   * @param tenantServices - Array of tenant's configured services from database
   * @param tenantId - Tenant ID for general service lookup
   * @param supabaseClient - Optional Supabase client for loading general service from database
   */
  async findBestMatch(
    clientRequest: string,
    tenantServices: TenantService[],
    tenantId: string,
    supabaseClient?: any
  ): Promise<ServiceMatch> {
    const normalizedRequest = this.normalizeText(clientRequest)
    
    // First, try to match against tenant's specific services
    const tenantMatch = this.matchTenantServices(normalizedRequest, tenantServices)
    if (tenantMatch.matchType !== 'none') {
      return tenantMatch
    }

    // If no tenant service matches, try to find general service from tenant's services
    // or create a generic fallback
    return this.matchGeneralService(normalizedRequest, tenantId, tenantServices, supabaseClient)
  }

  /**
   * Match against tenant's specific services
   */
  private matchTenantServices(
    normalizedRequest: string,
    tenantServices: TenantService[]
  ): ServiceMatch {
    let bestMatch: ServiceMatch | null = null
    let highestScore = 0

    for (const service of tenantServices) {
      const match = this.calculateServiceMatch(normalizedRequest, service)
      
      if (match.matchScore > highestScore) {
        highestScore = match.matchScore
        bestMatch = match
      }
    }

    // Return best match if score is above threshold, otherwise no match
    return bestMatch && highestScore > 0.3 
      ? bestMatch 
      : this.createNoMatchResult()
  }

  /**
   * Match against general service (fallback when no specific service matches)
   * Tries to find a "General Service" from tenant's services, or creates generic fallback
   */
  private async matchGeneralService(
    normalizedRequest: string, 
    tenantId: string, 
    tenantServices: TenantService[],
    supabaseClient?: any
  ): Promise<ServiceMatch> {
    // First, try to find a "General Service" in tenant's services
    const generalService = tenantServices.find(service => {
      const name = this.normalizeText(service.name)
      return name.includes('general') || 
             name.includes('catch-all') || 
             name.includes('misc') ||
             service.category === 'general'
    })

    let generalKeywords: string[] = []
    let emergencyKeywords: string[] = []
    let serviceName = "General Service"
    let serviceDescription = "Comprehensive service for various issues."
    let serviceId = `general-service-${tenantId}`

    // If tenant has a general service, use its keywords
    if (generalService) {
      serviceId = generalService.id
      serviceName = generalService.name
      serviceDescription = generalService.description || serviceDescription
      generalKeywords = generalService.keywords || []
      
      // Extract keywords from description if no explicit keywords
      if (generalKeywords.length === 0 && generalService.description) {
        const descWords = this.normalizeText(generalService.description).split(/\s+/)
        generalKeywords = descWords.filter(word => word.length > 3) // Filter out short words
      }
    } else if (supabaseClient) {
      // Try to load general service from database
      try {
        const { data: generalServiceData } = await supabaseClient
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .or('name.ilike.%general%,name.ilike.%catch-all%,category.eq.general')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (generalServiceData) {
          serviceId = generalServiceData.id
          serviceName = generalServiceData.name
          serviceDescription = generalServiceData.description || serviceDescription
          generalKeywords = generalServiceData.keywords || []
        }
      } catch (error) {
        // Database query failed, use fallback
        logger.warn('Could not load general service from database:', error)
      }
    }

    // If still no keywords, use generic fallback
    if (generalKeywords.length === 0) {
      generalKeywords = ['repair', 'service', 'help', 'fix', 'maintenance', 'work', 'issue', 'problem']
    }

    // Emergency keywords are always generic
    emergencyKeywords = ['emergency', 'urgent', 'asap', 'immediately', 'now', 'flooding', 'burst', 'leak', 'broken', 'damage']
    
    let matchedKeywords: string[] = []
    let matchScore = 0

    // Check for emergency keywords first (higher priority)
    const emergencyMatches = this.findMatchingKeywords(normalizedRequest, emergencyKeywords)
    if (emergencyMatches.length > 0) {
      matchScore = Math.min(emergencyMatches.length * 0.4, 0.9) // Higher score for emergency
      matchedKeywords.push(...emergencyMatches)
    } else {
      // Check general keywords
      const keywordMatches = this.findMatchingKeywords(normalizedRequest, generalKeywords)
      if (keywordMatches.length > 0) {
        matchScore = Math.min(keywordMatches.length * 0.2, 0.7) // Lower score for general
        matchedKeywords.push(...keywordMatches)
      }
    }

    // Also check if request matches description words
    if (serviceDescription && matchedKeywords.length === 0) {
      const descWords = this.normalizeText(serviceDescription).split(/\s+/)
      const descMatches = this.findMatchingKeywords(normalizedRequest, descWords.filter(w => w.length > 3))
      if (descMatches.length > 0) {
        matchScore = Math.min(matchScore + descMatches.length * 0.15, 0.7)
        matchedKeywords.push(...descMatches)
      }
    }

    return {
      service: {
        id: serviceId,
        name: serviceName,
        description: serviceDescription,
        price: generalService?.price || null,
        duration_minutes: generalService?.duration_minutes || 60,
        category: 'general',
        is_emergency_service: this.isEmergencyRequest(normalizedRequest) || generalService?.is_emergency_service || false
      },
      matchScore,
      matchType: matchScore > 0.2 ? 'general' : 'none',
      matchedKeywords
    }
  }

  /**
   * Calculate match score for a specific service
   */
  private calculateServiceMatch(normalizedRequest: string, service: TenantService): ServiceMatch {
    const matchedKeywords: string[] = []
    let matchScore = 0

    // 1. Check custom keywords first (highest priority)
    if (service.keywords && service.keywords.length > 0) {
      const keywordMatches = this.findMatchingKeywords(normalizedRequest, service.keywords)
      if (keywordMatches.length > 0) {
        // Highest weight for tenant-specific keywords
        matchScore += keywordMatches.length * 0.6
        matchedKeywords.push(...keywordMatches)
      }
    }

    // 2. Check service name (partial and full matches)
    const serviceName = this.normalizeText(service.name)
    const serviceWords = serviceName.split(' ')
    
    // Full service name match
    if (normalizedRequest.includes(serviceName) || serviceName.includes(normalizedRequest)) {
      matchScore += 0.8
      matchedKeywords.push(service.name)
    } else {
      // Partial word matches in service name
      const nameMatches = this.findMatchingKeywords(normalizedRequest, serviceWords)
      if (nameMatches.length > 0) {
        matchScore += nameMatches.length * 0.4
        matchedKeywords.push(...nameMatches)
      }
    }

    // 3. Check service description (enhanced matching)
    if (service.description) {
      const description = this.normalizeText(service.description)
      const descriptionWords = description.split(/\s+/).filter(word => word.length > 2) // Filter out short words
      
      // Check for exact phrase matches in description
      if (normalizedRequest.length > 5) {
        // Check if significant parts of request appear in description
        const requestWords = normalizedRequest.split(/\s+/).filter(w => w.length > 3)
        const phraseMatches = requestWords.filter(word => description.includes(word))
        if (phraseMatches.length > 0) {
          matchScore += phraseMatches.length * 0.35 // Higher weight for description matches
          matchedKeywords.push(...phraseMatches)
        }
      }
      
      // Also check individual word matches
      const descriptionMatches = this.findMatchingKeywords(normalizedRequest, descriptionWords)
      if (descriptionMatches.length > 0) {
        matchScore += descriptionMatches.length * 0.3
        matchedKeywords.push(...descriptionMatches.filter(k => !matchedKeywords.includes(k)))
      }
    }

    // 4. Check category
    if (service.category) {
      const category = this.normalizeText(service.category)
      if (normalizedRequest.includes(category) || category.includes(normalizedRequest)) {
        matchScore += 0.4
        matchedKeywords.push(service.category)
      }
    }

    // 5. Check for emergency service indicators
    if (service.is_emergency_service) {
      const emergencyKeywords = ['emergency', 'urgent', 'asap', 'immediately', 'now', 'flood', 'burst', 'leak', 'flooding']
      const emergencyMatches = this.findMatchingKeywords(normalizedRequest, emergencyKeywords)
      if (emergencyMatches.length > 0) {
        matchScore += 0.3
        matchedKeywords.push(...emergencyMatches)
      }
    }

    return {
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        category: service.category,
        is_emergency_service: service.is_emergency_service
      },
      matchScore: Math.min(matchScore, 1), // Cap at 1.0
      matchType: matchScore > 0.7 ? 'exact' : matchScore > 0.3 ? 'keyword' : 'none',
      matchedKeywords
    }
  }

  /**
   * Find keywords that match the request
   */
  private findMatchingKeywords(request: string, keywords: string[]): string[] {
    return keywords.filter(keyword => {
      const normalizedKeyword = this.normalizeText(keyword)
      return request.includes(normalizedKeyword) || normalizedKeyword.includes(request)
    })
  }

  /**
   * Calculate score based on keyword matches
   */
  private calculateKeywordScore(request: string, matchedKeywords: string[]): number {
    if (matchedKeywords.length === 0) return 0

    const totalKeywords = matchedKeywords.length
    const requestWords = request.split(' ').length
    const keywordDensity = totalKeywords / requestWords

    // Base score from keyword density, with bonus for multiple matches
    return Math.min(keywordDensity * 0.5 + (totalKeywords * 0.1), 1.0)
  }

  /**
   * Check if request indicates emergency
   */
  private isEmergencyRequest(request: string): boolean {
    const emergencyKeywords = [
      'emergency', 'urgent', 'asap', 'immediately', 'now', 'flooding',
      'burst', 'leaking', 'flooded', 'water everywhere', 'stop leak',
      'prevent damage', 'safety hazard', 'health hazard'
    ]
    
    return emergencyKeywords.some(keyword => 
      this.normalizeText(request).includes(this.normalizeText(keyword))
    )
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Create no match result
   */
  private createNoMatchResult(): ServiceMatch {
    return {
      service: {
        id: '',
        name: '',
        description: null,
        price: null,
        duration_minutes: 0,
        category: null,
        is_emergency_service: false
      },
      matchScore: 0,
      matchType: 'none',
      matchedKeywords: []
    }
  }

  /**
   * Get all available keywords for a tenant (tenant services + general service)
   */
  getAvailableKeywords(tenantServices: TenantService[]): string[] {
    const keywords = new Set<string>()
    
    // Add tenant service keywords
    tenantServices.forEach(service => {
      if (service.keywords) {
        service.keywords.forEach(keyword => keywords.add(keyword))
      }
      // Add service name words as keywords
      const nameWords = this.normalizeText(service.name).split(/\s+/)
      nameWords.forEach(word => {
        if (word.length > 2) keywords.add(word)
      })
      // Add description words as keywords
      if (service.description) {
        const descWords = this.normalizeText(service.description).split(/\s+/)
        descWords.forEach(word => {
          if (word.length > 3) keywords.add(word) // Only longer words from description
        })
      }
    })
    
    return Array.from(keywords)
  }
}

// Export singleton instance
export const serviceMatcher = new ServiceMatcher()

// Export helper functions
export async function findServiceMatch(
  clientRequest: string,
  tenantServices: TenantService[],
  tenantId: string,
  supabaseClient?: any
): Promise<ServiceMatch> {
  return serviceMatcher.findBestMatch(clientRequest, tenantServices, tenantId, supabaseClient)
}

export function getServiceKeywords(tenantServices: TenantService[]): string[] {
  return serviceMatcher.getAvailableKeywords(tenantServices)
}
