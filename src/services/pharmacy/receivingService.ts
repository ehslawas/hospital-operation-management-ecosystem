import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type { 
  GoodsReceipt
} from '@/types/pharmacy'
import { createCreditNoteDraft, approveCreditNote } from './creditNoteService'
import { checkAndCreateLatePenalty } from './penaltyService'

export interface GoodsReceiptCreate {
  hospital_id: string
  po_id: string
  lpo_id?: string
  receipt_date: string
  delivery_note_number?: string
  invoice_number?: string
  invoice_amount?: number
  received_by: string
  notes?: string
  document_url?: string
  document_urls?: string[]
  items: GoodsReceiptItemCreate[]
}

export interface BatchEntry {
  batch_number: string
  manufacturing_date?: string
  expiry_date: string
  quantity: number
}

export interface GoodsReceiptItemCreate {
  po_item_id: string
  item_id?: string
  item_name?: string
  quantity_ordered: number
  quantity_previously_received: number
  quantity_received: number // quantity delivered this time
  quantity_accepted: number
  quantity_rejected: number
  disposition?: 'accepted' | 'rejected' | 'credit_note'
  rejection_reason?: string
  notes?: string
  batches: BatchEntry[]
  
  // Partial Credit Note support
  credit_note_quantity?: number
  credit_note_reason?: string
  mark_remaining_as_credit_note?: boolean
  
  // UI helper for partial delivery exclusions
  arrived?: boolean
}

/**
 * Generate an auto-incrementing GR number
 */
async function generateGRNumber(hospitalId: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  // Find the latest GR for this hospital this year
  const { data, error } = await supabase
    .from('pharmacy_goods_receipts')
    .select('gr_number')
    .eq('hospital_id', hospitalId)
    .like('gr_number', `GR-${currentYear}-%`)
    .order('gr_number', { ascending: false })
    .limit(1)
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest GR number:', error)
  }
  
  let sequence = 1
  if (data && data.length > 0) {
    const lastNumber = data[0].gr_number
    const match = lastNumber.match(/GR-\d{4}-(\d{4})/)
    if (match && match[1]) {
      sequence = parseInt(match[1], 10) + 1
    }
  }
  
  return `GR-${currentYear}-${sequence.toString().padStart(4, '0')}`
}

/**
 * Fetch a PO with its items for receiving
 */
export async function getReceivingDetail(poId: string): Promise<ApiResponse<any>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    const { data: po, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select(`
        *,
        items:pharmacy_purchase_order_items(*),
        lpo:pharmacy_lpo(*, tracking:pharmacy_order_tracking(expected_delivery_date))
      `)
      .eq('id', poId)
      .single()

    if (poError) throw poError

    return { data: po, error: null }
  } catch (error) {
    console.error('Error fetching receiving detail:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch receiving detail' }
  }
}

/**
 * Create a new Goods Receipt and update associated records
 */
export async function createGoodsReceipt(data: GoodsReceiptCreate): Promise<ApiResponse<GoodsReceipt>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    const gr_number = await generateGRNumber(data.hospital_id)

    // 1. Create the GR Header
    const { data: grData, error: grError } = await supabase
      .from('pharmacy_goods_receipts')
      .insert({
        hospital_id: data.hospital_id,
        gr_number,
        po_id: data.po_id,
        lpo_id: data.lpo_id,
        receipt_date: data.receipt_date,
        delivery_note_number: data.delivery_note_number,
        invoice_number: data.invoice_number,
        invoice_amount: data.invoice_amount,
        status: 'accepted',
        received_by: data.received_by,
        notes: data.notes,
        document_url: data.document_url,
        document_urls: data.document_urls || []
      })
      .select()
      .single()

    if (grError) throw grError
    const newGr = grData as GoodsReceipt

    // 2. Prepare and Insert GR Items
    const grItems = data.items.flatMap(item => {
      const itemsToInsert = []
      
      // Full or partial credit note: we don't insert a GR item for the CN part directly,
      // but if there's no accepted quantity and it's full CN, we insert one for tracking.
      if (item.credit_note_quantity && item.credit_note_quantity > 0 && item.quantity_accepted === 0) {
        itemsToInsert.push({
          gr_id: newGr.id,
          po_item_id: item.po_item_id,
          item_id: item.item_id,
          quantity_received: 0,
          quantity_accepted: 0,
          quantity_rejected: 0,
          disposition: 'credit_note',
          rejection_reason: item.credit_note_reason || item.rejection_reason,
          notes: item.notes
        })
      }
      
      // Add accepted batches
      if (item.batches && item.batches.length > 0) {
        item.batches.forEach(batch => {
          if (batch.quantity > 0) {
            itemsToInsert.push({
              gr_id: newGr.id,
              po_item_id: item.po_item_id,
              item_id: item.item_id,
              quantity_received: batch.quantity,
              quantity_accepted: batch.quantity,
              quantity_rejected: 0,
              batch_number: batch.batch_number,
              manufacturing_date: batch.manufacturing_date,
              expiry_date: batch.expiry_date,
              disposition: 'accepted',
              notes: item.notes
            })
          }
        })
      }
      
      // Add rejected quantity as a separate row if any
      if (item.quantity_rejected > 0) {
        itemsToInsert.push({
          gr_id: newGr.id,
          po_item_id: item.po_item_id,
          item_id: item.item_id,
          quantity_received: item.quantity_rejected,
          quantity_accepted: 0,
          quantity_rejected: item.quantity_rejected,
          disposition: 'rejected',
          rejection_reason: item.rejection_reason,
          notes: item.notes
        })
      }
      
      return itemsToInsert
    })

    if (grItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('pharmacy_goods_receipt_items')
        .insert(grItems)

      if (itemsError) throw itemsError
    }

    // Fetch PO to get supplier_id and other details
    const { data: po, error: poHeaderError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id, supplier_id')
      .eq('id', data.po_id)
      .single()

    if (poHeaderError) throw poHeaderError

    // Fetch PO items to get unit_price for Credit Notes
    const { data: poItems } = await supabase
      .from('pharmacy_purchase_order_items')
      .select('id, unit_price, item_id, item_name, item_code')
      .eq('po_id', data.po_id)

    const poItemMap = new Map(poItems?.map(i => [i.id, i]) || [])

    // Collect credit note items (both partial and full)
    const cnItems = data.items
      .filter(item => (item.credit_note_quantity || 0) > 0 || item.disposition === 'credit_note')
      .map(item => {
        const poItem = poItemMap.get(item.po_item_id)
        const unitPrice = poItem?.unit_price || 0
        let quantity = item.credit_note_quantity || 0
        
        // Fallback for legacy all-or-nothing
        if (quantity === 0 && item.disposition === 'credit_note') {
           quantity = Math.max(0, item.quantity_ordered - (item.quantity_previously_received + item.quantity_accepted))
        }

        return {
          po_item_id: item.po_item_id,
          item_id: poItem?.item_id || item.item_id || '',
          item_name: poItem?.item_name || item.item_name || '',
          item_code: poItem?.item_code || '',
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          reason: item.credit_note_reason || item.notes || 'Unavailable during delivery'
        }
      })
      .filter(cn => cn.quantity > 0)

    if (cnItems.length > 0) {
      const totalAmount = cnItems.reduce((sum, item) => sum + item.total_price, 0)
      
      const cnDraft = await createCreditNoteDraft({
        hospital_id: data.hospital_id,
        po_id: data.po_id,
        supplier_id: po.supplier_id, // Passed supplier_id
        lpo_id: data.lpo_id,
        gr_id: newGr.id,
        reason: 'unavailable',
        notes: 'Auto-generated from Goods Receipt',
        amount: totalAmount,
        items: cnItems
      }, data.received_by)

      // Auto-approve the CN
      if (cnDraft.data && cnDraft.data.id) {
        await approveCreditNote(cnDraft.data.id, data.received_by)
      }
    }

    // 3. Process each item: update PO Item and Tracking
    let anyItemsReceived = false

    for (const item of data.items) {
      const cnQty = item.credit_note_quantity || (item.disposition === 'credit_note' ? (item.quantity_ordered - item.quantity_previously_received) : 0)
      const hasReceived = item.quantity_received > 0
      const hasCN = cnQty > 0
      
      if (hasReceived || hasCN) {
        anyItemsReceived = true
        
        const newTotalReceived = item.quantity_previously_received + item.quantity_accepted
        const isItemFullyReceived = (newTotalReceived + cnQty) >= item.quantity_ordered

        // Update PO item quantity_received
        await supabase
          .from('pharmacy_purchase_order_items')
          .update({ quantity_received: newTotalReceived }) // only received, CN doesn't add to stock received
          .eq('id', item.po_item_id)

        // Update Order Tracking
        if (data.lpo_id && item.item_id) {
          const trackingUpdate: any = {}
          
          if (isItemFullyReceived) {
            trackingUpdate.status = 'delivered'
            trackingUpdate.actual_delivery_date = data.receipt_date
            trackingUpdate.tarikh_serahan = data.receipt_date ? new Date(data.receipt_date).toISOString() : new Date().toISOString()
            trackingUpdate.is_overdue = false
          }
          
          if (data.lpo_id && item.item_id) {
            await supabase
              .from('pharmacy_order_tracking')
              .update(trackingUpdate)
              .eq('lpo_id', data.lpo_id)
              .eq('item_id', item.item_id)
          }
        }
      }
    }

    // 4. Update PO Status
    if (anyItemsReceived) {
      // Fetch all PO items to verify if they are fully received
      const { data: updatedPoItems } = await supabase
        .from('pharmacy_purchase_order_items')
        .select('id, quantity_ordered, quantity_received')
        .eq('po_id', data.po_id)
      
      // Also fetch any credit notes for this PO to see the credited quantities
      const { data: creditNotes } = await supabase
        .from('pharmacy_credit_notes')
        .select('id')
        .eq('po_id', data.po_id)
        
      const cnItemQuantities = new Map<string, number>()
      if (creditNotes && creditNotes.length > 0) {
        const cnIds = creditNotes.map(cn => cn.id)
        const { data: cnItems } = await supabase
          .from('pharmacy_credit_note_items')
          .select('po_item_id, quantity')
          .in('cn_id', cnIds)
          
        if (cnItems) {
          for (const cnItem of cnItems) {
            const currentVal = cnItemQuantities.get(cnItem.po_item_id) || 0
            cnItemQuantities.set(cnItem.po_item_id, currentVal + (cnItem.quantity || 0))
          }
        }
      }

      let allItemsFullyReceived = true
      if (updatedPoItems && updatedPoItems.length > 0) {
        for (const poItem of updatedPoItems) {
          const qtyReceived = poItem.quantity_received || 0
          const qtyCredited = cnItemQuantities.get(poItem.id) || 0
          const totalFulfilled = qtyReceived + qtyCredited
          
          if (totalFulfilled < poItem.quantity_ordered) {
            allItemsFullyReceived = false
            break
          }
        }
      } else {
        allItemsFullyReceived = false
      }

      const poStatus = allItemsFullyReceived ? 'completed' : 'partial_received'
      await supabase
        .from('pharmacy_purchase_orders')
        .update({ status: poStatus })
        .eq('id', data.po_id)

      // Create log entry for PO status change
      await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: data.po_id,
          action: poStatus,
          approved_by: data.received_by,
          notes: `Goods Receipt ${gr_number} created. Status updated to ${poStatus}.`,
          created_at: new Date().toISOString()
        })
    }

    // 5. Check and create late delivery penalty for each received item that is late
    for (const item of data.items) {
      if (item.quantity_received > 0) {
        const poItem = poItemMap.get(item.po_item_id)
        const itemName = poItem?.item_name || ''
        const itemCode = poItem?.item_code || ''

        await checkAndCreateLatePenalty(
          data.hospital_id,
          data.received_by,
          data.po_id,
          newGr.id,
          data.receipt_date,
          itemName,
          itemCode,
          data.lpo_id
        )
      }
    }

    return { data: newGr, error: null }
  } catch (error) {
    console.error('Error creating goods receipt:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create goods receipt' }
  }
}

/**
 * Fetch GR history for a specific PO
 */
/**
 * Fetch a specific Goods Receipt with its items
 */
export async function getGoodsReceiptDetail(grId: string): Promise<ApiResponse<GoodsReceipt>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Try System A (pharmacy_goods_receipts)
    const { data: grData } = await supabase
      .from('pharmacy_goods_receipts')
      .select(`
        *,
        items:pharmacy_goods_receipt_items(
          *,
          po_item:pharmacy_purchase_order_items(item_name, item_code, packaging_description, unit_price)
        ),
        received_by_user:users!pharmacy_goods_receipts_received_by_fkey(full_name, jawatan),
        inspected_by_user:users!pharmacy_goods_receipts_inspected_by_fkey(full_name, jawatan),
        purchase_order:pharmacy_purchase_orders!pharmacy_goods_receipts_po_id_fkey(
          *,
          supplier:suppliers!pharmacy_purchase_orders_supplier_id_fkey(*)
        ),
        penalties:pharmacy_penalties!pharmacy_penalties_gr_id_fkey(*)
      `)
      .eq('id', grId)
      .maybeSingle()

    if (grData) {
      return { data: grData as GoodsReceipt, error: null }
    }

    // 2. Try System B (pharmacy_receiving)
    const { data: recData, error: recError } = await supabase
      .from('pharmacy_receiving')
      .select(`
        *,
        items:pharmacy_receiving_items(
          *,
          po_item:pharmacy_purchase_order_items!fk_receiving_items_lpo_item(item_name, item_code, packaging_description, unit_price)
        ),
        received_by_user:users!pharmacy_receiving_received_by_fkey(full_name, jawatan),
        lpo:pharmacy_lpo!pharmacy_receiving_lpo_id_fkey(
          *,
          purchase_order:pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(
            *,
            supplier:suppliers!pharmacy_purchase_orders_supplier_id_fkey(*)
          )
        ),
        penalties:pharmacy_penalties!pharmacy_penalties_receiving_id_fkey(*)
      `)
      .eq('id', grId)
      .maybeSingle()

    if (recError) throw recError

    if (recData) {
      // Map to GoodsReceipt shape
      const mapped: any = {
        id: recData.id,
        hospital_id: recData.hospital_id,
        po_id: recData.lpo?.purchase_order?.id,
        lpo_id: recData.lpo_id,
        gr_number: recData.do_number || `REC-${recData.id.substring(0,8)}`.toUpperCase(),
        receipt_date: recData.receiving_date,
        delivery_note_number: recData.do_number,
        status: recData.status,
        received_by: recData.received_by,
        created_at: recData.created_at,
        received_by_user: recData.received_by_user,
        purchase_order: recData.lpo?.purchase_order,
        penalties: recData.penalties,
        document_url: recData.do_document_url,
        document_urls: recData.do_document_urls || [],
        items: recData.items?.map((i: any) => ({
          id: i.id,
          gr_id: recData.id,
          po_item_id: i.lpo_item_id,
          quantity_received: i.received_quantity,
          quantity_accepted: i.received_quantity,
          quantity_rejected: 0,
          batch_number: i.batch_number,
          expiry_date: i.expiry_date,
          manufacturing_date: i.manufactured_date,
          disposition: 'accepted',
          po_item: i.po_item
        }))
      }
      return { data: mapped as GoodsReceipt, error: null }
    }

    return { data: null, error: 'Record not found' }
  } catch (error) {
    console.error('Error fetching GR detail:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch GR detail' }
  }
}

/**
 * Fetch GR history for a specific PO
 */
export async function getGoodsReceiptHistory(poId: string): Promise<ApiResponse<GoodsReceipt[]>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    const { data: grData, error: grError } = await supabase
      .from('pharmacy_goods_receipts')
      .select(`
        *,
        items:pharmacy_goods_receipt_items(
          *,
          po_item:pharmacy_purchase_order_items(item_name, item_code, packaging_description, unit_price)
        ),
        received_by_user:users!pharmacy_goods_receipts_received_by_fkey(full_name)
      `)
      .eq('po_id', poId)
      .order('created_at', { ascending: false })

    if (grError) throw grError

    let combinedGr = (grData || []) as GoodsReceipt[]

    // Fetch LPOs for this PO
    const { data: lpos } = await supabase.from('pharmacy_lpo').select('id').eq('po_id', poId)
    const lpoIds = lpos?.map(l => l.id) || []

    if (lpoIds.length > 0) {
      // Fetch receiving records from newer system
      const { data: receivingData } = await supabase
        .from('pharmacy_receiving')
        .select(`
          *,
          items:pharmacy_receiving_items(
            *,
            po_item:pharmacy_purchase_order_items!fk_receiving_items_lpo_item(item_name, item_code, packaging_description, unit_price)
          ),
          received_by_user:users!pharmacy_receiving_received_by_fkey(full_name)
        `)
        .in('lpo_id', lpoIds)
        .order('created_at', { ascending: false })

      if (receivingData && receivingData.length > 0) {
        const mappedReceiving = receivingData.map((r: any) => ({
          id: r.id,
          hospital_id: r.hospital_id,
          po_id: poId,
          lpo_id: r.lpo_id,
          gr_number: r.do_number || `REC-${r.id.substring(0,8)}`.toUpperCase(),
          receipt_date: r.receiving_date,
          delivery_note_number: r.do_number,
          status: r.status,
          received_by: r.received_by,
          created_at: r.created_at,
          received_by_user: r.received_by_user,
          document_url: r.do_document_url,
          document_urls: r.do_document_urls || [],
          items: r.items?.map((i: any) => ({
            id: i.id,
            gr_id: r.id,
            po_item_id: i.lpo_item_id, // Best match
            quantity_received: i.received_quantity,
            quantity_accepted: i.received_quantity,
            quantity_rejected: 0,
            batch_number: i.batch_number,
            expiry_date: i.expiry_date,
            manufacturing_date: i.manufactured_date,
            disposition: 'accepted',
            po_item: {
              item_name: i.po_item?.item_name,
              item_code: i.po_item?.item_code,
              packaging_description: i.po_item?.packaging_description,
              unit_price: i.po_item?.unit_price
            }
          }))
        }))
        
        combinedGr = [...combinedGr, ...mappedReceiving].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
    }

    return { data: combinedGr, error: null }
  } catch (error) {
    console.error('Error fetching GR history:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch GR history' }
  }
}

/**
 * Delete a Goods Receipt and revert associated changes
 */
export async function deleteGoodsReceipt(grId: string, poId: string): Promise<ApiResponse<boolean>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Check which system this record belongs to
    const { data: systemAGr } = await supabase
      .from('pharmacy_goods_receipts')
      .select('id, lpo_id')
      .eq('id', grId)
      .maybeSingle()

    if (systemAGr) {
      // Handle System A (pharmacy_goods_receipts)
      const { data: grItems } = await supabase
        .from('pharmacy_goods_receipt_items')
        .select('*')
        .eq('gr_id', grId)

      if (grItems) {
        for (const item of grItems) {
          if (item.quantity_accepted > 0) {
            const { data: poItem } = await supabase
              .from('pharmacy_purchase_order_items')
              .select('quantity_received')
              .eq('id', item.po_item_id)
              .single()
            
            if (poItem) {
              const newQty = Math.max(0, (poItem.quantity_received || 0) - item.quantity_accepted)
              await supabase
                .from('pharmacy_purchase_order_items')
                .update({ quantity_received: newQty })
                .eq('id', item.po_item_id)
            }
          }

          if (systemAGr.lpo_id && item.item_id) {
            await supabase
              .from('pharmacy_order_tracking')
              .update({ 
                status: 'pending', 
                actual_delivery_date: null,
                tarikh_serahan: null 
              })
              .eq('lpo_id', systemAGr.lpo_id)
              .eq('item_id', item.item_id)
          }
        }
      }

      await supabase.from('pharmacy_penalties').delete().eq('gr_id', grId)
      const { data: cns } = await supabase.from('pharmacy_credit_notes').select('id').eq('gr_id', grId)
      if (cns && cns.length > 0) {
        for (const cn of cns) {
          await supabase.from('pharmacy_credit_note_items').delete().eq('cn_id', cn.id)
        }
        await supabase.from('pharmacy_credit_notes').delete().eq('gr_id', grId)
      }

      await supabase.from('pharmacy_goods_receipt_items').delete().eq('gr_id', grId)
      await supabase.from('pharmacy_goods_receipts').delete().eq('id', grId)
    } else {
      // Handle System B (pharmacy_receiving)
      const { data: recData } = await supabase
        .from('pharmacy_receiving')
        .select('*, items:pharmacy_receiving_items(*)')
        .eq('id', grId)
        .maybeSingle()

      if (recData) {
        // Reset tracking for items in this receiving
        if (recData.items) {
          for (const item of recData.items) {
            // Revert purchase order item received quantity
            if (item.lpo_item_id && item.received_quantity > 0) {
              const { data: poItem } = await supabase
                .from('pharmacy_purchase_order_items')
                .select('quantity_received')
                .eq('id', item.lpo_item_id)
                .single()
              
              if (poItem) {
                const newQty = Math.max(0, (poItem.quantity_received || 0) - item.received_quantity)
                await supabase
                  .from('pharmacy_purchase_order_items')
                  .update({ quantity_received: newQty })
                  .eq('id', item.lpo_item_id)
              }
            }

            if (recData.lpo_id && item.item_id) {
              await supabase
                .from('pharmacy_order_tracking')
                .update({ 
                  status: 'pending', 
                  actual_delivery_date: null,
                  tarikh_serahan: null 
                })
                .eq('lpo_id', recData.lpo_id)
                .eq('item_id', item.item_id)
            }
          }
        }

        await supabase.from('pharmacy_penalties').delete().eq('receiving_id', grId)
        await supabase.from('pharmacy_lou').delete().eq('receiving_id', grId)
        await supabase.from('pharmacy_receiving_items').delete().eq('receiving_id', grId)
        await supabase.from('pharmacy_receiving_documents').delete().eq('receiving_id', grId)
        await supabase.from('pharmacy_receiving').delete().eq('id', grId)
      } else {
        throw new Error('Record not found')
      }
    }

    // 2. Update parent PO status based on remaining records in BOTH systems
    const { count: countA } = await supabase.from('pharmacy_goods_receipts').select('id', { count: 'exact' }).eq('po_id', poId)
    
    // For System B, we need to check via LPO
    const { data: lpos } = await supabase.from('pharmacy_lpo').select('id').eq('po_id', poId)
    const lpoIds = lpos?.map(l => l.id) || []
    const { count: countB } = lpoIds.length > 0 
      ? await supabase.from('pharmacy_receiving').select('id', { count: 'exact' }).in('lpo_id', lpoIds)
      : { count: 0 }

    const totalRemaining = (countA || 0) + (countB || 0)
    const newPoStatus = totalRemaining > 0 ? 'partial_received' : 'approved'
    
    await supabase
      .from('pharmacy_purchase_orders')
      .update({ status: newPoStatus })
      .eq('id', poId)

    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting record:', error)
    return { data: false, error: error instanceof Error ? error.message : 'Failed to delete record' }
  }
}

/**
 * Update an existing Goods Receipt (Modification with reason)
 */
export async function updateGoodsReceipt(
  grId: string, 
  data: Partial<GoodsReceipt> & { 
    modification_reason: string,
    items?: any[] 
  }
): Promise<ApiResponse<GoodsReceipt>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Try System A (pharmacy_goods_receipts)
    const { data: grData } = await supabase
      .from('pharmacy_goods_receipts')
      .update({
        delivery_note_number: data.delivery_note_number,
        invoice_number: data.invoice_number,
        receipt_date: data.receipt_date,
        notes: data.notes,
        document_url: data.document_url,
        document_urls: data.document_urls,
        modification_reason: data.modification_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', grId)
      .select()
      .maybeSingle()

    if (grData) {
      // Update Items for System A
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Fetch old record to calculate quantity delta
          const { data: oldItem } = await supabase
            .from('pharmacy_goods_receipt_items')
            .select('quantity_accepted, po_item_id')
            .eq('id', item.id)
            .single()

          if (oldItem) {
            const qtyDelta = (item.quantity_accepted || 0) - (oldItem.quantity_accepted || 0)

            // Update the item record
            await supabase
              .from('pharmacy_goods_receipt_items')
              .update({
                quantity_received: item.quantity_accepted,
                quantity_accepted: item.quantity_accepted,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date
              })
              .eq('id', item.id)

            // Update PO Item tracking if quantity changed
            if (qtyDelta !== 0) {
              const { data: poItem } = await supabase
                .from('pharmacy_purchase_order_items')
                .select('quantity_received')
                .eq('id', oldItem.po_item_id)
                .single()

              if (poItem) {
                await supabase
                  .from('pharmacy_purchase_order_items')
                  .update({ 
                    quantity_received: (poItem.quantity_received || 0) + qtyDelta 
                  })
                  .eq('id', oldItem.po_item_id)
              }
            }
          }
        }
      }
      return { data: grData as GoodsReceipt, error: null }
    }

    // 2. Try System B (pharmacy_receiving)
    const { data: recData, error: recError } = await supabase
      .from('pharmacy_receiving')
      .update({
        do_number: data.delivery_note_number,
        receiving_date: data.receipt_date,
        do_document_url: data.document_url,
        do_document_urls: data.document_urls,
        notes: data.notes,
        modification_reason: data.modification_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', grId)
      .select()
      .maybeSingle()

    if (recError) throw recError
    
    if (recData) {
      // Update Items for System B
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Fetch old record to calculate quantity delta
          const { data: oldItem } = await supabase
            .from('pharmacy_receiving_items')
            .select('received_quantity, lpo_item_id')
            .eq('id', item.id)
            .single()

          if (oldItem) {
            const qtyDelta = (item.quantity_accepted || 0) - (oldItem.received_quantity || 0)

            // Update the item record
            await supabase
              .from('pharmacy_receiving_items')
              .update({
                received_quantity: item.quantity_accepted,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date
              })
              .eq('id', item.id)

            // Update PO Item tracking if quantity changed
            if (qtyDelta !== 0) {
              const { data: poItem } = await supabase
                .from('pharmacy_purchase_order_items')
                .select('quantity_received')
                .eq('id', oldItem.lpo_item_id)
                .single()

              if (poItem) {
                await supabase
                  .from('pharmacy_purchase_order_items')
                  .update({ 
                    quantity_received: (poItem.quantity_received || 0) + qtyDelta 
                  })
                  .eq('id', oldItem.lpo_item_id)
              }
            }
          }
        }
      }

      return { 
        data: { 
          ...data,
          id: recData.id,
          gr_number: recData.do_number,
          delivery_note_number: recData.do_number,
          modification_reason: recData.modification_reason
        } as GoodsReceipt, 
        error: null 
      }
    }

    return { data: null, error: 'Record not found in either system' }
  } catch (error) {
    console.error('Error updating goods receipt:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update goods receipt' }
  }
}
