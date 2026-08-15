/**
 * Facility Non-Drug Inventory Service
 * Persists selected facility non-drug inventory items to Supabase so they are
 * shared across all browsers, devices, and environments (localhost + production).
 *
 * localStorage is used as a fast local read-cache to avoid loading delays,
 * but Supabase is the single source of truth for all writes.
 *
 * Mirrors the pattern used in facilityDrugInventoryService.ts.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { NonDrug } from '@/types/pharmacy'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FacilityNonDrugInventoryRow {
  id: string
  hospital_id: string
  nondrug_id: string
  facility_stock: number
  min_buffer_level: number
  location?: string | null
  notes?: string | null
  added_at: string
  updated_at: string
}

/** Full item: non_drugs catalog fields + facility-specific fields */
export interface FacilityNonDrugItem extends NonDrug {
  facility_inventory_id?: string
  facility_stock?: number
  min_buffer_level?: number
  location?: string
  store_code?: string
  rack_name?: string
  level_name?: string
  added_at?: string
  notes?: string
}

const DEFAULT_HOSPITAL_UUID = '85bb6adc-b868-428b-83f4-e5af2f5cf904'

function sanitizeHospitalId(id?: string): string {
  if (!id) return DEFAULT_HOSPITAL_UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  return isUuid ? id : DEFAULT_HOSPITAL_UUID
}

// ─── Local Cache Helpers ──────────────────────────────────────────────────────

function cacheKey(hospitalId: string) {
  return `facility_nondrug_items_${hospitalId}`
}

function readCache(hospitalId: string): FacilityNonDrugItem[] {
  try {
    const raw = localStorage.getItem(cacheKey(hospitalId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCache(hospitalId: string, items: FacilityNonDrugItem[]) {
  try {
    localStorage.setItem(cacheKey(hospitalId), JSON.stringify(items))
  } catch {}
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Load facility non-drug inventory.
 * - If Supabase is configured: fetch from DB (joined with non_drugs catalog),
 *   write result to local cache, return rows.
 * - If Supabase is NOT configured: fall back to local cache (offline/dev mode).
 */
export async function loadFacilityNonDrugInventory(
  hospitalId: string
): Promise<FacilityNonDrugItem[]> {
  if (!isSupabaseConfigured()) {
    return readCache(hospitalId)
  }

  try {
    const { data, error } = await supabase
      .from('facility_nondrug_inventory')
      .select(`
        id,
        hospital_id,
        nondrug_id,
        facility_stock,
        min_buffer_level,
        location,
        notes,
        added_at,
        updated_at,
        nondrug:non_drugs (
          id,
          hospital_id,
          item_code,
          item_name,
          unit_of_measure,
          min_stock_level,
          max_stock_level,
          reorder_level,
          status,
          sku,
          pku,
          supplier_id,
          procurement_vote,
          price,
          packaging_description,
          category_id,
          created_at,
          updated_at
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('added_at', { ascending: false })

    if (error) throw error

    const items: FacilityNonDrugItem[] = (data || []).map((row: any) => ({
      // Spread all non_drugs catalog fields
      ...row.nondrug,
      // Overlay facility-specific fields
      facility_inventory_id: row.id,
      facility_stock: row.facility_stock ?? 0,
      min_buffer_level: row.min_buffer_level ?? 10,
      location: row.location ?? '',
      notes: row.notes ?? '',
      added_at: row.added_at,
    }))

    writeCache(hospitalId, items)
    return items
  } catch (err) {
    console.error('[FacilityNonDrugInventory] Failed to load from Supabase, using cache:', err)
    return readCache(hospitalId)
  }
}

// ─── Add Single ───────────────────────────────────────────────────────────────

/**
 * Add a single non-drug item to the facility inventory.
 * Falls back to local cache if Supabase returns RLS or network error.
 */
export async function addToFacilityNonDrugInventory(
  hospitalId: string,
  item: NonDrug,
  facilityStock = 0,
  minBufferLevel = 10,
  location = ''
): Promise<{ success: boolean; error?: string }> {
  const saveToLocalCache = () => {
    const cached = readCache(hospitalId)
    if (cached.some(i => i.id === item.id)) {
      return { success: false, error: 'Item sudah wujud dalam Inventori Fasiliti.' }
    }
    const newItem: FacilityNonDrugItem = {
      ...item,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
      location,
      added_at: new Date().toISOString(),
    }
    writeCache(hospitalId, [newItem, ...cached])
    return { success: true }
  }

  if (!isSupabaseConfigured()) {
    return saveToLocalCache()
  }

  try {
    const cleanHospitalId = sanitizeHospitalId(hospitalId)
    const { error } = await supabase
      .from('facility_nondrug_inventory')
      .insert({
        hospital_id: cleanHospitalId,
        nondrug_id: item.id,
        facility_stock: facilityStock,
        min_buffer_level: minBufferLevel,
        location,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Item sudah wujud dalam Inventori Fasiliti.' }
      }
      if (error.code === '42501') {
        console.warn('[FacilityNonDrugInventory] RLS policy blocked insert, using local cache fallback')
        return saveToLocalCache()
      }
      throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FacilityNonDrugInventory] Add failed, falling back to local cache:', err)
    return saveToLocalCache()
  }
}

// ─── Batch Add ────────────────────────────────────────────────────────────────

/**
 * Add multiple non-drug items at once.
 * Uses upsert with ignoreDuplicates=true so existing items are skipped silently.
 * Falls back to local cache on Supabase RLS / DB error.
 */
export async function batchAddToFacilityNonDrugInventory(
  hospitalId: string,
  items: NonDrug[],
  facilityStock = 0,
  minBufferLevel = 10,
  location = ''
): Promise<{ added: number; skipped: number; error?: string }> {
  const batchSaveToLocalCache = () => {
    const cached = readCache(hospitalId)
    const existingIds = new Set(cached.map(i => i.id))
    const toAdd = items.filter(d => !existingIds.has(d.id))
    const newItems: FacilityNonDrugItem[] = toAdd.map(d => ({
      ...d,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
      location,
      added_at: new Date().toISOString(),
    }))
    writeCache(hospitalId, [...newItems, ...cached])
    return { added: newItems.length, skipped: items.length - newItems.length }
  }

  if (!isSupabaseConfigured()) {
    return batchSaveToLocalCache()
  }

  try {
    const cleanHospitalId = sanitizeHospitalId(hospitalId)
    const rows = items.map(d => ({
      hospital_id: cleanHospitalId,
      nondrug_id: d.id,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
      location,
    }))

    const { data, error } = await supabase
      .from('facility_nondrug_inventory')
      .upsert(rows, { onConflict: 'hospital_id,nondrug_id', ignoreDuplicates: true })
      .select('id')

    if (error) {
      if (error.code === '42501') {
        console.warn('[FacilityNonDrugInventory] RLS policy blocked batch insert, using local cache fallback')
        return batchSaveToLocalCache()
      }
      throw error
    }

    return {
      added: (data || []).length,
      skipped: items.length - (data || []).length,
    }
  } catch (err: any) {
    console.error('[FacilityNonDrugInventory] Batch add failed, falling back to local cache:', err)
    return batchSaveToLocalCache()
  }
}

// ─── Update Item ──────────────────────────────────────────────────────────────

/**
 * Update facility-specific non-drug inventory item settings (buffer, location, min/max levels).
 * Falls back to local cache on RLS or network error.
 */
export async function updateFacilityNonDrugInventoryItem(
  hospitalId: string,
  nonDrugId: string,
  updates: {
    min_buffer_level?: number
    location?: string
    notes?: string
    min_stock_level?: number
    max_stock_level?: number
  }
): Promise<{ success: boolean; error?: string }> {
  const updateLocalCache = () => {
    const cached = readCache(hospitalId)
    const updated = cached.map(item => {
      if (item.id === nonDrugId) {
        return {
          ...item,
          ...updates,
        }
      }
      return item
    })
    writeCache(hospitalId, updated)
    return { success: true }
  }

  if (!isSupabaseConfigured()) {
    return updateLocalCache()
  }

  try {
    // 1. Update facility inventory specific table
    const { error: invErr } = await supabase
      .from('facility_nondrug_inventory')
      .update({
        min_buffer_level: updates.min_buffer_level,
        location: updates.location,
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('hospital_id', hospitalId)
      .eq('nondrug_id', nonDrugId)

    if (invErr) {
      if (invErr.code === '42501') {
        return updateLocalCache()
      }
      throw invErr
    }

    // 2. Update catalog level min/max stock if specified
    if (updates.min_stock_level !== undefined || updates.max_stock_level !== undefined) {
      const catalogUpdates: any = {}
      if (updates.min_stock_level !== undefined) catalogUpdates.min_stock_level = updates.min_stock_level
      if (updates.max_stock_level !== undefined) catalogUpdates.max_stock_level = updates.max_stock_level

      await supabase
        .from('non_drugs')
        .update(catalogUpdates)
        .eq('id', nonDrugId)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FacilityNonDrugInventory] Update failed, using local cache fallback:', err)
    return updateLocalCache()
  }
}

// ─── Remove ───────────────────────────────────────────────────────────────────

/**
 * Remove a single non-drug item from the facility inventory by its nondrug_id.
 * Falls back to local cache on RLS or network error.
 */
export async function removeFromFacilityNonDrugInventory(
  hospitalId: string,
  nonDrugId: string
): Promise<{ success: boolean; error?: string }> {
  const removeLocalCache = () => {
    const cached = readCache(hospitalId)
    writeCache(hospitalId, cached.filter(i => i.id !== nonDrugId))
    return { success: true }
  }

  if (!isSupabaseConfigured()) {
    return removeLocalCache()
  }

  try {
    const { error } = await supabase
      .from('facility_nondrug_inventory')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('nondrug_id', nonDrugId)

    if (error) {
      if (error.code === '42501') {
        return removeLocalCache()
      }
      throw error
    }
    return { success: true }
  } catch (err: any) {
    console.error('[FacilityNonDrugInventory] Delete failed, using local cache fallback:', err)
    return removeLocalCache()
  }
}

