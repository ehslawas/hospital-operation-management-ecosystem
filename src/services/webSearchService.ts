// Web Search Service - For fetching real hospital information from Google
// This service can use various search APIs: Serper, Tavily, Google Custom Search, etc.

export interface SearchResult {
  title: string
  snippet: string
  link: string
}

export interface HospitalSearchResult {
  hospitalName: string
  address?: string
  phone?: string
  email?: string
  website?: string
  searchResults: SearchResult[]
}

/**
 * Search for hospital information using web search
 * This uses a search API to find real information from Google
 * 
 * Options:
 * 1. Serper API (https://serper.dev) - Easy to use, good free tier (2,500 searches/month)
 * 2. Tavily API (https://tavily.com) - AI-powered search
 * 3. Google Custom Search API - Official but requires setup
 * 4. Bing Search API - Alternative option
 */
export async function searchHospitalInfo(hospitalName: string): Promise<HospitalSearchResult> {
  // Try Serper API first (recommended - easy setup, good free tier)
  const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY
  if (SERPER_API_KEY) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${hospitalName} Malaysia hospital contact phone address email`,
          num: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const data = await response.json()
      
      const searchResults: SearchResult[] = (data.organic || []).map((item: any) => ({
        title: item.title || '',
        snippet: item.snippet || '',
        link: item.link || '',
      }))

      // Extract information from search results
      const extracted = extractInfoFromSearchResults(searchResults)

      return {
        hospitalName,
        address: extracted.address,
        phone: extracted.phone,
        email: extracted.email,
        website: searchResults[0]?.link,
        searchResults,
      }
    } catch (error) {
      console.warn('Serper API search failed:', error)
      // Fall through to return empty results
    }
  }

  // Try Tavily API as fallback
  const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY
  if (TAVILY_API_KEY) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${hospitalName} Malaysia hospital contact information`,
          search_depth: 'basic',
          max_results: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`)
      }

      const data = await response.json()
      
      const searchResults: SearchResult[] = (data.results || []).map((item: any) => ({
        title: item.title || '',
        snippet: item.content || '',
        link: item.url || '',
      }))

      const extracted = extractInfoFromSearchResults(searchResults)

      return {
        hospitalName,
        address: extracted.address,
        phone: extracted.phone,
        email: extracted.email,
        website: searchResults[0]?.link,
        searchResults,
      }
    } catch (error) {
      console.warn('Tavily API search failed:', error)
    }
  }
  
  // No search API configured or all failed
  return {
    hospitalName,
    searchResults: [],
  }
}

/**
 * Extract hospital information from search results
 */
export function extractInfoFromSearchResults(results: SearchResult[]): {
  address?: string
  phone?: string
  email?: string
} {
  let address = ''
  let phone = ''
  let email = ''

  const combinedText = results.map((r) => `${r.title} ${r.snippet}`).join(' ')

  // Extract phone
  const phonePatterns = [
    /(\+?6?0?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g,
    /(\(\d{2,3}\)\s?\d{3,4}\s?\d{3,4})/g,
    /Tel[:\s]+(\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/gi,
  ]

  for (const pattern of phonePatterns) {
    const match = combinedText.match(pattern)
    if (match && match[0]) {
      phone = match[0].replace(/Tel[:\s]+/gi, '').trim()
      break
    }
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const emailMatch = combinedText.match(emailPattern)
  if (emailMatch && emailMatch[0]) {
    email = emailMatch[0]
  }

  // Extract address (look for Malaysian address patterns)
  const addressPatterns = [
    /([A-Za-z0-9\s,]+(?:Jalan|Jln|Street|Road|Rd)[A-Za-z0-9\s,]+(?:,\s*\d{4,5}[,\s]+[A-Za-z\s,]+)?)/i,
    /(\d{4,5}[,\s]+[A-Za-z\s,]+(?:,\s*[A-Za-z\s]+)?)/i,
  ]

  for (const pattern of addressPatterns) {
    const match = combinedText.match(pattern)
    if (match && match[0] && match[0].length > 10) {
      address = match[0].trim()
      break
    }
  }

  return {
    address: address || undefined,
    phone: phone || undefined,
    email: email || undefined,
  }
}

