import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { SubLocationUnit } from '@/modules/inventory/pages/inventory/StoreLocationManagementPage'

function getCacheKey(hospitalId: string, storeCode?: string): string {
  return `sub_locations_${hospitalId}_${storeCode || 'global'}`
}

export const DEFAULT_SUB_LOCATIONS: Record<string, SubLocationUnit[]> = {
  'LOG-SL-002': [
    { id: 'sub-rm', type: 'rack', name: 'Rack M', code: 'RAC-M' },
    { id: 'sub-rm-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack M' },
    { id: 'sub-rm-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack M' },
    { id: 'sub-rm-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack M' },
    { id: 'sub-rm-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack M' },
    { id: 'sub-rm-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack M' },

    { id: 'sub-rn', type: 'rack', name: 'Rack N', code: 'RAC-N' },
    { id: 'sub-rn-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack N' },
    { id: 'sub-rn-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack N' },
    { id: 'sub-rn-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack N' },
    { id: 'sub-rn-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack N' },
    { id: 'sub-rn-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack N' },

    { id: 'sub-ro', type: 'rack', name: 'Rack O', code: 'RAC-O' },
    { id: 'sub-ro-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack O' },
    { id: 'sub-ro-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack O' },
    { id: 'sub-ro-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack O' },
    { id: 'sub-ro-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack O' },
    { id: 'sub-ro-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack O' },

    { id: 'sub-rp', type: 'rack', name: 'Rack P', code: 'RAC-P' },
    { id: 'sub-rp-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack P' },
    { id: 'sub-rp-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack P' },
    { id: 'sub-rp-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack P' },
    { id: 'sub-rp-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack P' },
    { id: 'sub-rp-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack P' },
    { id: 'sub-rp-l6', type: 'level', name: 'Level 6', code: 'L6', parent_name: 'Rack P' },
    { id: 'sub-rp-l7', type: 'level', name: 'Level 7', code: 'L7', parent_name: 'Rack P' },
    { id: 'sub-rp-l8', type: 'level', name: 'Level 8', code: 'L8', parent_name: 'Rack P' },

    { id: 'sub-rq', type: 'rack', name: 'Rack Q', code: 'RAC-Q' },
    { id: 'sub-rq-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack Q' },
    { id: 'sub-rq-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack Q' },
    { id: 'sub-rq-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack Q' },
    { id: 'sub-rq-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack Q' },
    { id: 'sub-rq-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack Q' },

    { id: 'sub-rr', type: 'rack', name: 'Rack R', code: 'RAC-R' },
    { id: 'sub-rr-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack R' },
    { id: 'sub-rr-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack R' },
    { id: 'sub-rr-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack R' },
    { id: 'sub-rr-l4', type: 'level', name: 'Level 4', code: 'L4', parent_name: 'Rack R' },
    { id: 'sub-rr-l5', type: 'level', name: 'Level 5', code: 'L5', parent_name: 'Rack R' },
  ],
  'LOG-SL-001': [
    { id: 'sub-sl1-ra', type: 'rack', name: 'Rack A', code: 'RAC-A' },
    { id: 'sub-sl1-ra-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack A' },
    { id: 'sub-sl1-ra-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack A' },
    { id: 'sub-sl1-ra-l3', type: 'level', name: 'Level 3', code: 'L3', parent_name: 'Rack A' },
    { id: 'sub-sl1-rb', type: 'rack', name: 'Rack B', code: 'RAC-B' },
    { id: 'sub-sl1-rb-l1', type: 'level', name: 'Level 1', code: 'L1', parent_name: 'Rack B' },
    { id: 'sub-sl1-rb-l2', type: 'level', name: 'Level 2', code: 'L2', parent_name: 'Rack B' },
  ],
  'LOG-MF-001': [
    { id: 'sub-mf-f1', type: 'rack', name: 'Main Freezer Unit 1', code: 'MF-01' },
    { id: 'sub-mf-f1-s1', type: 'level', name: 'Shelf 1 (Top)', code: 'S1', parent_name: 'Main Freezer Unit 1' },
    { id: 'sub-mf-f1-s2', type: 'level', name: 'Shelf 2 (Middle)', code: 'S2', parent_name: 'Main Freezer Unit 1' },
    { id: 'sub-mf-f1-s3', type: 'level', name: 'Shelf 3 (Bottom)', code: 'S3', parent_name: 'Main Freezer Unit 1' },
  ],
  'LOG-TL-001': [
    { id: 'sub-tl-t1', type: 'rack', name: 'Top Loading Fridge A', code: 'TL-A' },
    { id: 'sub-tl-t1-s1', type: 'level', name: 'Upper Compartment', code: 'S1', parent_name: 'Top Loading Fridge A' },
    { id: 'sub-tl-t1-s2', type: 'level', name: 'Lower Compartment', code: 'S2', parent_name: 'Top Loading Fridge A' },
  ]
}

function readLocalCache(hospitalId: string, storeCode?: string): SubLocationUnit[] | null {
  try {
    const raw = localStorage.getItem(getCacheKey(hospitalId, storeCode))
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (storeCode && DEFAULT_SUB_LOCATIONS[storeCode]) {
          const defaults = DEFAULT_SUB_LOCATIONS[storeCode]
          const existingNames = new Set(parsed.map((item: SubLocationUnit) => item.name))
          const missingDefaults = defaults.filter(item => !existingNames.has(item.name))
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults]
            writeLocalCache(hospitalId, storeCode, merged)
            return merged
          }
        }
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to read sub-location cache:', err)
  }
  if (storeCode && DEFAULT_SUB_LOCATIONS[storeCode]) {
    const defaults = DEFAULT_SUB_LOCATIONS[storeCode]
    writeLocalCache(hospitalId, storeCode, defaults)
    return defaults
  }
  return null
}

function writeLocalCache(hospitalId: string, storeCode: string | undefined, data: SubLocationUnit[]) {
  try {
    localStorage.setItem(getCacheKey(hospitalId, storeCode), JSON.stringify(data))
  } catch (err) {
    console.error('Failed to write sub-location cache:', err)
  }
}

function findLocalCacheFallback(hospitalId: string, storeCode?: string, storeId?: string): SubLocationUnit[] | null {
  try {
    const prefix = `sub_locations_${hospitalId}_`
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (storeId && parsed.some((item: any) => item.store_id === storeId)) {
              return parsed
            }
            return parsed
          }
        }
      }
    }
  } catch (err) {}
  return null
}

/**
 * Load all sub-locations for a given store location from Supabase or LocalStorage
 */
export async function loadStoreSubLocations(
  hospitalId: string,
  storeCode?: string,
  storeId?: string
): Promise<SubLocationUnit[]> {
  let cached = storeCode ? readLocalCache(hospitalId, storeCode) : null

  if (!cached || cached.length === 0) {
    cached = findLocalCacheFallback(hospitalId, storeCode, storeId)
    if (cached && cached.length > 0 && storeCode) {
      writeLocalCache(hospitalId, storeCode, cached)
    }
  }

  if (!isSupabaseConfigured()) {
    return cached || []
  }

  try {
    let query = supabase.from('store_sub_locations').select('*').eq('hospital_id', hospitalId)
    if (storeCode && storeId) {
      query = query.or(`store_code.eq.${storeCode},store_id.eq.${storeId}`)
    } else if (storeCode) {
      query = query.eq('store_code', storeCode)
    } else if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Supabase query error for sub-locations, using cache:', error.message)
      return cached || []
    }

    if (data && data.length > 0) {
      const items: SubLocationUnit[] = data.map((row: any) => ({
        id: row.id,
        store_id: row.store_id || storeId || undefined,
        type: row.type as any,
        name: row.name,
        code: row.code,
        parent_name: row.parent_name || undefined,
        notes: row.notes || undefined,
      }))

      if (storeCode) {
        writeLocalCache(hospitalId, storeCode, items)
      }
      return items
    }
  } catch (err) {
    console.error('Error fetching sub-locations from Supabase:', err)
  }

  return cached || []
}

/**
 * Save / sync full sub-locations list for a store to Supabase & LocalStorage
 */
export async function syncStoreSubLocations(
  hospitalId: string,
  storeCode: string,
  subLocations: SubLocationUnit[],
  storeId?: string
): Promise<boolean> {
  // Always update LocalStorage cache first
  writeLocalCache(hospitalId, storeCode, subLocations)

  if (!isSupabaseConfigured()) return true

  try {
    if (storeId) {
      await supabase.from('store_sub_locations').delete().eq('hospital_id', hospitalId).or(`store_code.eq.${storeCode},store_id.eq.${storeId}`)
    } else {
      await supabase.from('store_sub_locations').delete().eq('hospital_id', hospitalId).eq('store_code', storeCode)
    }

    if (subLocations.length === 0) return true

    // Insert all active sub-locations
    const rows = subLocations.map(unit => ({
      id: unit.id,
      hospital_id: hospitalId,
      store_id: unit.store_id || storeId || null,
      store_code: storeCode,
      type: unit.type,
      name: unit.name,
      code: unit.code,
      parent_name: unit.parent_name || null,
      notes: unit.notes || null,
    }))

    const { error } = await supabase.from('store_sub_locations').insert(rows)

    if (error) {
      console.error('Failed to sync sub-locations to Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('Error syncing sub-locations to Supabase:', err)
    return false
  }
}
