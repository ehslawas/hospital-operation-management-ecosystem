/**
 * Clinic Facility Catalog Service
 * Handles CRUD operations for Clinic Facilities in Malaysia
 * Data sourced from Ministry of Health Malaysia (MOH)
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  ClinicFacility,
  ClinicFacilityWithRelations,
  ClinicFacilityCatalogKPIs,
  ClinicFacilityCatalogFilter,
} from '@/types/pharmacy'

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all clinic facilities with optional filters
 */
export async function getClinicFacilities(
  hospitalId: string,
  filter?: ClinicFacilityCatalogFilter
): Promise<ApiResponse<ClinicFacilityWithRelations[]>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local development fallback - use localStorage
      const localData = localStorage.getItem(`clinic_facilities_${hospitalId}`)
      const facilities: ClinicFacilityWithRelations[] = localData ? JSON.parse(localData) : []
      
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
      .from('clinic_facilities')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name', { ascending: true })

    // Apply filters
    if (filter?.search) {
      // For search with special characters, we need to escape properly
      const searchTerm = filter.search
        .replace(/%/g, '\\%')  // Escape % wildcard
        .replace(/_/g, '\\_')  // Escape _ wildcard
        .replace(/'/g, "''")   // Escape single quotes for SQL
      const searchPattern = `%${searchTerm}%`
      
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
      console.error('Error fetching clinic facilities:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ClinicFacilityWithRelations[], error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clinic facilities'
    console.error('Error in getClinicFacilities:', error)
    return { data: null, error: message }
  }
}

/**
 * Get clinic facility by ID
 */
export async function getClinicFacilityById(id: string): Promise<ApiResponse<ClinicFacilityWithRelations>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('clinic_facilities_'))
      for (const key of allKeys) {
        const facilities: ClinicFacilityWithRelations[] = JSON.parse(localStorage.getItem(key) || '[]')
        const facility = facilities.find(f => f.id === id)
        if (facility) {
          return { data: facility, error: null }
        }
      }
      return { data: null, error: 'Clinic facility not found' }
    }

    const { data, error } = await supabase
      .from('clinic_facilities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching clinic facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ClinicFacilityWithRelations, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clinic facility'
    console.error('Error in getClinicFacilityById:', error)
    return { data: null, error: message }
  }
}

/**
 * Create a new clinic facility
 */
export async function createClinicFacility(
  hospitalId: string,
  facility: Omit<ClinicFacility, 'id' | 'hospital_id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<ClinicFacility>> {
  try {
    const newFacility: Omit<ClinicFacility, 'id' | 'created_at' | 'updated_at'> = {
      ...facility,
      hospital_id: hospitalId,
      status: facility.status || 'active',
    }

    if (!isSupabaseConfigured()) {
      // Local fallback
      const id = `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const created: ClinicFacility = {
        ...newFacility,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const localData = localStorage.getItem(`clinic_facilities_${hospitalId}`)
      const facilities: ClinicFacility[] = localData ? JSON.parse(localData) : []
      facilities.push(created)
      localStorage.setItem(`clinic_facilities_${hospitalId}`, JSON.stringify(facilities))

      return { data: created, error: null }
    }

    const { data, error } = await supabase
      .from('clinic_facilities')
      .insert([newFacility])
      .select()
      .single()

    if (error) {
      console.error('Error creating clinic facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ClinicFacility, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create clinic facility'
    console.error('Error in createClinicFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Update clinic facility
 */
export async function updateClinicFacility(
  id: string,
  facility: Partial<Omit<ClinicFacility, 'id' | 'hospital_id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<ClinicFacility>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('clinic_facilities_'))
      for (const key of allKeys) {
        const facilities: ClinicFacility[] = JSON.parse(localStorage.getItem(key) || '[]')
        const index = facilities.findIndex(f => f.id === id)
        if (index !== -1) {
          facilities[index] = {
            ...facilities[index],
            ...facility,
            updated_at: new Date().toISOString(),
          }
          localStorage.setItem(key, JSON.stringify(facilities))
          return { data: facilities[index], error: null }
        }
      }
      return { data: null, error: 'Clinic facility not found' }
    }

    const { data, error } = await supabase
      .from('clinic_facilities')
      .update({
        ...facility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating clinic facility:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ClinicFacility, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update clinic facility'
    console.error('Error in updateClinicFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Delete clinic facility
 */
export async function deleteClinicFacility(id: string): Promise<ApiResponse<void>> {
  try {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('clinic_facilities_'))
      for (const key of allKeys) {
        const facilities: ClinicFacility[] = JSON.parse(localStorage.getItem(key) || '[]')
        const filtered = facilities.filter(f => f.id !== id)
        if (filtered.length !== facilities.length) {
          localStorage.setItem(key, JSON.stringify(filtered))
          return { data: undefined, error: null }
        }
      }
      return { data: null, error: 'Clinic facility not found' }
    }

    const { error } = await supabase.from('clinic_facilities').delete().eq('id', id)

    if (error) {
      console.error('Error deleting clinic facility:', error)
      return { data: null, error: error.message }
    }

    return { data: undefined, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete clinic facility'
    console.error('Error in deleteClinicFacility:', error)
    return { data: null, error: message }
  }
}

/**
 * Get clinic facility KPIs
 */
export async function getClinicFacilityKPIs(
  hospitalId: string
): Promise<ApiResponse<ClinicFacilityCatalogKPIs>> {
  try {
    const result = await getClinicFacilities(hospitalId)
    
    if (!result.data) {
      return {
        data: {
          total: 0,
          by_state: [],
          by_city: [],
        },
        error: result.error || null,
      }
    }

    const facilities = result.data

    // Calculate by state
    const stateCounts = new Map<string, number>()
    facilities.forEach(f => {
      if (f.state) {
        stateCounts.set(f.state, (stateCounts.get(f.state) || 0) + 1)
      }
    })

    // Calculate by city
    const cityCounts = new Map<string, number>()
    facilities.forEach(f => {
      if (f.city) {
        cityCounts.set(f.city, (cityCounts.get(f.city) || 0) + 1)
      }
    })

    const kpis: ClinicFacilityCatalogKPIs = {
      total: facilities.length,
      by_state: Array.from(stateCounts.entries()).map(([state, count]) => ({ state, count })),
      by_city: Array.from(cityCounts.entries()).map(([city, count]) => ({ city, count })),
    }

    return { data: kpis, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate KPIs'
    console.error('Error in getClinicFacilityKPIs:', error)
    return {
      data: {
        total: 0,
        by_state: [],
        by_city: [],
      },
      error: message,
    }
  }
}

/**
 * Export clinic facilities to CSV
 */
export async function exportClinicFacilities(
  hospitalId: string,
  filter?: ClinicFacilityCatalogFilter
): Promise<ApiResponse<Blob>> {
  try {
    const result = await getClinicFacilities(hospitalId, filter)
    
    if (!result.data) {
      return { data: null, error: result.error || 'Failed to fetch clinic facilities' }
    }

    // Create CSV content
    const headers = ['Name', 'Address', 'City', 'State', 'Phone', 'Email', 'Facility Code', 'Status']
    const rows = result.data.map(f => [
      f.name || '',
      f.address || '',
      f.city || '',
      f.state || '',
      f.phone || '',
      f.email || '',
      f.facility_code || '',
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
    console.error('Error in exportClinicFacilities:', error)
    return { data: null, error: message }
  }
}

/**
 * Fetch clinics from MOH website
 * Scrapes data from: https://www.moh.gov.my/index.php/pages/view/4378?mid=1451
 * The MOH page shows clinics organized by state with links to detailed pages
 */
export async function fetchClinicsFromMOH(): Promise<ApiResponse<Array<{
  name: string
  address: string
  city: string
  state: string
  moh_id?: string
}>>> {
  try {
    const MOH_URL = 'https://www.moh.gov.my/index.php/pages/view/4378?mid=1451'
    const hospitals: Array<{
      name: string
      address: string
      city: string
      state: string
      moh_id?: string
    }> = []

    // Use CORS proxy to fetch the MOH website (browser CORS limitation)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(MOH_URL)}`
    
    try {
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      
      // Parse HTML to extract clinic data
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // The MOH page has state sections with clinic links
      // We need to find all state sections and extract clinic information
      
      // Look for state headings (h3, h4, or strong tags with state names)
      const stateSections = doc.querySelectorAll('h3, h4, strong')
      
      const malaysianStates = [
        'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Malacca', 'Negeri Sembilan',
        'Pahang', 'Pulau Pinang', 'Penang', 'Perak', 'Perlis', 'Sabah',
        'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
        'WP Kuala Lumpur', 'WP Labuan', 'WP Putrajaya'
      ]
      
      stateSections.forEach(section => {
        const text = section.textContent?.trim() || ''
        
        // Find if this is a state heading
        let currentState = ''
        for (const state of malaysianStates) {
          if (text.includes(state)) {
            currentState = state
            // Normalize state names
            if (state === 'WP Kuala Lumpur' || state === 'Kuala Lumpur') currentState = 'Kuala Lumpur'
            else if (state === 'WP Labuan' || state === 'Labuan') currentState = 'Labuan'
            else if (state === 'WP Putrajaya' || state === 'Putrajaya') currentState = 'Putrajaya'
            else if (state === 'Pulau Pinang' || state === 'Penang') currentState = 'Pulau Pinang'
            else if (state === 'Melaka' || state === 'Malacca') currentState = 'Melaka'
            break
          }
        }
        
        if (!currentState) return
        
        // Find the next sibling element that might contain clinic links
        let nextElement: Element | null = section.nextElementSibling
        
        // Look for lists or paragraphs with clinic information
        while (nextElement && nextElement.tagName !== 'H3' && nextElement.tagName !== 'H4' && !nextElement.querySelector('strong')) {
          // Check for links that might be clinic pages
          const links = nextElement.querySelectorAll('a[href*="store_view"]')
          
          links.forEach(link => {
            const clinicName = link.textContent?.trim() || ''
            const href = link.getAttribute('href') || ''
            
            // Extract MOH ID from href if available
            const mohIdMatch = href.match(/store_view[^/]*\/(\d+)/)
            const mohId = mohIdMatch ? mohIdMatch[1] : undefined
            
            if (clinicName && clinicName.length > 3) {
              // Try to extract city from clinic name or surrounding text
              const parentText = nextElement?.textContent || ''
              
              // Simple heuristics to extract city
              let city = ''
              const cityPatterns = /(?:di|at|Bandar|Kota)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
              const cityMatch = parentText.match(cityPatterns)
              if (cityMatch) {
                city = cityMatch[1]
              } else {
                // If no city found, try to extract from clinic name
                const nameParts = clinicName.split(',')
                if (nameParts.length > 1) {
                  city = nameParts[nameParts.length - 1].trim()
                }
              }
              
              hospitals.push({
                name: clinicName,
                address: '',
                city: city || '',
                state: currentState,
                moh_id: mohId,
              })
            }
          })
          
          nextElement = nextElement.nextElementSibling
        }
      })
      
      // Alternative approach: Look for table structures
      if (hospitals.length === 0) {
        const tables = doc.querySelectorAll('table')
        
        for (const table of Array.from(tables)) {
          const rows = table.querySelectorAll('tr')
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const cells = row.querySelectorAll('td')
            
            if (cells.length >= 2) {
              const nameCell = cells[0]?.textContent?.trim()
              const addressCell = cells[1]?.textContent?.trim()
              
              // Try to extract state from table or row
              const rowText = row.textContent || ''
              let currentState = ''
              for (const state of malaysianStates) {
                if (rowText.includes(state)) {
                  currentState = state
                  if (state === 'WP Kuala Lumpur' || state === 'Kuala Lumpur') currentState = 'Kuala Lumpur'
                  else if (state === 'WP Labuan' || state === 'Labuan') currentState = 'Labuan'
                  else if (state === 'WP Putrajaya' || state === 'Putrajaya') currentState = 'Putrajaya'
                  else if (state === 'Pulau Pinang' || state === 'Penang') currentState = 'Pulau Pinang'
                  else if (state === 'Melaka' || state === 'Malacca') currentState = 'Melaka'
                  break
                }
              }
              
              if (nameCell && nameCell.length > 3) {
                // Extract city from address or name
                let city = ''
                const cityMatch = (addressCell || nameCell).match(/Bandar\s+([A-Z][a-z]+)|Kota\s+([A-Z][a-z]+)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),/i)
                if (cityMatch) {
                  city = cityMatch[1] || cityMatch[2] || cityMatch[3] || ''
                }
                
                hospitals.push({
                  name: nameCell,
                  address: addressCell || '',
                  city: city || '',
                  state: currentState || '',
                  moh_id: undefined,
                })
              }
            }
          }
        }
      }

      if (hospitals.length === 0) {
        return {
          data: [],
          error: 'No clinics found on MOH website. The website structure may have changed or there was an error parsing the data.',
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
    console.error('Error in fetchClinicsFromMOH:', error)
    return { data: null, error: message }
  }
}

/**
 * Fetch and import clinics from MOH website into database
 */
export async function importClinicsFromMOH(
  hospitalId: string,
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
  try {
    // Fetch clinics from MOH
    const fetchResult = await fetchClinicsFromMOH()
    
    if (!fetchResult.data || fetchResult.data.length === 0) {
      return {
        data: null,
        error: fetchResult.error || 'No clinics found to import',
      }
    }

    // Import clinics
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < fetchResult.data.length; i++) {
      try {
        const clinic = fetchResult.data[i]
        
        // Check if clinic already exists (by name or moh_id)
        let exists = false
        
        if (!isSupabaseConfigured()) {
          // Local fallback - check existing facilities
          const localData = localStorage.getItem(`clinic_facilities_${hospitalId}`)
          const existingFacilities: ClinicFacilityWithRelations[] = localData ? JSON.parse(localData) : []
          exists = existingFacilities.some(
            f => f.name.toLowerCase() === clinic.name.toLowerCase() ||
                 (f.moh_id && clinic.moh_id && f.moh_id === clinic.moh_id)
          )
        } else {
          // Query by exact name match to avoid search query issues with special characters
          const { data: existingData, error: queryError } = await supabase
            .from('clinic_facilities')
            .select('id, name, moh_id')
            .eq('hospital_id', hospitalId)
            .eq('name', clinic.name) // Try exact match first
            .limit(1)
          
          // If exact match doesn't find it, try case-insensitive match
          if (!queryError && (!existingData || existingData.length === 0)) {
            const { data: caseInsensitiveData } = await supabase
              .from('clinic_facilities')
              .select('id, name, moh_id')
              .eq('hospital_id', hospitalId)
              .ilike('name', clinic.name.replace(/'/g, "''")) // Escape apostrophes for ilike
              .limit(1)
            
            if (caseInsensitiveData && caseInsensitiveData.length > 0) {
              exists = true
            }
          }
          
          if (!queryError && existingData && existingData.length > 0) {
            exists = true
          }
          
          // Also check by moh_id if name check didn't find it
          if (!exists && clinic.moh_id) {
            const { data: mohIdData } = await supabase
              .from('clinic_facilities')
              .select('id')
              .eq('hospital_id', hospitalId)
              .eq('moh_id', clinic.moh_id)
              .limit(1)
            
            exists = !!(mohIdData && mohIdData.length > 0)
          }
        }

        if (exists) {
          // Skip if already exists
          success++
        } else {
          // Create new clinic facility
          const result = await createClinicFacility(hospitalId, {
            name: clinic.name,
            address: clinic.address,
            city: clinic.city,
            state: clinic.state,
            status: 'active',
            facility_code: clinic.moh_id ? `MOH-${clinic.moh_id}` : undefined,
            metadata: {
              moh_id: clinic.moh_id,
              imported_from: 'MOH website',
              imported_at: new Date().toISOString(),
            },
          })

          if (result.data) {
            success++
          } else {
            failed++
            errors.push(`Clinic "${clinic.name}": ${result.error || 'Unknown error'}`)
          }
        }
      } catch (error) {
        failed++
        const clinic = fetchResult.data[i]
        errors.push(
          `Clinic "${clinic.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('Error in importClinicsFromMOH:', error)
    return { data: null, error: message }
  }
}

