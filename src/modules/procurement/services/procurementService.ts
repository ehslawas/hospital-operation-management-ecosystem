// @ts-nocheck
/**
 * Pharmacy Procurement Service
 * Handles purchase orders, goods receipts, and supplier management
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  PurchaseOrder,
  PurchaseOrderWithRelations,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptWithRelations,
  Supplier,
  SupplierWithRelations,
  ProcurementFilter,
  PurchaseOrderFormData,
  GoodsReceiptFormData,
  OrderTracking,
  SupplierPenalty,
  LOU,
} from '@/types/pharmacy'
import {
  mockPurchaseOrders,
  mockSuppliers,
} from '@/services/pharmacy/mockData'
import { getBudgetForPO } from '@/services/pharmacy/budgetEngine'
import { WARRANT_CATEGORIES } from '@/services/pharmacy/warrantService'

// =====================================================
// PURCHASE ORDER MANAGEMENT
// =====================================================

/**
 * Get all purchase orders with optional filtering
 */
export async function getPurchaseOrders(
  hospitalId: string,
  filter?: ProcurementFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<PurchaseOrderWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_purchase_orders')
        .select(
          `
          id,
          hospital_id,
          po_number,
          po_type,
          supplier_id,
          budget_id,
          vote_code,
          vote_activity,
          category,
          department,
          order_date,
          expected_delivery_date,
          actual_delivery_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms,
          delivery_address,
          status,
          created_by,
          approved_by,
          approved_at,
          notes,
          created_at,
          updated_at,
          kkm_contract_number,
          inv_sq_number,
          manual_supplier_name,
          sq_suppliers,
          supplier:suppliers(*),
          budget:pharmacy_budgets(*),
          goods_receipts:pharmacy_goods_receipts(*),
          lpo:pharmacy_lpo(id, lpo_number, payment_status, receiving:pharmacy_receiving(*), assessments:pharmacy_supplier_assessments(*))
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)

      if (filter?.search) {
        const search = filter.search.trim()
        if (search) {
          // Normalize PO vs P0 character typo (e.g. user types PO26... but DB has P026...)
          const altSearch = search.toUpperCase().includes('PO') 
            ? search.replace(/PO/gi, 'P0') 
            : search.toUpperCase().includes('P0') 
              ? search.replace(/P0/gi, 'PO') 
              : search

          // 1. Find PO IDs that have matching items (searching by item_name or item_code)
          const { data: itemMatches } = await supabase
            .from('pharmacy_purchase_order_items')
            .select('po_id')
            .or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`)
          
          const poIdsFromItems = Array.from(new Set(itemMatches?.map(m => m.po_id) || []))

          // 2. Find Supplier IDs that match the search term
          const { data: supplierMatches } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('company_name', `%${search}%`)
          
          const supplierIds = supplierMatches?.map(m => m.id) || []

          // 2a. Find PO IDs from pharmacy_lpo matching lpo_number (fuzzy character matching PO vs P0)
          const { data: lpoMatches } = await supabase
            .from('pharmacy_lpo')
            .select('po_id')
            .or(`lpo_number.ilike.%${search}%,lpo_number.ilike.%${altSearch}%`)
          
          const poIdsFromLpo = Array.from(new Set(lpoMatches?.map(m => m.po_id).filter(Boolean) || []))

          // 2b. Find PO IDs from pharmacy_goods_receipts matching delivery_note_number or gr_number
          const { data: grMatches } = await supabase
            .from('pharmacy_goods_receipts')
            .select('po_id')
            .or(`delivery_note_number.ilike.%${search}%,gr_number.ilike.%${search}%,delivery_note_number.ilike.%${altSearch}%,gr_number.ilike.%${altSearch}%`)
          
          const poIdsFromGr = Array.from(new Set(grMatches?.map(m => m.po_id).filter(Boolean) || []))

          // 2c. Find PO IDs from pharmacy_receiving do_number -> lpo_id -> pharmacy_lpo -> po_id
          let poIdsFromReceiving: string[] = []
          const { data: recMatches } = await supabase
            .from('pharmacy_receiving')
            .select('lpo_id')
            .ilike('do_number', `%${search}%`)
          
          const recLpoIds = Array.from(new Set(recMatches?.map(m => m.lpo_id).filter(Boolean) || []))
          if (recLpoIds.length > 0) {
            const { data: lpoRecMatches } = await supabase
              .from('pharmacy_lpo')
              .select('po_id')
              .in('id', recLpoIds)
            poIdsFromReceiving = Array.from(new Set(lpoRecMatches?.map(m => m.po_id).filter(Boolean) || []))
          }

          // Combine all PO IDs matching items, LPO, GR, and receiving
          const allMatchingPoIds = Array.from(new Set([
            ...poIdsFromItems,
            ...poIdsFromLpo,
            ...poIdsFromGr,
            ...poIdsFromReceiving
          ]))

          // 3. Build the combined OR filter for the main query
          const orConditions = [
            `po_number.ilike.%${search}%`,
            `po_number.ilike.%${altSearch}%`,
            `delivery_address.ilike.%${search}%`,
            `manual_supplier_name.ilike.%${search}%`
          ]

          if (allMatchingPoIds.length > 0) {
            // Join PO IDs for the .in() filter
            orConditions.push(`id.in.(${allMatchingPoIds.join(',')})`)
          }

          if (supplierIds.length > 0) {
            orConditions.push(`supplier_id.in.(${supplierIds.join(',')})`)
          }

          query = query.or(orConditions.join(','))
        }
      }

      if (filter?.status && filter.status !== 'all') {
        const statusValue = filter.status as string
        if (statusValue.includes(',')) {
          const statuses = statusValue.split(',').map(s => s.trim())
          query = query.in('status', statuses)
        } else {
          query = query.eq('status', filter.status)
        }
      }

      if (filter?.supplier_id) {
        query = query.eq('supplier_id', filter.supplier_id)
      }

      if (filter?.po_type && filter.po_type !== 'all') {
        if (filter.po_type.toUpperCase() === 'PO') {
          // Exclude SQ, include everything else as PO
          query = query.neq('po_type', 'sq')
        } else if (filter.po_type.toUpperCase() === 'SQ') {
          query = query.eq('po_type', 'sq')
        } else {
          query = query.eq('po_type', filter.po_type)
        }
      }

      if (filter?.vote_code) {
        query = query.eq('vote_code', filter.vote_code)
      }

      if (filter?.category) {
        query = query.eq('category', filter.category)
      }

      if (filter?.department) {
        query = query.eq('department', filter.department)
      }

      if (filter?.date_from) {
        query = query.gte('order_date', filter.date_from)
      }

      if (filter?.date_to) {
        query = query.lte('order_date', filter.date_to)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('order_date', { ascending: false })
        .range(from, to)

      if (error) throw error

      const rows = (data || []) as PurchaseOrderWithRelations[]

      return {
        data: {
          data: rows,
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        error: null,
      }
    }

    // Fallback to mock data when Supabase is not configured
    let orders = [...mockPurchaseOrders]

    if (filter?.search) {
      const search = filter.search.toLowerCase()
      orders = orders.filter(o =>
        o.po_number.toLowerCase().includes(search) ||
        (o.manual_supplier_name || '').toLowerCase().includes(search) ||
        o.supplier?.company_name.toLowerCase().includes(search) ||
        o.items?.some(item => 
          (item.item_name || '').toLowerCase().includes(search) ||
          (item.item_code || '').toLowerCase().includes(search)
        ) ||
        o.lpo?.some(l => 
          l.lpo_number?.toLowerCase().includes(search) ||
          l.receiving?.some(r => r.do_number?.toLowerCase().includes(search))
        ) ||
        o.goods_receipts?.some(gr => 
          gr.gr_number?.toLowerCase().includes(search) ||
          gr.delivery_note_number?.toLowerCase().includes(search)
        )
      )
    }

    if (filter?.status && filter.status !== 'all') {
      orders = orders.filter(o => o.status === filter.status)
    }

    if (filter?.supplier_id) {
      orders = orders.filter(o => o.supplier_id === filter.supplier_id)
    }

    if (filter?.po_type && filter.po_type !== 'all') {
      orders = orders.filter(o => o.po_type === filter.po_type)
    }

    if (filter?.vote_code) {
      orders = orders.filter(o => o.vote_code === filter.vote_code)
    }

    if (filter?.category) {
      orders = orders.filter(o => o.category === filter.category)
    }

    if (filter?.department) {
      orders = orders.filter(o => o.department === filter.department)
    }

    if (filter?.date_from) {
      orders = orders.filter(o => o.order_date >= filter.date_from!)
    }

    if (filter?.date_to) {
      orders = orders.filter(o => o.order_date <= filter.date_to!)
    }

    orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())

    const total = orders.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = orders.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch purchase orders',
    }
  }
}

/**
 * Get aggregate statistics for purchase orders â€” counts each real status independently
 */
export async function getPurchaseOrderStats(
  hospitalId: string
): Promise<ApiResponse<{
  totalCount: number;
  totalValue: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  sentCount: number;
  partialReceivedCount: number;
  completedCount: number;
  cancelledCount: number;
}>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_purchase_orders')
        .select('status, total_amount')
        .eq('hospital_id', hospitalId)
        .neq('po_type', 'sq')

      if (error) throw error

      const stats = (data || []).reduce(
        (acc, po) => {
          acc.totalCount += 1
          if (po.status !== 'cancelled') {
            acc.totalValue += po.total_amount || 0
          }
          switch (po.status) {
            case 'draft': acc.draftCount += 1; break
            case 'pending_approval': acc.pendingApprovalCount += 1; break
            case 'approved': acc.approvedCount += 1; break
            case 'sent': acc.sentCount += 1; break
            case 'partial_received': acc.partialReceivedCount += 1; break
            case 'completed': acc.completedCount += 1; break
            case 'cancelled': acc.cancelledCount += 1; break
          }
          return acc
        },
        { totalCount: 0, totalValue: 0, draftCount: 0, pendingApprovalCount: 0, approvedCount: 0, sentCount: 0, partialReceivedCount: 0, completedCount: 0, cancelledCount: 0 }
      )

      return { data: stats, error: null }
    }

    // Fallback to mock data
    const stats = mockPurchaseOrders.reduce(
      (acc, po) => {
        acc.totalCount += 1
        if (po.status !== 'cancelled') {
          acc.totalValue += po.total_amount || 0
        }
        switch (po.status) {
          case 'draft': acc.draftCount += 1; break
          case 'pending_approval': acc.pendingApprovalCount += 1; break
          case 'approved': acc.approvedCount += 1; break
          case 'sent': acc.sentCount += 1; break
          case 'partial_received': acc.partialReceivedCount += 1; break
          case 'completed': acc.completedCount += 1; break
          case 'cancelled': acc.cancelledCount += 1; break
        }
        return acc
      },
      { totalCount: 0, totalValue: 0, draftCount: 0, pendingApprovalCount: 0, approvedCount: 0, sentCount: 0, partialReceivedCount: 0, completedCount: 0, cancelledCount: 0 }
    )

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching purchase order stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    }
  }
}

/**
 * Get distinct metadata for filters (vote codes, etc)
 */
export async function getProcurementMetadata(hospitalId: string): Promise<ApiResponse<{
  voteCodes: string[];
  categories: string[];
}>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_purchase_orders')
        .select('vote_code, category')
        .eq('hospital_id', hospitalId)

      if (error) throw error

      const voteCodes = Array.from(new Set((data || []).map(d => d.vote_code).filter(Boolean))) as string[]
      
      // Filter categories against standard pharmacy categories
      const validCategoryValues = WARRANT_CATEGORIES.map(c => c.value.toLowerCase());
      const categories = Array.from(new Set((data || [])
        .map(d => d.category?.toLowerCase())
        .filter(cat => cat && validCategoryValues.includes(cat))
      )) as string[]

      return { data: { voteCodes, categories }, error: null }
    }

    return { data: { voteCodes: ['080702', '990102'], categories: ['drug', 'non_drug'] }, error: null }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch metadata' }
  }
}

/**
 * Get single purchase order by ID
 */
export async function getPurchaseOrderById(
  poId: string
): Promise<ApiResponse<PurchaseOrderWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_purchase_orders')
        .select(
          `
          *,
          supplier:suppliers(id, supplier_code, company_name, contact_person, email, phone, address, registration_number, bank_account, bank_name, account_number, account_document_url, mof_certificate_url, bumiputera_registration_certificate_url, supplier_type, status, performance_rating, notes, hospital_id, created_at, updated_at),
          budget:pharmacy_budgets(*),
          items:pharmacy_purchase_order_items(*),
          goods_receipts:pharmacy_goods_receipts(*),
          creator:users!pharmacy_purchase_orders_created_by_fkey(id, full_name, email),
          approver:users!pharmacy_purchase_orders_approved_by_fkey(id, full_name, email),
          canceller:users!pharmacy_purchase_orders_cancelled_by_fkey(id, full_name, email)
        `
        )
        .eq('id', poId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return { data: null, error: 'Purchase order not found' }
      }

      // If PO has a contract number (from PO field or supplier record), enrich with contract details
      const order = data as any

      // Fetch all active/relevant contracts for this supplier to match against items
      if (order.supplier && order.items && order.items.length > 0) {
        try {
          let { data: supplierContracts } = await supabase
            .from('contracts')
            .select('*')
            .eq('supplier_id', order.supplier.id)
            .eq('status', 'active')

          if ((!supplierContracts || supplierContracts.length === 0) && order.supplier.company_name) {
            // Retrieve all active contracts to perform robust JS matching (handles spacing/punctuation typos in supplier name)
            const { data: allActive } = await supabase
              .from('contracts')
              .select('*')
              .eq('status', 'active')

            const clean = (name: string) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/sdn\s*bhd/gi, '').replace(/sdn/gi, '').replace(/bhd/gi, '').trim() : '';
            const targetCleanName = clean(order.supplier.company_name);

            const nameContracts = (allActive || []).filter((c: any) => {
              if (!c.supplier_name) return false;
              const cleanContractSupplier = clean(c.supplier_name);
              return cleanContractSupplier === targetCleanName || 
                     cleanContractSupplier.includes(targetCleanName) || 
                     targetCleanName.includes(cleanContractSupplier);
            });

            if (nameContracts && nameContracts.length > 0) {
              supplierContracts = nameContracts;
              
              // Self-healing: if name-matched contracts don't have supplier_id set, update them
              nameContracts.forEach((c: any) => {
                if (!c.supplier_id && order.supplier.id) {
                  void supabase
                    .from('contracts')
                    .update({ supplier_id: order.supplier.id })
                    .eq('id', c.id)
                    .then(() => {}); // fire-and-forget
                }
              });
            }
          }

          if (supplierContracts && supplierContracts.length > 0) {
            const clean = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            
            order.items.forEach((item: any) => {
              const cleanItemName = clean(item.item_name);
              const cleanItemCode = clean(item.item_code);
              const itemPrice = Number(item.unit_price || 0);

              // Find matching contract
              let matched = null;

              // 1. Match by item_code
              if (cleanItemCode) {
                matched = supplierContracts.find((c: any) => clean(c.item_code) === cleanItemCode);
              }

              // 2. Match by exact cleaned name
              if (!matched) {
                matched = supplierContracts.find((c: any) => clean(c.contract_name) === cleanItemName);
              }

              // 3. Match by name inclusion and price match
              if (!matched) {
                matched = supplierContracts.find((c: any) => {
                  const cleanContractName = clean(c.contract_name);
                  const priceDiff = Math.abs(Number(c.unit_price || 0) - itemPrice);
                  const nameMatch = cleanContractName.includes(cleanItemName) || cleanItemName.includes(cleanContractName) ||
                                    cleanContractName.startsWith(cleanItemName.substring(0, 10)) || cleanItemName.startsWith(cleanContractName.substring(0, 10));
                  return nameMatch && priceDiff < 0.01;
                });
              }

              // 4. Match by price + word similarity
              if (!matched) {
                matched = supplierContracts.find((c: any) => {
                  const priceDiff = Math.abs(Number(c.unit_price || 0) - itemPrice);
                  if (priceDiff < 0.01) {
                    const words1 = (item.item_name || '').toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4);
                    const words2 = (c.contract_name || '').toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4);
                    const hasCommonWord = words1.some((w: string) => words2.includes(w));
                    return hasCommonWord;
                  }
                  return false;
                });
              }

              // 5. Match by loose name inclusion
              if (!matched) {
                matched = supplierContracts.find((c: any) => {
                  const cleanContractName = clean(c.contract_name);
                  return cleanContractName.includes(cleanItemName) || cleanItemName.includes(cleanContractName);
                });
              }

              if (matched) {
                item.contract_number = matched.contract_number;
                item.delivery_period = matched.delivery_period || matched.metadata?.['tempoh serahan'];
                item.contract_end_date = matched.end_date;
              }
            });

            // If PO itself doesn't have a contract number, find the first contract item that does
            if (!order.kkm_contract_number) {
              const firstContractItem = order.items.find((it: any) => it.contract_number);
              if (firstContractItem) {
                order.kkm_contract_number = firstContractItem.contract_number;
                // Persist the enriched contract number back to DB so it's permanently saved
                void supabase
                  .from('pharmacy_purchase_orders')
                  .update({ kkm_contract_number: firstContractItem.contract_number })
                  .eq('id', order.id)
                  .then(() => { /* fire-and-forget */ });
              }
            }
          }
        } catch (contractErr) {
          console.error('Error fetching contracts for PO items:', contractErr);
        }
      }

      const effectiveContractNo = order.kkm_contract_number || order.supplier?.contract_number
      if (effectiveContractNo && order.supplier) {
        // Always stamp the effective contract number onto the supplier object
        // so that PDF and detail view can reliably read it from one place
        if (!order.supplier.contract_number) {
          order.supplier.contract_number = effectiveContractNo;
        }

        // Only hit contracts if we are missing end_date or delivery_period
        if (!order.supplier.contract_end_date || !order.supplier.delivery_period) {
          try {
            const { data: contractData } = await supabase
              .from('contracts')
              .select('end_date, delivery_period')
              .eq('contract_number', effectiveContractNo)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle()

            if (contractData) {
              if (!order.supplier.contract_end_date) {
                order.supplier.contract_end_date = contractData.end_date;
              }
              if (!order.supplier.delivery_period) {
                order.supplier.delivery_period = contractData.delivery_period;
              }
            }
          } catch (_err) {
            // silently ignore
          }
        }
      }

      // Fetch all relevant logs for this PO to resolve cancellation info
      const { data: logs } = await supabase
        .from('approval_logs')
        .select(`
          *,
          approver:users!approval_logs_approved_by_fkey1(full_name)
        `)
        .eq('entity_id', poId)
        .eq('entity_type', 'purchase_order')
        .order('created_at', { ascending: false })

      // Resolve creator name
      if (order.creator) {
        order.creator_name = order.creator.full_name
      }

      if (logs) {
        // Resolve approver from logs if not on PO
        const approvalLog = logs.find((l: any) => l.action === 'approved' || l.action === 'auto_approved')
        if (approvalLog) {
          order.approver_name = approvalLog.approver?.full_name || order.creator_name || 'Unknown User'
          if (!order.approved_at) order.approved_at = approvalLog.created_at
        } else if (order.approver) {
          order.approver_name = order.approver.full_name
        }

        // Resolve canceller: prefer PO column, fallback to logs
        if (order.canceller) {
          order.cancelled_by_name = order.canceller.full_name
        }
        
        const cancellationLog = logs.find((l: any) => l.action === 'cancelled' || l.action === 'rejected')
        if (cancellationLog) {
          if (!order.cancelled_by_name) {
            order.cancelled_by_name = cancellationLog.approver?.full_name
          }
          if (!order.cancelled_at) {
            order.cancelled_at = cancellationLog.created_at
          }
          order.cancellation_reason = cancellationLog.notes || order.notes
        }
        
        // Attach the full logs for activity history display
        order.activity_logs = logs || []
      } else {
        order.activity_logs = []
      }

      return { data: order as unknown as PurchaseOrderWithRelations, error: null }
    }

    const order = mockPurchaseOrders.find(o => o.id === poId)
    
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    return { data: order, error: null }
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch purchase order',
    }
  }
}

/**
 * Create new purchase order
 */
export async function createPurchaseOrder(
  hospitalId: string,
  userId: string,
  data: PurchaseOrderFormData
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = 0 // No tax
    const total_amount = subtotal

    if (isSupabaseConfigured()) {
      const today = new Date()
      const orderDate = today.toISOString().split('T')[0]
      const year = today.getFullYear()
      const isSQ = data.po_type === 'sq'
      const prefix = isSQ ? 'SQ-' : 'PO-'
      
      // Get the highest PO number for the current year and this hospital
      const { data: existingPOs, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('po_number')
        .eq('hospital_id', hospitalId)
        .like('po_number', `${prefix}${year}-%`)
        .order('po_number', { ascending: false })
        .limit(1)
      
      let nextNumber = 1
      if (!poError && existingPOs && existingPOs.length > 0) {
        const lastPONumber = existingPOs[0].po_number
        const match = lastPONumber.match(new RegExp(`${prefix}\\d{4}-(\\d{4})`))
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }
      
      const poNumber = `${prefix}${year}-${String(nextNumber).padStart(4, '0')}`

      // --- BUDGET VALIDATION ---
      if (data.vote_code !== 'other') {
        const budget = await getBudgetForPO(
          hospitalId,
          data.vote_code as any,
          data.vote_activity as any,
          (data.department || 'all') as any,
          data.category as any
        )

        if (budget.balance < total_amount) {
          return {
            data: null as any,
            error: `Insufficient budget balance. Available: RM ${budget.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Required: RM ${total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          }
        }
      }
      // -------------------------

      const { data: inserted, error } = await supabase
        .from('pharmacy_purchase_orders')
        .insert({
          hospital_id: hospitalId,
          po_number: poNumber,
          po_type: data.po_type || 'regular',
          supplier_id: data.supplier_id === 'other' ? null : data.supplier_id,
          sq_suppliers: data.sq_suppliers,
          budget_id: data.budget_id,
          vote_code: data.vote_code,
          vote_activity: data.vote_activity,
          category: data.category,
          department: data.department,
          order_date: orderDate,
          expected_delivery_date: data.expected_delivery_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms: data.payment_terms,
          delivery_address: data.delivery_address,
          status: 'draft',
          created_by: userId,
          notes: data.notes,
          inv_sq_number: data.inv_sq_number,
          program_name: data.program_name,
          manual_supplier_name: data.manual_supplier_name,
          manual_supplier_address: data.manual_supplier_address,
          manual_vote_code: data.manual_vote_code,
          manual_vote_activity: data.manual_vote_activity,
          manual_category: data.manual_category,
          manual_department: data.manual_department,
          kkm_contract_number: data.kkm_contract_number,
        })
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data.items.length > 0) {
        const poItems = data.items.map((item) => ({
          po_id: inserted.id,
          item_type: item.item_type,
          item_id: item.item_id?.startsWith('manual-') ? null : item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity_ordered: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          packaging_description: item.packaging_description,
        }))

        const { error: itemsError } = await supabase
          .from('pharmacy_purchase_order_items')
          .insert(poItems)

        if (itemsError) throw itemsError
      }

      // Create initial log entry
      await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: inserted.id,
          action: 'created',
          approved_by: userId,
          notes: 'Purchase order created as draft',
          created_at: new Date().toISOString()
        })

      return { data: inserted as PurchaseOrder, error: null }
    }

    // Fallback mock implementation when Supabase is not configured
    await new Promise(resolve => setTimeout(resolve, 500))

    const year = new Date().getFullYear()
    const mockNextNumber = 1 // In mock mode, always start from 0001
    const prefix = data.po_type === 'sq' ? 'SQ-' : 'PO-'
    const poNumber = `${prefix}${year}-${String(mockNextNumber).padStart(4, '0')}`

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      hospital_id: hospitalId,
      po_number: poNumber,
      po_type: data.po_type,
      supplier_id: data.po_type === 'sq' ? null : data.supplier_id,
      sq_suppliers: data.sq_suppliers,
      budget_id: data.budget_id,
      vote_code: data.vote_code,
      vote_activity: data.vote_activity,
      category: data.category,
      department: data.department,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: data.expected_delivery_date,
      subtotal,
      tax_amount,
      total_amount,
      payment_terms: data.payment_terms,
      delivery_address: data.delivery_address,
      status: 'draft',
      created_by: userId,
      notes: data.notes,
      created_at: new Date().toISOString(),
    }

    return { data: newOrder, error: null }
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create purchase order',
    }
  }
}

/**
 * Update existing purchase order
 */
export async function updatePurchaseOrder(
  poId: string,
  userId: string,
  data: PurchaseOrderFormData
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = 0 // No tax
    const total_amount = subtotal

    if (isSupabaseConfigured()) {
      // First, get the existing PO to preserve po_number
      const { data: existingPO, error: fetchError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('*')
        .eq('id', poId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!existingPO) {
        return { data: null, error: 'Purchase order not found' }
      }

      // Relax status check - allow editing if not cancelled
      if (existingPO.status === 'cancelled') {
        return { data: null, error: 'Cancelled purchase orders cannot be edited' }
      }

      // --- BUDGET VALIDATION ---
      if (data.vote_code !== 'other') {
        const budget = await getBudgetForPO(
          existingPO.hospital_id,
          data.vote_code as any,
          data.vote_activity as any,
          (data.department || 'all') as any,
          data.category as any,
          poId // Exclude this PO to get balance before this order
        )

        if (budget.balance < total_amount) {
          return {
            data: null as any,
            error: `Insufficient budget balance. Available: RM ${budget.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Required: RM ${total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          }
        }
      }
      // -------------------------

      // Update the purchase order
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          supplier_id: data.supplier_id === 'other' ? null : data.supplier_id,
          sq_suppliers: data.sq_suppliers,
          budget_id: data.budget_id,
          vote_code: data.vote_code,
          vote_activity: data.vote_activity,
          category: data.category,
          department: data.department,
          expected_delivery_date: data.expected_delivery_date,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms: data.payment_terms,
          delivery_address: data.delivery_address,
          notes: data.notes,
          inv_sq_number: data.inv_sq_number,
          program_name: data.program_name,
          manual_supplier_name: data.manual_supplier_name,
          manual_supplier_address: data.manual_supplier_address,
          manual_vote_code: data.manual_vote_code,
          manual_vote_activity: data.manual_vote_activity,
          manual_category: data.manual_category,
          manual_department: data.manual_department,
          kkm_contract_number: data.kkm_contract_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select('*')
        .maybeSingle()

      if (error) throw error

      // Delete existing items and insert new ones
      const { error: deleteItemsError } = await supabase
        .from('pharmacy_purchase_order_items')
        .delete()
        .eq('po_id', poId)

      if (deleteItemsError) throw deleteItemsError

      if (data.items.length > 0) {
        const poItems = data.items.map((item) => ({
          po_id: poId,
          item_type: item.item_type,
          item_id: item.item_id?.startsWith('manual-') ? null : item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity_ordered: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          packaging_description: item.packaging_description,
        }))

        const { error: itemsError } = await supabase
          .from('pharmacy_purchase_order_items')
          .insert(poItems)

        if (itemsError) throw itemsError
      }

      // Log the modification in approval_logs if not a draft
      if (existingPO.status !== 'draft') {
        const { error: logError } = await supabase
          .from('approval_logs')
          .insert({
            entity_type: 'purchase_order',
            entity_id: poId,
            action: 'modified',
            approved_by: userId,
            notes: (data as any).modification_reason || 'PO details modified',
            created_at: new Date().toISOString()
          })
        
        if (logError) console.error('Failed to log PO modification:', logError)
      }

      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation when Supabase is not configured
    await new Promise(resolve => setTimeout(resolve, 500))

    const existingOrder = mockPurchaseOrders.find(o => o.id === poId)
    if (!existingOrder) {
      return { data: null, error: 'Purchase order not found' }
    }

    if (existingOrder.status !== 'draft') {
      return { data: null, error: 'Only draft purchase orders can be edited' }
    }

    const updated: PurchaseOrder = {
      ...existingOrder,
      supplier_id: data.po_type === 'sq' ? null : data.supplier_id,
      sq_suppliers: data.sq_suppliers,
      budget_id: data.budget_id,
      vote_code: data.vote_code,
      vote_activity: data.vote_activity,
      category: data.category,
      department: data.department,
      expected_delivery_date: data.expected_delivery_date,
      subtotal,
      tax_amount,
      total_amount,
      payment_terms: data.payment_terms,
      delivery_address: data.delivery_address,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    }

    const idx = mockPurchaseOrders.findIndex(o => o.id === poId)
    if (idx !== -1) {
      mockPurchaseOrders[idx] = updated
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update purchase order',
    }
  }
}

/**
 * Submit purchase order for approval
 */
export async function submitPurchaseOrder(poId: string): Promise<ApiResponse<PurchaseOrder>> {
  try {
    if (isSupabaseConfigured()) {
      // Update status to pending_approval
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'pending_approval',
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .maybeSingle()

      if (error) throw error
      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'pending_approval' as const,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error submitting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to submit purchase order',
    }
  }
}

/**
 * Approve purchase order
 */
export async function approvePurchaseOrder(
  poId: string,
  approverId: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch the PO details to check the amount and metadata
      const { data: po, error: fetchError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('*')
        .eq('id', poId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!po) return { data: null as any, error: 'Purchase order not found' }

      // 2. Check budget availability
      if (po.vote_code !== 'other') {
        const budget = await getBudgetForPO(
          po.hospital_id,
          po.vote_code,
          po.vote_activity,
          po.department,
          po.category,
          poId
        )

        const amountToApprove = Number(po.total_amount || 0)
        if (budget.balance < amountToApprove) {
          return { 
            data: null as any, 
            error: `Insufficient budget balance. Available: RM ${budget.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Required: RM ${amountToApprove.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
          }
        }
      }

      // 3. Update status to approved and set approver info
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .maybeSingle()

      if (error) throw error

      // 4. Create approval log entry
      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: poId,
          action: 'approved',
          approved_by: approverId,
          notes: 'Purchase order approved',
          created_at: new Date().toISOString()
        })
      
      if (logError) console.error('Failed to log PO approval:', logError)

      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'approved' as const,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error approving purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to approve purchase order',
    }
  }
}

/**
 * Reject purchase order
 */
export async function rejectPurchaseOrder(
  poId: string,
  rejectorId: string,
  reason: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    if (isSupabaseConfigured()) {
      // Update status to cancelled and set rejection reason in notes
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'cancelled',
          notes: `Cancelled: ${reason}`,
          cancelled_by: rejectorId,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .maybeSingle()

      if (error) throw error

      // Create approval log entry for the cancellation
      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: poId,
          action: 'rejected', // Use 'rejected' to avoid potential check constraint issues with 'cancelled'
          approved_by: rejectorId,
          notes: reason,
          step_order: 0,
        })
        
      if (logError) {
        console.error('Failed to create cancellation audit log:', logError)
      }

      return { data: updated as PurchaseOrder, error: null }
    }


    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'cancelled' as const,
      notes: `Rejected: ${reason}`,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error rejecting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reject purchase order',
    }
  }
}

/**
 * Delete purchase order (only for draft status)
 */
export async function deletePurchaseOrder(
  poId: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      // First check if PO exists and is in draft status
      const { data: existingPO, error: fetchError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, status')
        .eq('id', poId)
        .maybeSingle()

      if (fetchError || !existingPO) {
        return { data: null, error: 'Purchase order not found' }
      }

      if (existingPO.status !== 'draft') {
        return { data: null, error: 'Only draft purchase orders can be deleted' }
      }

      // Delete PO items first (cascade should handle this, but being explicit)
      const { error: itemsError } = await supabase
        .from('pharmacy_purchase_order_items')
        .delete()
        .eq('po_id', poId)

      if (itemsError) {
        console.error('Error deleting PO items:', itemsError)
      }

      // Delete the purchase order
      const { error: deleteError } = await supabase
        .from('pharmacy_purchase_orders')
        .delete()
        .eq('id', poId)

      if (deleteError) {
        throw deleteError
      }

      return { data: true, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const orderIndex = mockPurchaseOrders.findIndex(o => o.id === poId)
    if (orderIndex === -1) {
      return { data: null, error: 'Purchase order not found' }
    }

    const order = mockPurchaseOrders[orderIndex]
    if (order.status !== 'draft') {
      return { data: null, error: 'Only draft purchase orders can be deleted' }
    }

    mockPurchaseOrders.splice(orderIndex, 1)
    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete purchase order',
    }
  }
}

/**
 * Send purchase order to supplier
 */
export async function sendPurchaseOrder(poId: string): Promise<ApiResponse<PurchaseOrder>> {
  try {
    if (isSupabaseConfigured()) {
      // Update status to sent
      const { data: updated, error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .select()
        .maybeSingle()

      if (error) throw error
      return { data: updated as PurchaseOrder, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const order = mockPurchaseOrders.find(o => o.id === poId)
    if (!order) {
      return { data: null, error: 'Purchase order not found' }
    }

    const updated = {
      ...order,
      status: 'sent' as const,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error sending purchase order:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send purchase order',
    }
  }
}

// =====================================================
// GOODS RECEIPT MANAGEMENT
// =====================================================

/**
 * Create goods receipt for a purchase order
 */
export async function createGoodsReceipt(
  hospitalId: string,
  userId: string,
  data: GoodsReceiptFormData
): Promise<ApiResponse<GoodsReceipt>> {
  try {
    if (isSupabaseConfigured()) {
      const today = new Date()
      const receiptDate = today.toISOString().split('T')[0]
      const grNumber = `GR-${today.getFullYear()}-${String(Date.now()).slice(-4)}`

      const { data: inserted, error } = await supabase
        .from('pharmacy_goods_receipts')
        .insert({
          hospital_id: hospitalId,
          gr_number: grNumber,
          po_id: data.po_id,
          receipt_date: receiptDate,
          delivery_note_number: data.delivery_note_number,
          invoice_number: data.invoice_number,
          invoice_amount: data.invoice_amount,
          status: 'pending',
          received_by: userId,
          notes: data.notes,
        })
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data.items && data.items.length > 0) {
        const items = data.items.map((item) => ({
          gr_id: inserted.id,
          po_item_id: item.po_item_id,
          quantity_received: item.quantity_received,
          quantity_accepted: item.quantity_accepted,
          quantity_rejected: item.quantity_rejected ?? 0,
          batch_number: item.batch_number,
          manufacturing_date: item.manufacturing_date,
          expiry_date: item.expiry_date,
          storage_location_id: item.storage_location_id,
          rejection_reason: item.rejection_reason,
          notes: item.notes,
        }))

        const { error: itemsError } = await supabase
          .from('pharmacy_goods_receipt_items')
          .insert(items)

        if (itemsError) throw itemsError
      }

      return { data: inserted as GoodsReceipt, error: null }
    }

    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))

    const newReceipt: GoodsReceipt = {
      id: `gr-${Date.now()}`,
      hospital_id: hospitalId,
      gr_number: `GR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      po_id: data.po_id,
      receipt_date: new Date().toISOString().split('T')[0],
      delivery_note_number: data.delivery_note_number,
      invoice_number: data.invoice_number,
      invoice_amount: data.invoice_amount,
      status: 'pending',
      received_by: userId,
      notes: data.notes,
      created_at: new Date().toISOString(),
    }

    return { data: newReceipt, error: null }
  } catch (error) {
    console.error('Error creating goods receipt:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create goods receipt',
    }
  }
}

// =====================================================
// SUPPLIER MANAGEMENT
// =====================================================

export interface SupplierFilter {
  search?: string
  status?: 'active' | 'inactive' | 'blacklisted' | 'all'
  supplier_type?: 'drug' | 'non_drug' | 'both' | 'all'
}

/**
 * Get suppliers with optional filtering (used by catalogs and supplier page)
 */
export async function getSuppliers(
  hospitalId?: string,
  page: number = 1,
  pageSize: number = 10,
  filter?: SupplierFilter
): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' })

      // Always show global suppliers (hospital_id IS NULL)
      // If hospitalId is provided, also show hospital-specific suppliers
      // Note: For now, showing all suppliers regardless of hospital_id to ensure global suppliers are visible
      // TODO: Refine this to properly filter by hospital_id when needed
      // if (hospitalId) {
      //   query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
      // } else {
      //   query = query.is('hospital_id', null)
      // }

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      if (filter?.supplier_type && filter.supplier_type !== 'all') {
        query = query.eq('supplier_type', filter.supplier_type)
      }

      if (filter?.search) {
        const search = filter.search.trim()
        if (search) {
          query = query.or(
            [
              `company_name.ilike.%${search}%`,
              `supplier_code.ilike.%${search}%`,
              `contact_person.ilike.%${search}%`,
            ].join(',')
          )
        }
      }

      const { data, error, count } = await query
        .order('company_name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      return {
        data: {
          data: (data || []) as Supplier[],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        error: null,
      }
    }

    // Fallback to mock data
    let suppliers = [...mockSuppliers]

    if (filter?.status && filter.status !== 'all') {
      suppliers = suppliers.filter(s => s.status === filter.status)
    }

    if (filter?.supplier_type && filter.supplier_type !== 'all') {
      suppliers = suppliers.filter(s => s.supplier_type === filter.supplier_type)
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase()
      suppliers = suppliers.filter(s =>
        s.company_name.toLowerCase().includes(search) ||
        s.supplier_code.toLowerCase().includes(search) ||
        (s.contact_person || '').toLowerCase().includes(search)
      )
    }

    const total = suppliers.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = suppliers.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
    }
  }
}

/**
 * Get single supplier by ID
 */
export async function getSupplierById(supplierId: string): Promise<ApiResponse<SupplierWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single()

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return { data: null, error: 'Supplier not found' }
        }
        throw error
      }

      return { data: data as SupplierWithRelations, error: null }
    }

    const supplier = mockSuppliers.find(s => s.id === supplierId)
    
    if (!supplier) {
      return { data: null, error: 'Supplier not found' }
    }

    return { data: supplier as SupplierWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch supplier',
    }
  }
}

/**
 * Get active suppliers for dropdown
 */
export async function getActiveSuppliers(hospitalId?: string): Promise<ApiResponse<Supplier[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')

      if (hospitalId) {
        // Include both hospital-specific suppliers AND global suppliers (hospital_id IS NULL)
        query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
      } else {
        // If no hospitalId provided, show only global suppliers
        query = query.is('hospital_id', null)
      }

      const { data, error } = await query.order('company_name', { ascending: true })

      if (error) throw error

      return { data: (data || []) as Supplier[], error: null }
    }

    const suppliers = mockSuppliers.filter(s => s.status === 'active')
    return { data: suppliers, error: null }
  } catch (error) {
    console.error('Error fetching active suppliers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch active suppliers',
    }
  }
}

/**
 * Get supplier statistics (order count, total value, by year)
 */
export interface SupplierStatistics {
  totalOrders: number
  totalValue: number
  averageOrderValue: number
  ordersByYear: Array<{
    year: number
    orderCount: number
    totalValue: number
  }>
  lastOrderDate?: string
}

export async function getSupplierStatistics(
  supplierId: string,
  hospitalId?: string
): Promise<ApiResponse<SupplierStatistics>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          totalOrders: 0,
          totalValue: 0,
          averageOrderValue: 0,
          ordersByYear: [],
        },
        error: null,
      }
    }

    let query = supabase
      .from('pharmacy_purchase_orders')
      .select('id, order_date, total_amount, status')
      .eq('supplier_id', supplierId)

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching supplier statistics:', error)
      throw error
    }

    if (!orders || orders.length === 0) {
      return {
        data: {
          totalOrders: 0,
          totalValue: 0,
          averageOrderValue: 0,
          ordersByYear: [],
        },
        error: null,
      }
    }

    // Calculate statistics
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

    // Group by year
    const ordersByYearMap = new Map<number, { orderCount: number; totalValue: number }>()
    let lastOrderDate: string | undefined

    orders.forEach(order => {
      if (order.order_date) {
        const year = new Date(order.order_date).getFullYear()
        const existing = ordersByYearMap.get(year) || { orderCount: 0, totalValue: 0 }
        ordersByYearMap.set(year, {
          orderCount: existing.orderCount + 1,
          totalValue: existing.totalValue + (Number(order.total_amount) || 0),
        })

        // Track latest order date
        if (!lastOrderDate || order.order_date > lastOrderDate) {
          lastOrderDate = order.order_date
        }
      }
    })

    const ordersByYear = Array.from(ordersByYearMap.entries())
      .map(([year, data]) => ({
        year,
        orderCount: data.orderCount,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => b.year - a.year) // Sort by year descending

    return {
      data: {
        totalOrders,
        totalValue,
        averageOrderValue,
        ordersByYear,
        lastOrderDate,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching supplier statistics:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch supplier statistics',
    }
  }
}

/**
 * Create a new supplier
 */
export async function createSupplier(
  hospitalId: string | null,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  try {
    const insertData: Partial<Supplier> = {
      supplier_code: data.supplier_code || `SUP-${Date.now().toString(36).toUpperCase()}`,
      company_name: data.company_name || '',
      contact_person: data.contact_person || null || undefined,
      contact_person_phone: data.contact_person_phone || null || undefined,
      email: data.email || null || undefined,
      phone: data.phone || null || undefined,
      address: data.address || null || undefined,
      registration_number: data.registration_number || null || undefined,
      bank_account: data.bank_account || null || undefined,
      bank_name: data.bank_name || null || undefined,
      supplier_type: data.supplier_type || 'both',
      status: data.status || 'active',
      performance_rating: data.performance_rating || null || undefined,
      notes: data.notes || null || undefined,
      account_number: data.account_number || null || undefined,
      account_document_url: data.account_document_url || null || undefined,
      mof_certificate_url: data.mof_certificate_url || null || undefined,
      bumiputera_registration_certificate_url: data.bumiputera_registration_certificate_url || null || undefined,
      hospital_id: hospitalId || undefined,
    } as any

    if (isSupabaseConfigured()) {
      const { data: created, error } = await supabase
        .from('suppliers')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('Error creating supplier in Supabase:', error)
        return {
          data: null,
          error: error.message || 'Failed to create supplier',
        }
      }

      return { data: created as Supplier, error: null }
    }

    // Fallback to mock data
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Supplier

    mockSuppliers.push(newSupplier)
    console.warn('[createSupplier] Created supplier in MOCK data only:', newSupplier.company_name)

    return { data: newSupplier, error: null }
  } catch (error) {
    console.error('Error creating supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create supplier',
    }
  }
}

/**
 * Update supplier
 */
export async function updateSupplier(
  supplierId: string,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  try {
    const updateData: Partial<Supplier> = {
      ...data,
    }

    if (isSupabaseConfigured()) {
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating supplier in Supabase:', error)
        return {
          data: null,
          error: error.message || 'Failed to update supplier',
        }
      }

      return { data: updated as Supplier, error: null }
    }

    const existing = mockSuppliers.find(s => s.id === supplierId)
    if (!existing) {
      return { data: null, error: 'Supplier not found' }
    }

    const merged: Supplier = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    }

    const idx = mockSuppliers.findIndex(s => s.id === supplierId)
    if (idx !== -1) {
      mockSuppliers[idx] = merged
    }

    return { data: merged, error: null }
  } catch (error) {
    console.error('Error updating supplier:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update supplier',
    }
  }
}

// =====================================================
// ORDER TRACKING
// =====================================================

/**
 * Get order tracking history
 */
export async function getOrderTracking(poId: string): Promise<ApiResponse<OrderTracking[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_order_tracking')
        .select('*')
        .eq('po_id', poId)
        .order('status_date', { ascending: true })

      if (error) throw error

      return { data: (data || []) as OrderTracking[], error: null }
    }

    // Minimal synthetic history when Supabase is not configured
    const tracking: OrderTracking[] = [
      {
        id: `track-${poId}-1`,
        po_id: poId,
        status: 'Order Created',
        status_date: new Date().toISOString(),
        notes: 'Purchase order created',
        updated_by: 'system',
        created_at: new Date().toISOString(),
      },
    ]

    return { data: tracking, error: null }
  } catch (error) {
    console.error('Error fetching order tracking:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch order tracking',
    }
  }
}

/**
 * Add tracking update
 */
export async function addTrackingUpdate(
  poId: string,
  status: string,
  notes: string,
  userId: string
): Promise<ApiResponse<OrderTracking>> {
  try {
    if (isSupabaseConfigured()) {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('pharmacy_order_tracking')
        .insert({
          po_id: poId,
          status,
          status_date: now,
          notes,
          updated_by: userId,
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: data as OrderTracking, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const newTracking: OrderTracking = {
      id: `track-${Date.now()}`,
      po_id: poId,
      status,
      status_date: new Date().toISOString(),
      notes,
      updated_by: userId,
      created_at: new Date().toISOString(),
    }

    return { data: newTracking, error: null }
  } catch (error) {
    console.error('Error adding tracking update:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add tracking update',
    }
  }
}

/**
 * Get accurate counts for the receiving dashboard
 */
export async function getReceivingCounts(hospitalId: string): Promise<ApiResponse<{
  fullyReceived: number;
  partialReceived: number;
  totalReceipts: number;
}>> {
  try {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // 1. Fully Received (Completed)
    const { count: fully } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')

    // 2. Partial Received
    const { count: partial } = await supabase
      .from('pharmacy_purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'partial_received')

    const fullyCount = fully || 0
    const partialCount = partial || 0

    return {
      data: {
        fullyReceived: fullyCount,
        partialReceived: partialCount,
        totalReceipts: fullyCount + partialCount
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching receiving counts:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch counts' }
  }
}
