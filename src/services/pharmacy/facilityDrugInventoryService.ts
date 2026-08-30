/**
 * Facility Drug Inventory Service
 * Persists selected facility inventory items to Supabase so they are
 * shared across all browsers, devices, and environments (localhost + production).
 *
 * localStorage is still used as a fast local cache to avoid loading delays,
 * but Supabase is the source of truth.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { DrugWithRelations } from '@/types/pharmacy'

export interface FacilityInventoryRow {
  id: string
  hospital_id: string
  drug_id: string
  facility_stock: number
  min_buffer_level: number
  batch_number?: string | null
  expiry_date?: string | null
  location?: string | null
  notes?: string | null
  added_at: string
  updated_at: string
}

/** Full item joined with drug catalog data */
export interface FacilityDrugItem extends DrugWithRelations {
  facility_inventory_id?: string
  added_at?: string
  facility_stock?: number
  min_buffer_level?: number
  batch_number?: string
  batch_no?: string
  expiry_date?: string
  exp_date?: string
  location?: string
  item_code?: string
  item_name?: string
  uom?: string
  is_active?: boolean
  notes?: string
}

// ─── Local Cache Helpers ─────────────────────────────────────────────────────

function cacheKey(hospitalId: string) {
  return `facility_drug_items_${hospitalId}`
}

function readCache(hospitalId: string): FacilityDrugItem[] {
  try {
    const raw = localStorage.getItem(cacheKey(hospitalId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCache(hospitalId: string, items: FacilityDrugItem[]) {
  try {
    localStorage.setItem(cacheKey(hospitalId), JSON.stringify(items))
  } catch {}
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Load facility drug inventory.
 * • If Supabase is configured: fetch from DB, write to cache, return DB rows.
 * • Otherwise: fall back to local cache.
 */
export async function loadFacilityDrugInventory(
  hospitalId: string
): Promise<FacilityDrugItem[]> {
  if (!isSupabaseConfigured()) {
    return readCache(hospitalId)
  }

  try {
    const { data, error } = await supabase
      .from('facility_drug_inventory')
      .select(`
        id,
        hospital_id,
        drug_id,
        facility_stock,
        min_buffer_level,
        batch_number,
        expiry_date,
        location,
        notes,
        added_at,
        updated_at,
        drug:drugs (
          id,
          hospital_id,
          drug_code,
          drug_name,
          generic_name,
          brand_name,
          dosage_form,
          strength,
          unit_of_measure,
          category_id,
          is_controlled,
          requires_prescription,
          storage_conditions,
          min_stock_level,
          max_stock_level,
          reorder_level,
          lead_time_days,
          status,
          sku,
          pku,
          supplier_id,
          procurement_vote,
          price,
          packaging_description,
          item_sub_class,
          cc_contract_number,
          cc_contract_start_date,
          cc_contract_end_date,
          cc_contract_status,
          cc_supplier_name,
          category:drug_categories!drugs_category_id_fkey (*),
          supplier:suppliers (*)
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('added_at', { ascending: false })

    if (error) throw error

    const items: FacilityDrugItem[] = (data || []).map((row: any) => ({
      // Spread all drug catalog fields
      ...row.drug,
      // Overlay facility-specific fields
      facility_inventory_id: row.id,
      facility_stock: row.facility_stock ?? 0,
      min_buffer_level: row.min_buffer_level ?? 20,
      batch_number: row.batch_number ?? '',
      expiry_date: row.expiry_date ?? '',
      location: row.location ?? '',
      notes: row.notes ?? '',
      added_at: row.added_at,
    }))

    // ─── SYNC WITH KEW.PS-4 LEDGER BATCHES & TRANSACTIONS ───
    try {
      // 1. Fetch active batches from pharmacy_stock_batches
      const { data: batches } = await supabase
        .from('pharmacy_stock_batches')
        .select('item_id, batch_number, expiry_date, quantity_on_hand, status')
        .eq('hospital_id', hospitalId)
        .in('status', ['available', 'quarantine', 'active'])

      // 2. Fetch stock transactions for fallbacks
      const { data: transactions } = await supabase
        .from('pharmacy_stock_transactions')
        .select(`
          item_id,
          quantity,
          created_at,
          batch:pharmacy_stock_batches(batch_number, expiry_date)
        `)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })

      const batchMap = new Map<string, { totalStock: number; primaryBatch: string; earliestExpiry: string }>()
      if (batches && batches.length > 0) {
        batches.forEach((b: any) => {
          if (!b.item_id) return
          const existing = batchMap.get(b.item_id) || { totalStock: 0, primaryBatch: '', earliestExpiry: '' }
          const stock = Number(b.quantity_on_hand || 0)
          const batchNo = b.batch_number || ''
          const expDate = b.expiry_date || ''

          let primaryBatch = existing.primaryBatch
          if (!primaryBatch && batchNo) primaryBatch = batchNo

          let earliestExpiry = existing.earliestExpiry
          if (expDate && (!earliestExpiry || expDate < earliestExpiry)) {
            earliestExpiry = expDate
          }

          batchMap.set(b.item_id, {
            totalStock: existing.totalStock + stock,
            primaryBatch,
            earliestExpiry,
          })
        })
      }

      const txMap = new Map<string, { latestBalance: number; latestBatch: string; latestExpiry: string }>()
      if (transactions && transactions.length > 0) {
        transactions.forEach((t: any) => {
          if (!t.item_id || txMap.has(t.item_id)) return
          const batchObj = Array.isArray(t.batch) ? t.batch[0] : t.batch
          txMap.set(t.item_id, {
            latestBalance: Number(t.quantity || 0),
            latestBatch: batchObj?.batch_number || '',
            latestExpiry: batchObj?.expiry_date || '',
          })
        })
      }

      items.forEach(item => {
        const drugId = item.id || (item as any).drug_id
        const bInfo = drugId ? batchMap.get(drugId) : null
        const tInfo = drugId ? txMap.get(drugId) : null
        const dbStock = item.facility_stock

        if (bInfo && (bInfo.totalStock > 0 || bInfo.primaryBatch || bInfo.earliestExpiry)) {
          if (typeof dbStock === 'number' && dbStock >= 0 && dbStock !== bInfo.totalStock && dbStock > 0) {
            // Respect facility_stock explicitly set on facility_drug_inventory table (e.g. from Check & Found or direct edit)
            item.facility_stock = dbStock
          } else if (bInfo.totalStock > 0) {
            item.facility_stock = bInfo.totalStock
          } else if (tInfo && tInfo.latestBalance > 0) {
            item.facility_stock = tInfo.latestBalance
          }
          if (bInfo.primaryBatch) item.batch_number = bInfo.primaryBatch
          if (bInfo.earliestExpiry) item.expiry_date = bInfo.earliestExpiry
        } else if (tInfo) {
          if (tInfo.latestBalance > 0) {
            item.facility_stock = tInfo.latestBalance
          }
          if (tInfo.latestBatch && !item.batch_number) item.batch_number = tInfo.latestBatch
          if (tInfo.latestExpiry && !item.expiry_date) item.expiry_date = tInfo.latestExpiry
        }
      })
    } catch (syncErr) {
      console.warn('[FacilityInventory] Batch sync warning:', syncErr)
    }

    try {
      const overrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
      items.forEach(item => {
        const drugId = item.id || (item as any).drug_id
        if (drugId && overrides[drugId]) {
          const ov = overrides[drugId]
          if (ov.location) item.location = ov.location
          if (ov.min_stock !== undefined) (item as any).min_stock_level = ov.min_stock
          if (ov.max_stock !== undefined) (item as any).max_stock_level = ov.max_stock
          if (ov.reorder_level !== undefined) item.min_buffer_level = ov.reorder_level
        }
      })
    } catch {}

    writeCache(hospitalId, items)
    return items
  } catch (err) {
    console.error('[FacilityInventory] Failed to load from Supabase, using cache:', err)
    return readCache(hospitalId)
  }
}

// ─── Add ──────────────────────────────────────────────────────────────────────

export async function addToFacilityDrugInventory(
  hospitalId: string,
  drug: DrugWithRelations,
  facilityStock = 0,
  minBufferLevel = 20
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Offline: write to cache only
    const cached = readCache(hospitalId)
    if (cached.some(i => i.id === drug.id)) {
      return { success: false, error: 'Item sudah wujud dalam Inventori Fasiliti.' }
    }
    const item: FacilityDrugItem = {
      ...drug,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
      added_at: new Date().toISOString(),
    }
    writeCache(hospitalId, [item, ...cached])
    return { success: true }
  }

  try {
    const { error } = await supabase
      .from('facility_drug_inventory')
      .insert({
        hospital_id: hospitalId,
        drug_id: drug.id,
        facility_stock: facilityStock,
        min_buffer_level: minBufferLevel,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Item sudah wujud dalam Inventori Fasiliti.' }
      }
      throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FacilityInventory] Add failed:', err)
    return { success: false, error: err?.message || 'Gagal menambah item.' }
  }
}

// ─── Batch Add ────────────────────────────────────────────────────────────────

export async function batchAddToFacilityDrugInventory(
  hospitalId: string,
  drugs: DrugWithRelations[],
  facilityStock = 0,
  minBufferLevel = 20
): Promise<{ added: number; skipped: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    const cached = readCache(hospitalId)
    const existingIds = new Set(cached.map(i => i.id))
    const toAdd = drugs.filter(d => !existingIds.has(d.id))
    const newItems: FacilityDrugItem[] = toAdd.map(d => ({
      ...d,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
      added_at: new Date().toISOString(),
    }))
    writeCache(hospitalId, [...newItems, ...cached])
    return { added: newItems.length, skipped: drugs.length - newItems.length }
  }

  try {
    const rows = drugs.map(d => ({
      hospital_id: hospitalId,
      drug_id: d.id,
      facility_stock: facilityStock,
      min_buffer_level: minBufferLevel,
    }))

    const { error, data } = await supabase
      .from('facility_drug_inventory')
      .upsert(rows, { onConflict: 'hospital_id,drug_id', ignoreDuplicates: true })
      .select('id')

    if (error) throw error

    return { added: (data || []).length, skipped: drugs.length - (data || []).length }
  } catch (err: any) {
    console.error('[FacilityInventory] Batch add failed:', err)
    return { added: 0, skipped: drugs.length, error: err?.message }
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateFacilityDrugInventoryItem(
  hospitalId: string,
  drugId: string,
  updates: Partial<{
    facility_stock: number
    min_buffer_level: number
    batch_number: string
    expiry_date: string
    location: string
    notes: string
  }>
): Promise<{ success: boolean; error?: string }> {
  // Always update local cache for immediate UI reflection
  const cached = readCache(hospitalId)
  const idx = cached.findIndex(i => i.id === drugId || (i as any).drug_id === drugId || (i as any).facility_inventory_id === drugId)
  if (idx !== -1) {
    cached[idx] = { ...cached[idx], ...updates }
    writeCache(hospitalId, cached)
  }

  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { data, error } = await supabase
      .from('facility_drug_inventory')
      .upsert(
        { hospital_id: hospitalId, drug_id: drugId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'hospital_id,drug_id' }
      )
      .select('id')

    if (error) throw error

    if (!data || data.length === 0) {
      // RLS silently blocked the update (e.g. session expired) or IDs don't match
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          success: false,
          error: 'Sesi anda telah tamat. Sila log masuk semula untuk menyimpan perubahan.',
        }
      }
      return {
        success: false,
        error: 'Tiada rekod yang dikemaskini. ID hospital/ubat tidak sepadan.',
      }
    }

    if (updates.facility_stock !== undefined) {
      try {
        const { data: batches } = await supabase
          .from('pharmacy_stock_batches')
          .select('id')
          .eq('hospital_id', hospitalId)
          .eq('item_id', drugId)
          .in('status', ['available', 'quarantine', 'active'])
          .order('expiry_date', { ascending: true })

        if (batches && batches.length > 0) {
          await supabase
            .from('pharmacy_stock_batches')
            .update({
              quantity_on_hand: updates.facility_stock,
              status: updates.facility_stock <= 0 ? 'depleted' : 'available',
              updated_at: new Date().toISOString()
            })
            .eq('id', batches[0].id)

          for (let i = 1; i < batches.length; i++) {
            await supabase
              .from('pharmacy_stock_batches')
              .update({ quantity_on_hand: 0, status: 'depleted', updated_at: new Date().toISOString() })
              .eq('id', batches[i].id)
          }
        }
      } catch (bErr) {
        console.warn('[FacilityInventory] Batch sync on edit warning:', bErr)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FacilityInventory] Update failed:', err)
    return { success: false, error: err?.message }
  }
}

// ─── Bulk Assign Location ──────────────────────────────────────────────────

export async function bulkAssignLocationToFacilityDrugItems(
  hospitalId: string,
  drugIds: string[],
  locationString: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const cached = readCache(hospitalId)
  const drugIdSet = new Set(drugIds)
  let updatedCount = 0

  const updatedCache = cached.map(item => {
    if (drugIdSet.has(item.id) || (item.facility_inventory_id && drugIdSet.has(item.facility_inventory_id))) {
      updatedCount++
      return { ...item, location: locationString }
    }
    return item
  })

  writeCache(hospitalId, updatedCache)

  if (!isSupabaseConfigured()) {
    return { success: true, count: updatedCount }
  }

  try {
    const { error, data } = await supabase
      .from('facility_drug_inventory')
      .update({ location: locationString, updated_at: new Date().toISOString() })
      .eq('hospital_id', hospitalId)
      .in('drug_id', drugIds)
      .select('id')

    if (error) {
      console.warn('[FacilityInventory] Bulk location update error, fallback cache used:', error.message)
    }

    return { success: true, count: data?.length || updatedCount || drugIds.length }
  } catch (err: any) {
    console.error('[FacilityInventory] Bulk location update failed:', err)
    return { success: true, count: updatedCount || drugIds.length }
  }
}

// ─── Delete Single ────────────────────────────────────────────────────────────

export async function removeFromFacilityDrugInventory(
  hospitalId: string,
  drugId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const cached = readCache(hospitalId)
    writeCache(hospitalId, cached.filter(i => i.id !== drugId))
    return { success: true }
  }

  try {
    const { error } = await supabase
      .from('facility_drug_inventory')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('drug_id', drugId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('[FacilityInventory] Delete failed:', err)
    return { success: false, error: err?.message }
  }
}

// ─── Delete by Scheme ─────────────────────────────────────────────────────────

export async function clearFacilityDrugInventoryByScheme(
  hospitalId: string,
  scheme: string | 'all'
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const cached = readCache(hospitalId)
    const updated = scheme === 'all'
      ? []
      : cached.filter(i => (i.procurement_vote || '').toLowerCase() !== scheme.toLowerCase())
    writeCache(hospitalId, updated)
    return { success: true }
  }

  try {
    let query = supabase
      .from('facility_drug_inventory')
      .delete()
      .eq('hospital_id', hospitalId)

    if (scheme !== 'all') {
      // We need to join with drugs to filter by scheme.
      // Use a subquery via drug_id IN (SELECT id FROM drugs WHERE procurement_vote = scheme)
      const { data: matchingDrugs } = await supabase
        .from('drugs')
        .select('id')
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', scheme.toLowerCase())

      const ids = (matchingDrugs || []).map((d: any) => d.id)
      if (ids.length === 0) return { success: true }

      const { error } = await supabase
        .from('facility_drug_inventory')
        .delete()
        .eq('hospital_id', hospitalId)
        .in('drug_id', ids)

      if (error) throw error
    } else {
      const { error } = await query
      if (error) throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FacilityInventory] Clear by scheme failed:', err)
    return { success: false, error: err?.message }
  }
}
