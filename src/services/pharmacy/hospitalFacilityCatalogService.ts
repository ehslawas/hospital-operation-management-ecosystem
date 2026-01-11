/**
 * Hospital Facility Catalog Service
 * Handles CRUD operations for Hospital Facilities in Malaysia
 * Data sourced from Ministry of Health Malaysia (MOH)
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  HospitalFacility,
  HospitalFacilityWithRelations,
  HospitalFacilityCatalogKPIs,
  HospitalFacilityCatalogFilter,
} from '@/types/pharmacy'

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all hospital facilities with optional filters
 */
export async function getHospitalFacilities(
  hospitalId: string,
  filter?: HospitalFacilityCatalogFilter
): Promise<ApiResponse<HospitalFacilityWithRelations[]>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback - use localStorage
      const localData = localStorage.getItem(`hospital_facilities_${hospitalId}`)
      const facilities: HospitalFacilityWithRelations[] = localData ? JSON.parse(localData) : []
      
      let filtered = facilities
      
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        filtered = filtered.filter(
          f =>
            f.name?.toLowerCase().includes(searchLower) ||
            f.address?.toLowerCase().includes(searchLower) ||
            f.city?.toLowerCase().includes(searchLower) ||
            f.state?.toLowerCase().includes(searchLower)
        )
      }
      
      if (filter?.state && filter.state !== 'all') {
        filtered = filtered.filter(f => f.state === filter.state)
      }
      
      if (filter?.city && filter.city !== 'all') {
        filtered = filtered.filter(f => f.city === filter.city)
      }
      
      if (filter?.status && filter.status !== 'all') {
        filtered = filtered.filter(f => f.status === filter.status)
      }
      
      return { data: filtered, error: null }
    }

    // Build Supabase query
    let query = supabase
      .from('hospital_facilities')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name', { ascending: true })

    // Apply filters
    if (filter?.search) {
      // For search with special characters, we need to escape properly
      // Replace % and _ which are wildcards in SQL LIKE, and escape single quotes
      // Then wrap in % for ilike pattern matching
      const searchTerm = filter.search
        .replace(/%/g, '\\%')  // Escape % wildcard
        .replace(/_/g, '\\_')  // Escape _ wildcard
        .replace(/'/g, "''")   // Escape single quotes for SQL
      const searchPattern = `%${searchTerm}%`
      
      // Use .or() with properly escaped patterns
      // Note: For special characters, we may need to use textSearch instead if issues persist
      query = query.or(
        `name.ilike.${searchPattern},address.ilike.${searchPattern},city.ilike.${searchPattern},state.ilike.${searchPattern}`
      )
    }

    if (filter?.state && filter.state !== 'all') {
      query = query.eq('state', filter.state)
    }

    if (filter?.city && filter.city !== 'all') {
      query = query.eq('city', filter.city)
    }

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching hospital facilities:', error)
      return { data: null, error: error.message }
    }

    return { data: data as HospitalFacilityWithRelations[], error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hospital facilities'
    console.error('Error in getHospitalFacilities:', error)
    return { data: null, error: message }
  }
}

/**
 * Get hospital facility by ID
 */
export async function getHospitalFacilityById(
  facilityId: string
): Promise<ApiResponse<HospitalFacilityWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback - search all stored facilities
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('hospital_facilities_'))
      for (const key of allKeys) {
        const facilities: HospitalFacilityWithRelations[] = JSON.parse(localStorage.getItem(key) || '[]')
        const facility = facilities.find(f => f.id === facilityId)
        if (facility) {
          return { data: facility, error: null }
        }
      }
      return { data: null, error: 'Hospital facility not found' }
    }

    const { data, error } = await supabase
      .from('hospital_facilities')
      .select('*')
      .eq('id', facilityId)
      .single()

    if (error) {
      console.error('Error fetching hospital facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as HospitalFacilityWithRelations, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hospital facility'
    console.error('Error in getHospitalFacilityById:', error)
    return { data: null, error: message }
  }
}

/**
 * Create a new hospital facility
 */
export async function createHospitalFacility(
  hospitalId: string,
  facility: Omit<HospitalFacility, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>
): Promise<ApiResponse<HospitalFacilityWithRelations>> {
  try {
    const newFacility: Omit<HospitalFacility, 'id' | 'created_at' | 'updated_at'> = {
      ...facility,
      hospital_id: hospitalId,
    }

    if (!isSupabaseConfigured()) {
      // Local fallback
      const localData = localStorage.getItem(`hospital_facilities_${hospitalId}`)
      const facilities: HospitalFacilityWithRelations[] = localData ? JSON.parse(localData) : []
      
      const facilityWithId: HospitalFacilityWithRelations = {
        ...newFacility,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      facilities.push(facilityWithId)
      localStorage.setItem(`hospital_facilities_${hospitalId}`, JSON.stringify(facilities))
      
      return { data: facilityWithId, error: null }
    }

    const { data, error } = await supabase
      .from('hospital_facilities')
      .insert(newFacility)
      .select()
      .single()

    if (error) {
      console.error('Error creating hospital facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as HospitalFacilityWithRelations, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create hospital facility'
    console.error('Error in createHospitalFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Update hospital facility
 */
export async function updateHospitalFacility(
  facilityId: string,
  updates: Partial<Omit<HospitalFacility, 'id' | 'created_at' | 'hospital_id'>>
): Promise<ApiResponse<HospitalFacilityWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('hospital_facilities_'))
      for (const key of allKeys) {
        const facilities: HospitalFacilityWithRelations[] = JSON.parse(localStorage.getItem(key) || '[]')
        const index = facilities.findIndex(f => f.id === facilityId)
        if (index !== -1) {
          facilities[index] = {
            ...facilities[index],
            ...updates,
            updated_at: new Date().toISOString(),
          }
          localStorage.setItem(key, JSON.stringify(facilities))
          return { data: facilities[index], error: null }
        }
      }
      return { data: null, error: 'Hospital facility not found' }
    }

    const { data, error } = await supabase
      .from('hospital_facilities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', facilityId)
      .select()
      .single()

    if (error) {
      console.error('Error updating hospital facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as HospitalFacilityWithRelations, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update hospital facility'
    console.error('Error in updateHospitalFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Delete hospital facility
 */
export async function deleteHospitalFacility(facilityId: string): Promise<ApiResponse<void>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('hospital_facilities_'))
      for (const key of allKeys) {
        const facilities: HospitalFacilityWithRelations[] = JSON.parse(localStorage.getItem(key) || '[]')
        const filtered = facilities.filter(f => f.id !== facilityId)
        if (filtered.length !== facilities.length) {
          localStorage.setItem(key, JSON.stringify(filtered))
          return { data: undefined, error: null }
        }
      }
      return { data: null, error: 'Hospital facility not found' }
    }

    const { error } = await supabase.from('hospital_facilities').delete().eq('id', facilityId)

    if (error) {
      console.error('Error deleting hospital facility:', error)
      return { data: null, error: error.message }
    }

    return { data: undefined, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete hospital facility'
    console.error('Error in deleteHospitalFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Batch import hospital facilities (e.g., from MOH website or Excel)
 */
export async function batchImportHospitalFacilities(
  hospitalId: string,
  facilities: Array<Omit<HospitalFacility, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>>,
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
  try {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < facilities.length; i++) {
      try {
        const result = await createHospitalFacility(hospitalId, facilities[i])
        if (result.data) {
          success++
        } else {
          failed++
          errors.push(`Row ${i + 1}: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        failed++
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: facilities.length,
          success,
          failed,
        })
      }
    }

    return {
      data: {
        success,
        failed,
        errors: errors.slice(0, 100), // Limit errors to first 100
      },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import hospital facilities'
    console.error('Error in batchImportHospitalFacilities:', error)
    return { data: null, error: message }
  }
}

/**
 * Get hospital facility catalog KPIs
 */
export async function getHospitalFacilityKPIs(
  hospitalId: string
): Promise<ApiResponse<HospitalFacilityCatalogKPIs>> {
  try {
    const result = await getHospitalFacilities(hospitalId)
    
    if (!result.data) {
      return {
        data: {
          total: 0,
          by_state: [],
          by_city: [],
        },
        error: null,
      }
    }

    const facilities = result.data

    // Count by state
    const stateCounts: Record<string, number> = {}
    facilities.forEach(f => {
      if (f.state) {
        stateCounts[f.state] = (stateCounts[f.state] || 0) + 1
      }
    })

    // Count by city
    const cityCounts: Record<string, number> = {}
    facilities.forEach(f => {
      if (f.city) {
        const key = `${f.city}, ${f.state || ''}`
        cityCounts[key] = (cityCounts[key] || 0) + 1
      }
    })

    const kpis: HospitalFacilityCatalogKPIs = {
      total: facilities.length,
      by_state: Object.entries(stateCounts).map(([state, count]) => ({ state, count })),
      by_city: Object.entries(cityCounts).map(([city, count]) => ({ city, count })),
    }

    return { data: kpis, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch KPIs'
    console.error('Error in getHospitalFacilityKPIs:', error)
    return { data: null, error: message }
  }
}

/**
 * Export hospital facilities to CSV
 */
export async function exportHospitalFacilities(
  hospitalId: string,
  filter?: HospitalFacilityCatalogFilter
): Promise<ApiResponse<Blob>> {
  try {
    const result = await getHospitalFacilities(hospitalId, filter)
    
    if (!result.data) {
      return { data: null, error: result.error || 'Failed to fetch facilities' }
    }

    // Create CSV content
    const headers = ['Name', 'Address', 'City', 'State', 'Phone', 'Email', 'Status']
    const rows = result.data.map(f => [
      f.name || '',
      f.address || '',
      f.city || '',
      f.state || '',
      f.phone || '',
      f.email || '',
      f.status || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    return { data: blob, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export facilities'
    console.error('Error in exportHospitalFacilities:', error)
    return { data: null, error: message }
  }
}

/**
 * Fetch hospitals from MOH website
 * Scrapes data from: https://www.moh.gov.my/index.php/database_stores/store_view/82
 */
export async function fetchHospitalsFromMOH(): Promise<ApiResponse<Array<{
  name: string
  address: string
  city: string
  state: string
  moh_id?: string
}>>> {
  try {
    const MOH_URL = 'https://www.moh.gov.my/index.php/database_stores/store_view/82'
    const hospitals: Array<{
      name: string
      address: string
      city: string
      state: string
      moh_id?: string
    }> = []

    // Use CORS proxy to fetch the MOH website (browser CORS limitation)
    // Alternatively, this could be done server-side via a backend API
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(MOH_URL)}`
    
    try {
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      
      // Parse HTML to extract hospital data
      // The MOH website has a table with hospital data
      // We'll use regex to extract table rows (basic parsing)
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Find the table with hospital data
      const tables = doc.querySelectorAll('table')
      let hospitalTable: HTMLTableElement | null = null

      for (const table of Array.from(tables)) {
        const headers = table.querySelectorAll('th')
        const headerText = Array.from(headers).map(h => h.textContent?.trim().toLowerCase() || '').join(' ')
        
        if (headerText.includes('name') && headerText.includes('hospital') && headerText.includes('alamat')) {
          hospitalTable = table as HTMLTableElement
          break
        }
      }

      if (!hospitalTable) {
        // Fallback: try to find table by looking for specific patterns
        const allTables = doc.querySelectorAll('table')
        for (const table of Array.from(allTables)) {
          const rows = table.querySelectorAll('tr')
          if (rows.length > 10) { // Likely the hospital table
            hospitalTable = table as HTMLTableElement
            break
          }
        }
      }

      if (hospitalTable) {
        const rows = hospitalTable.querySelectorAll('tr')
        
        // Skip header row (index 0) and iterate through data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const cells = row.querySelectorAll('td')
          
          if (cells.length >= 5) {
            // Extract data from cells
            // Format: No. | Name Hospital | Alamat 1 | Bandar | Negeri | View
            const nameCell = cells[1]?.textContent?.trim()
            const addressCell = cells[2]?.textContent?.trim()
            const cityCell = cells[3]?.textContent?.trim()
            const stateCell = cells[4]?.textContent?.trim()
            
            // Extract MOH ID from View link if available
            const viewLink = cells[5]?.querySelector('a')?.getAttribute('href')
            let mohId: string | undefined
            if (viewLink) {
              const match = viewLink.match(/store_view_page\/82\/(\d+)/)
              if (match) {
                mohId = match[1]
              }
            }

            if (nameCell && nameCell !== 'Name Hospital') {
              hospitals.push({
                name: nameCell,
                address: addressCell || '',
                city: cityCell || '',
                state: stateCell || '',
                moh_id: mohId,
              })
            }
          }
        }
      }

      // Handle pagination - MOH website has multiple pages (25 per page)
      // URL format: ?items=25&page=N (confirmed from MOH website)
      // There are 6 pages total with 147 hospitals (pages 1-6)
      console.log(`Found ${hospitals.length} hospitals on first page, fetching additional pages...`)
      
      // Helper function to fetch with retry and multiple CORS proxy fallbacks
      const fetchWithRetry = async (url: string, maxRetries = 3): Promise<string | null> => {
        const corsProxies = [
          'https://api.allorigins.win/raw?url=',
          'https://corsproxy.io/?',
          'https://api.codetabs.com/v1/proxy?quest=',
        ]
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          for (let proxyIndex = 0; proxyIndex < corsProxies.length; proxyIndex++) {
            try {
              const proxyUrl = corsProxies[proxyIndex] + encodeURIComponent(url)
              
              // Add timeout to avoid hanging
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
              
              const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              
              clearTimeout(timeoutId)
              
              if (response.ok) {
                const html = await response.text()
                if (html && html.length > 1000) { // Basic validation that we got content
                  return html
                }
              }
            } catch (error) {
              console.warn(`Proxy ${proxyIndex + 1}, attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error)
              // Try next proxy
              continue
            }
            
            // Add small delay between proxy attempts
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          // Add exponential backoff between retry attempts
          if (attempt < maxRetries - 1) {
            const delay = Math.min(2000 * Math.pow(2, attempt), 10000) // Max 10 seconds
            console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
        
        return null
      }
      
      const maxPagesToFetch = 6 // Total of 6 pages for 147 hospitals
      
      for (let pageNum = 2; pageNum <= maxPagesToFetch; pageNum++) {
        try {
          // Use the correct pagination format: ?items=25&page=N
          const pageUrl = `${MOH_URL}?items=25&page=${pageNum}`
          
          console.log(`Fetching page ${pageNum}...`)
          const pageHtml = await fetchWithRetry(pageUrl)
          
          if (!pageHtml) {
            console.warn(`Failed to fetch page ${pageNum} after retries, continuing with next page...`)
            // Continue to next page instead of breaking
            // Add a longer delay before next page to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          const pageDoc = parser.parseFromString(pageHtml, 'text/html')
          
          // Find hospital table on this page
          const pageTables = pageDoc.querySelectorAll('table')
          let pageHospitalTable: HTMLTableElement | null = null
          
          for (const table of Array.from(pageTables)) {
            const headers = table.querySelectorAll('th')
            const headerText = Array.from(headers).map(h => h.textContent?.trim().toLowerCase() || '').join(' ')
            
            if ((headerText.includes('name') && headerText.includes('hospital')) || 
                (headerText.includes('alamat') && headerText.includes('bandar'))) {
              pageHospitalTable = table as HTMLTableElement
              break
            }
          }
          
          if (!pageHospitalTable) {
            // Try fallback - find table with many rows
            for (const table of Array.from(pageTables)) {
              const rows = table.querySelectorAll('tr')
              if (rows.length > 10) {
                pageHospitalTable = table as HTMLTableElement
                break
              }
            }
          }
          
          if (pageHospitalTable) {
            const pageRows = pageHospitalTable.querySelectorAll('tr')
            const hospitalsBeforePage = hospitals.length
            
            for (let i = 1; i < pageRows.length; i++) {
              const row = pageRows[i]
              const cells = row.querySelectorAll('td')
              
              if (cells.length >= 5) {
                const nameCell = cells[1]?.textContent?.trim()
                const addressCell = cells[2]?.textContent?.trim()
                const cityCell = cells[3]?.textContent?.trim()
                const stateCell = cells[4]?.textContent?.trim()
                
                const viewLink = cells[5]?.querySelector('a')?.getAttribute('href')
                let mohId: string | undefined
                if (viewLink) {
                  const match = viewLink.match(/store_view_page\/82\/(\d+)/)
                  if (match) {
                    mohId = match[1]
                  }
                }
                
                if (nameCell && nameCell !== 'Name Hospital') {
                  // Check if we already have this hospital (by name and moh_id)
                  const isDuplicate = hospitals.some(
                    h => h.name.toLowerCase() === nameCell.toLowerCase() ||
                         (h.moh_id && mohId && h.moh_id === mohId)
                  )
                  
                  if (!isDuplicate) {
                    hospitals.push({
                      name: nameCell,
                      address: addressCell || '',
                      city: cityCell || '',
                      state: stateCell || '',
                      moh_id: mohId,
                    })
                  }
                }
              }
            }
            
            const hospitalsAdded = hospitals.length - hospitalsBeforePage
            console.log(`Page ${pageNum}: Added ${hospitalsAdded} hospitals (Total: ${hospitals.length})`)
            
            // If this page didn't add any new hospitals, we've reached the end
            if (hospitalsAdded === 0) {
              console.log(`Page ${pageNum} had no new hospitals, stopping pagination`)
              break
            }
            
            // If we've got all expected hospitals (147), stop fetching
            if (hospitals.length >= 147) {
              console.log(`Reached ${hospitals.length} hospitals, stopping pagination`)
              break
            }
          } else {
            // No table found on this page, might have reached the end
            console.log(`No hospital table found on page ${pageNum}, stopping pagination`)
            break
          }
          
          // Add a delay to avoid overwhelming the server and rate limiting
          // Longer delay as we progress through pages
          const delay = Math.min(1000 + (pageNum * 200), 3000) // 1-3 seconds
          console.log(`Waiting ${delay}ms before next page...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError)
          // Continue to next page even if one fails
          // Add delay before retrying
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      console.log(`Total hospitals fetched: ${hospitals.length}`)
      
      if (hospitals.length === 0) {
        // Fallback: Try alternative parsing method
        // Look for specific patterns in the HTML
        const hospitalPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>/gi
        let match
        
        while ((match = hospitalPattern.exec(html)) !== null) {
          const [, , name, address, city, state] = match
          if (name && name.trim() !== 'Name Hospital' && !name.includes('NO_NAME')) {
            hospitals.push({
              name: name.trim(),
              address: (address || '').trim(),
              city: (city || '').trim(),
              state: (state || '').trim(),
            })
          }
        }
      }

      if (hospitals.length === 0) {
        return {
          data: [],
          error: 'No hospitals found on MOH website. The website structure may have changed or there was an error parsing the data.',
        }
      }

      return { data: hospitals, error: null }
    } catch (fetchError) {
      // If CORS proxy fails, provide helpful error message
      console.error('Error fetching from MOH website:', fetchError)
      return {
        data: [],
        error: `Failed to fetch from MOH website. This might be due to CORS restrictions. Consider implementing a server-side proxy or using a different data source. Original error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch from MOH website'
    console.error('Error in fetchHospitalsFromMOH:', error)
    return { data: null, error: message }
  }
}

/**
 * Fetch and import hospitals from MOH website into database
 */
export async function importHospitalsFromMOH(
  hospitalId: string,
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
  try {
    // Fetch hospitals from MOH
    const fetchResult = await fetchHospitalsFromMOH()
    
    if (!fetchResult.data || fetchResult.data.length === 0) {
      return {
        data: null,
        error: fetchResult.error || 'No hospitals found to import',
      }
    }

    // Import hospitals
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < fetchResult.data.length; i++) {
      try {
        const hospital = fetchResult.data[i]
        
        // Check if hospital already exists (by name or moh_id)
        // Use a direct query instead of search to avoid special character issues
        let exists = false
        
        if (!isSupabaseConfigured()) {
          // Local fallback - check existing facilities
          const localData = localStorage.getItem(`hospital_facilities_${hospitalId}`)
          const existingFacilities: HospitalFacilityWithRelations[] = localData ? JSON.parse(localData) : []
          exists = existingFacilities.some(
            f => f.name.toLowerCase() === hospital.name.toLowerCase() ||
                 (f.moh_id && hospital.moh_id && f.moh_id === hospital.moh_id)
          )
        } else {
          // Query by exact name match to avoid search query issues with special characters
          // Use .eq() with exact match first, then fallback to ilike if needed
          const { data: existingData, error: queryError } = await supabase
            .from('hospital_facilities')
            .select('id, name, moh_id')
            .eq('hospital_id', hospitalId)
            .eq('name', hospital.name) // Try exact match first
            .limit(1)
          
          // If exact match doesn't find it, try case-insensitive match
          if (!queryError && (!existingData || existingData.length === 0)) {
            const { data: caseInsensitiveData } = await supabase
              .from('hospital_facilities')
              .select('id, name, moh_id')
              .eq('hospital_id', hospitalId)
              .ilike('name', hospital.name.replace(/'/g, "''")) // Escape apostrophes for ilike
              .limit(1)
            
            if (caseInsensitiveData && caseInsensitiveData.length > 0) {
              exists = true
            }
          }
          
          if (!queryError && existingData && existingData.length > 0) {
            exists = true
          }
          
          // Also check by moh_id if name check didn't find it
          if (!exists && hospital.moh_id) {
            // Also check by moh_id if name check didn't find it
            const { data: mohIdData } = await supabase
              .from('hospital_facilities')
              .select('id')
              .eq('hospital_id', hospitalId)
              .eq('moh_id', hospital.moh_id)
              .limit(1)
            
            exists = !!(mohIdData && mohIdData.length > 0)
          }
        }

        if (exists) {
          // Skip if already exists
          success++
        } else {
          // Create new hospital facility
          const result = await createHospitalFacility(hospitalId, {
            name: hospital.name,
            address: hospital.address,
            city: hospital.city,
            state: hospital.state,
            status: 'active',
            facility_code: hospital.moh_id ? `MOH-${hospital.moh_id}` : undefined,
            metadata: {
              moh_id: hospital.moh_id,
              imported_from: 'MOH website',
              imported_at: new Date().toISOString(),
            },
          })

          if (result.data) {
            success++
          } else {
            failed++
            errors.push(`Hospital "${hospital.name}": ${result.error || 'Unknown error'}`)
          }
        }
      } catch (error) {
        failed++
        const hospital = fetchResult.data[i]
        errors.push(
          `Hospital "${hospital.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: fetchResult.data.length,
          success,
          failed,
        })
      }
    }

    return {
      data: {
        success,
        failed,
        errors: errors.slice(0, 100), // Limit errors to first 100
      },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import from MOH website'
    console.error('Error in importHospitalsFromMOH:', error)
    return { data: null, error: message }
  }
}


