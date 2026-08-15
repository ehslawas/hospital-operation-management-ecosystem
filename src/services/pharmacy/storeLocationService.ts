/**
 * Store Location Management Service
 * Manages store location hierarchy (Store -> Cabinet/Rack -> Shelf/Level)
 * Persists to Supabase `store_locations` table with LocalStorage fallback.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { StoreLocation, StoreLocationFormData, StoreLocationWithOccupancy } from '@/types/pharmacy'
import { loadFacilityDrugInventory } from './facilityDrugInventoryService'

function cacheKey(hospitalId: string) {
  return `store_locations_${hospitalId}`
}

const DEFAULT_LOCATIONS: Omit<StoreLocation, 'created_at' | 'updated_at'>[] = [
  {
    id: 'store-loc-mf-001',
    hospital_id: 'hosp-lawas-01',
    location_code: 'LOG-MF-001',
    store_name: 'Main Freezer',
    department: 'LOG',
    cabinet_rack: '-',
    shelf_level: '-',
    location_type: 'drug',
    storage_condition: 'cold_2_8c',
    is_active: true,
  },
  {
    id: 'store-loc-sl-001',
    hospital_id: 'hosp-lawas-01',
    location_code: 'LOG-SL-001',
    store_name: 'Stor Logistik',
    department: 'LOG',
    cabinet_rack: '-',
    shelf_level: '-',
    location_type: 'non_drug',
    storage_condition: 'ambient',
    is_active: true,
  },
  {
    id: 'store-loc-sl-002',
    hospital_id: 'hosp-lawas-01',
    location_code: 'LOG-SL-002',
    store_name: 'Stor Logistik',
    department: 'LOG',
    cabinet_rack: '-',
    shelf_level: '-',
    location_type: 'drug',
    storage_condition: 'ambient',
    is_active: true,
  },
  {
    id: 'store-loc-tl-001',
    hospital_id: 'hosp-lawas-01',
    location_code: 'LOG-TL-001',
    store_name: 'Top Loading',
    department: 'LOG',
    cabinet_rack: '-',
    shelf_level: '-',
    location_type: 'drug',
    storage_condition: 'cold_2_8c',
    is_active: true,
  },
]

function readCache(hospitalId: string): StoreLocation[] {
  try {
    const raw = localStorage.getItem(cacheKey(hospitalId))
    if (!raw) {
      const initial = DEFAULT_LOCATIONS.map(l => ({
        ...l,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as StoreLocation[]
      localStorage.setItem(cacheKey(hospitalId), JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = DEFAULT_LOCATIONS.map(l => ({
        ...l,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as StoreLocation[]
      localStorage.setItem(cacheKey(hospitalId), JSON.stringify(initial))
      return initial
    }
    return parsed
  } catch {
    return DEFAULT_LOCATIONS.map(l => ({
      ...l,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as StoreLocation[]
  }
}

function writeCache(hospitalId: string, items: StoreLocation[]) {
  try {
    localStorage.setItem(cacheKey(hospitalId), JSON.stringify(items))
  } catch {}
}

export function formatLocationString(storeName: string, cabinetRack?: string, shelfLevel?: string): string {
  if ((!cabinetRack || cabinetRack === '-') && (!shelfLevel || shelfLevel === '-')) {
    return storeName
  }
  const parts = [storeName, cabinetRack, shelfLevel].filter(p => p && p !== '-')
  return parts.join(' > ')
}

export function generateLocationCode(
  storeName: string,
  departmentCode: string = 'LOG',
  cabinetRack: string = '',
  shelfLevel: string = ''
): string {
  const dept = (departmentCode || 'LOG').trim().toUpperCase()
  const words = storeName.trim().split(/\s+/).filter(Boolean)
  
  let storeCode = ''
  if (words.length >= 2) {
    storeCode = words.map(w => w[0]).join('').toUpperCase().slice(0, 3)
  } else if (words.length === 1 && words[0].length >= 3) {
    storeCode = words[0].slice(0, 3).toUpperCase()
  } else if (words.length === 1) {
    storeCode = words[0].toUpperCase()
  } else {
    storeCode = 'STR'
  }

  const cleanCab = cabinetRack && cabinetRack !== '-' ? cabinetRack.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) : ''
  const cleanShelf = shelfLevel && shelfLevel !== '-' ? shelfLevel.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) : ''

  if (cleanCab || cleanShelf) {
    return `${dept}-${storeCode}-${cleanCab || 'C1'}-${cleanShelf || 'L1'}`
  }

  return `${dept}-${storeCode}-001`
}

/**
 * Generates a guaranteed unique location code by checking against existing store locations.
 * Automatically increments number suffixes (-002, -003, etc.) if collision detected.
 */
export function generateUniqueLocationCode(
  existingLocations: StoreLocation[],
  storeName: string,
  departmentCode: string = 'LOG',
  cabinetRack: string = '',
  shelfLevel: string = '',
  currentLocationId?: string
): string {
  const baseCode = generateLocationCode(storeName, departmentCode, cabinetRack, shelfLevel)
  
  const otherLocations = currentLocationId 
    ? existingLocations.filter(l => l.id !== currentLocationId)
    : existingLocations

  const usedCodes = new Set(otherLocations.map(l => l.location_code?.toUpperCase()).filter(Boolean))

  if (!usedCodes.has(baseCode.toUpperCase())) {
    return baseCode
  }

  const match = baseCode.match(/^(.*)-(\d+)$/)
  let prefix = baseCode
  let counter = 2

  if (match) {
    prefix = match[1]
    counter = parseInt(match[2], 10) + 1
  }

  while (counter < 1000) {
    const paddedNum = counter.toString().padStart(3, '0')
    const candidate = `${prefix}-${paddedNum}`
    if (!usedCodes.has(candidate.toUpperCase())) {
      return candidate
    }
    counter++
  }

  return `${baseCode}-${Date.now().toString().slice(-4)}`
}

/**
 * Load all store locations for a hospital
 */
export async function loadStoreLocations(hospitalId: string): Promise<StoreLocation[]> {
  if (!isSupabaseConfigured()) {
    return readCache(hospitalId)
  }

  try {
    const { data, error } = await supabase
      .from('store_locations')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('store_name', { ascending: true })

    if (error || !data || data.length === 0) {
      return readCache(hospitalId)
    }

    const items: StoreLocation[] = data.map((row: any) => ({
      id: row.id,
      hospital_id: row.hospital_id,
      store_name: row.store_name,
      department: row.department,
      cabinet_rack: row.cabinet_rack,
      shelf_level: row.shelf_level,
      location_code: row.location_code || generateLocationCode(row.store_name, row.department || 'LOG', row.cabinet_rack, row.shelf_level),
      location_type: row.location_type || 'both',
      storage_condition: row.storage_condition || 'ambient',
      description: row.description,
      is_active: row.is_active ?? true,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    writeCache(hospitalId, items)
    return items
  } catch (err) {
    console.error('[StoreLocation] Failed to fetch from Supabase, returning cache:', err)
    return readCache(hospitalId)
  }
}

/**
 * Create a new store location
 */
export async function createStoreLocation(
  hospitalId: string,
  formData: StoreLocationFormData
): Promise<StoreLocation> {
  const existingLocs = readCache(hospitalId)
  const defaultCode = generateLocationCode(formData.store_name, formData.department || 'LOG', formData.cabinet_rack, formData.shelf_level)
  const userCode = formData.location_code?.trim()

  const code = (!userCode || userCode === defaultCode)
    ? generateUniqueLocationCode(existingLocs, formData.store_name, formData.department || 'LOG', formData.cabinet_rack, formData.shelf_level)
    : userCode

  const now = new Date().toISOString()
  const newId = `loc-${Date.now()}`

  const newLoc: StoreLocation = {
    id: newId,
    hospital_id: hospitalId,
    store_name: formData.store_name.trim(),
    department: formData.department,
    cabinet_rack: formData.cabinet_rack.trim(),
    shelf_level: formData.shelf_level.trim(),
    location_code: code,
    location_type: formData.location_type,
    storage_condition: formData.storage_condition,
    description: formData.description?.trim() || null,
    is_active: formData.is_active,
    created_at: now,
    updated_at: now,
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('store_locations')
      .insert([{
        id: newLoc.id,
        hospital_id: newLoc.hospital_id,
        store_name: newLoc.store_name,
        cabinet_rack: newLoc.cabinet_rack,
        shelf_level: newLoc.shelf_level,
        location_code: newLoc.location_code,
        location_type: newLoc.location_type,
        storage_condition: newLoc.storage_condition,
        description: newLoc.description,
        is_active: newLoc.is_active,
        created_at: newLoc.created_at,
        updated_at: newLoc.updated_at,
      }])
      .select()
      .single()

    if (error) {
      console.error('[StoreLocation] Supabase insert error:', error)
      if (error.code === '23505' || (error as any).status === 409) {
        throw new Error(`Kod lokasi '${newLoc.location_code}' telah wujud. Sila gunakan kod lokasi yang lain.`)
      }
      throw new Error(error.message || 'Gagal menyimpan ke pangkalan data.')
    }

    if (data) {
      newLoc.id = data.id
    }
  }

  const existing = readCache(hospitalId)
  const updated = [newLoc, ...existing]
  writeCache(hospitalId, updated)
  return newLoc
}

/**
 * Update an existing store location
 */
export async function updateStoreLocation(
  hospitalId: string,
  locationId: string,
  formData: Partial<StoreLocationFormData>
): Promise<StoreLocation | null> {
  const now = new Date().toISOString()
  const cache = readCache(hospitalId)
  const index = cache.findIndex(l => l.id === locationId)

  if (index === -1) return null

  const target = cache[index]
  const defaultCode = generateLocationCode(
    formData.store_name ?? target.store_name,
    formData.department ?? target.department ?? 'LOG',
    formData.cabinet_rack ?? target.cabinet_rack,
    formData.shelf_level ?? target.shelf_level
  )
  const userCode = formData.location_code?.trim()

  const code = (!userCode || userCode === defaultCode || userCode === target.location_code)
    ? (userCode && userCode !== defaultCode && userCode === target.location_code 
        ? target.location_code 
        : generateUniqueLocationCode(
            cache,
            formData.store_name ?? target.store_name,
            formData.department ?? target.department ?? 'LOG',
            formData.cabinet_rack ?? target.cabinet_rack,
            formData.shelf_level ?? target.shelf_level,
            locationId
          ))
    : userCode

  const updatedLoc: StoreLocation = {
    ...target,
    ...formData,
    store_name: formData.store_name?.trim() ?? target.store_name,
    department: formData.department ?? target.department,
    cabinet_rack: formData.cabinet_rack?.trim() ?? target.cabinet_rack,
    shelf_level: formData.shelf_level?.trim() ?? target.shelf_level,
    location_code: code,
    updated_at: now,
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('store_locations')
      .update({
        store_name: updatedLoc.store_name,
        cabinet_rack: updatedLoc.cabinet_rack,
        shelf_level: updatedLoc.shelf_level,
        location_code: updatedLoc.location_code,
        location_type: updatedLoc.location_type,
        storage_condition: updatedLoc.storage_condition,
        description: updatedLoc.description,
        is_active: updatedLoc.is_active,
        updated_at: now,
      })
      .eq('id', locationId)
      .eq('hospital_id', hospitalId)

    if (error) {
      console.error('[StoreLocation] Supabase update error:', error)
      if (error.code === '23505' || (error as any).status === 409) {
        throw new Error(`Kod lokasi '${updatedLoc.location_code}' telah wujud untuk lokasi lain. Sila gunakan kod lokasi yang berbeza.`)
      }
      throw new Error(error.message || 'Gagal mengemaskini di pangkalan data.')
    }
  }

  cache[index] = updatedLoc
  writeCache(hospitalId, cache)
  return updatedLoc
}

/**
 * Delete a store location
 */
export async function deleteStoreLocation(hospitalId: string, locationId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('store_locations')
        .delete()
        .eq('id', locationId)
        .eq('hospital_id', hospitalId)
    } catch (err) {
      console.warn('[StoreLocation] Supabase delete failed:', err)
    }
  }

  const cache = readCache(hospitalId)
  const filtered = cache.filter(l => l.id !== locationId)
  writeCache(hospitalId, filtered)
  return true
}

/**
 * Get store locations with calculated item occupancy counts
 */
export async function getStoreLocationsWithOccupancy(hospitalId: string): Promise<StoreLocationWithOccupancy[]> {
  const locations = await loadStoreLocations(hospitalId)
  const drugItems = await loadFacilityDrugInventory(hospitalId)

  // Non-drug items from localStorage cache
  let nonDrugItems: any[] = []
  try {
    const raw = localStorage.getItem(`facility_nondrug_items_${hospitalId}`)
    if (raw) nonDrugItems = JSON.parse(raw)
  } catch {}

  return locations.map(loc => {
    const formatted = formatLocationString(loc.store_name, loc.cabinet_rack, loc.shelf_level)

    const isLocationMatch = (locStr: string) => {
      if (!locStr) return false
      const cleanLoc = locStr.trim().toLowerCase()
      const cleanStoreName = loc.store_name.trim().toLowerCase()
      const cleanCode = loc.location_code.trim().toLowerCase()
      const cleanFormatted = formatted.trim().toLowerCase()

      if (cleanLoc === cleanFormatted || cleanLoc === cleanCode) return true
      
      if (loc.cabinet_rack && loc.cabinet_rack !== '-') {
        const cleanCab = loc.cabinet_rack.trim().toLowerCase()
        return cleanLoc.includes(cleanStoreName) && cleanLoc.includes(cleanCab)
      }
      
      return cleanLoc.includes(cleanStoreName) || cleanLoc.includes(cleanCode)
    }

    const drugCount = (loc.location_type === 'non_drug')
      ? 0
      : drugItems.filter(item => isLocationMatch(item.location || '')).length

    const nonDrugCount = (loc.location_type === 'drug')
      ? 0
      : nonDrugItems.filter(item => isLocationMatch(item.location || '')).length

    return {
      ...loc,
      formatted_location: formatted,
      drug_items_count: drugCount,
      non_drug_items_count: nonDrugCount,
      total_items_count: drugCount + nonDrugCount,
    }
  })
}
