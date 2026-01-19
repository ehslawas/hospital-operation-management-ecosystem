/**
 * Hospital Facility Catalog Service
 * Handles CRUD operations for Hospital Facilities in Malaysia
 * Data sourced from Ministry of Health Malaysia (MOH)
 */

import { supabase } from '@/services/supabase'
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
    // Build Supabase query
    let query = supabase
      .from('hospital_facilities')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name', { ascending: true })

    // Apply filters
    if (filter?.search) {
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
 * Batch import hospital facilities
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
        onProgress({ processed: i + 1, total: facilities.length, success, failed })
      }
    }

    return { data: { success, failed, errors: errors.slice(0, 100) }, error: null }
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
      return { data: { total: 0, by_state: [], by_city: [] }, error: null }
    }

    const facilities = result.data
    const stateCounts: Record<string, number> = {}
    facilities.forEach(f => { if (f.state) stateCounts[f.state] = (stateCounts[f.state] || 0) + 1 })

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

    const headers = ['Name', 'Address', 'City', 'State', 'Phone', 'Email', 'Status']
    const rows = result.data.map(f => [
      f.name || '', f.address || '', f.city || '', f.state || '', f.phone || '', f.email || '', f.status || ''
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

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(MOH_URL)}`

    try {
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

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

      if (hospitalTable) {
        const rows = hospitalTable.querySelectorAll('tr')
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td')
          if (cells.length >= 5) {
            const nameCell = cells[1]?.textContent?.trim()
            const addressCell = cells[2]?.textContent?.trim()
            const cityCell = cells[3]?.textContent?.trim()
            const stateCell = cells[4]?.textContent?.trim()
            const viewLink = cells[5]?.querySelector('a')?.getAttribute('href')
            let mohId: string | undefined
            if (viewLink) {
              const match = viewLink.match(/store_view_page\/82\/(\d+)/)
              if (match) mohId = match[1]
            }
            if (nameCell && nameCell !== 'Name Hospital') {
              hospitals.push({ name: nameCell, address: addressCell || '', city: cityCell || '', state: stateCell || '', moh_id: mohId })
            }
          }
        }
      }

      return { data: hospitals, error: null }
    } catch (fetchError) {
      console.error('Error fetching from MOH website:', fetchError)
      return { data: [], error: `Failed to fetch from MOH website: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }
    }
  } catch (error) {
    console.error('Error in fetchHospitalsFromMOH:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch from MOH website' }
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
    const fetchResult = await fetchHospitalsFromMOH()
    if (!fetchResult.data || fetchResult.data.length === 0) {
      return { data: null, error: fetchResult.error || 'No hospitals found to import' }
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < fetchResult.data.length; i++) {
      try {
        const hospital = fetchResult.data[i]
        let exists = false

        const { data: existingData, error: queryError } = await supabase
          .from('hospital_facilities')
          .select('id, name, moh_id')
          .eq('hospital_id', hospitalId)
          .eq('name', hospital.name)
          .limit(1)

        if (!queryError && existingData && existingData.length > 0) exists = true

        if (!exists && hospital.moh_id) {
          const { data: mohIdData } = await supabase
            .from('hospital_facilities')
            .select('id')
            .eq('hospital_id', hospitalId)
            .eq('moh_id', hospital.moh_id)
            .limit(1)
          exists = !!(mohIdData && mohIdData.length > 0)
        }

        if (exists) {
          success++
        } else {
          const result = await createHospitalFacility(hospitalId, {
            name: hospital.name,
            address: hospital.address,
            city: hospital.city,
            state: hospital.state,
            status: 'active',
            facility_code: hospital.moh_id ? `MOH-H-${hospital.moh_id}` : undefined,
            metadata: { moh_id: hospital.moh_id, imported_from: 'MOH website', imported_at: new Date().toISOString() },
          })
          if (result.data) success++
          else { failed++; errors.push(`Hospital "${hospital.name}": ${result.error || 'Unknown error'}`) }
        }
      } catch (error) {
        failed++
        errors.push(`Hospital "${fetchResult.data[i].name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      if (onProgress) onProgress({ processed: i + 1, total: fetchResult.data.length, success, failed })
    }
    return { data: { success, failed, errors: errors.slice(0, 100) }, error: null }
  } catch (error) {
    console.error('Error in importHospitalsFromMOH:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to import from MOH website' }
  }
}
