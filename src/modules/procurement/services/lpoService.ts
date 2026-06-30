// cache bust
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { PDFDocument } from 'pdf-lib'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { 
  LPOListItem, 
  LPOStats, 
  LPOUploadData, 
  PharmacyLPO,
  ProcurementFilter
} from '@/types/pharmacy'
import { uploadLpoDocument } from '@/services/pharmacy/uploadService'
import { createOrderTrackingForLPO } from './orderTrackingService'

/**
 * Get LPO statistics (counts for approved POs, pending LPOs, sent/verified LPOs)
 */
export async function getLPOStats(
  hospitalId: string
): Promise<ApiResponse<LPOStats>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Get all relevant POs (approved, completed, partial_received) and exclude non-medical categories & SQ/INV placeholders
      const { data: poData, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, status, total_amount, category, vote_code, po_number')
        .eq('hospital_id', hospitalId)
        .in('status', ['approved', 'completed', 'partial_received'])
        .in('vote_code', ['080702', '990102'])
        .not('po_number', 'ilike', 'SQ-%')
        .not('po_number', 'ilike', 'INV-%')
        .not('category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')

      if (poError) throw poError

      // 2. Get all LPOs for this hospital that are linked to these POs
      const { data: lpoData, error: lpoError } = await supabase
        .from('pharmacy_lpo')
        .select('po_id, status, po:pharmacy_purchase_orders!inner(status, category, vote_code, po_number)')
        .eq('hospital_id', hospitalId)
        .in('po.status', ['approved', 'completed', 'partial_received'])
        .in('po.vote_code', ['080702', '990102'])
        .not('po.po_number', 'ilike', 'SQ-%')
        .not('po.po_number', 'ilike', 'INV-%')
        .not('po.category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')

      if (lpoError) throw lpoError

      const relevantPOs = (poData || [])
        .filter(po => po.vote_code === '080702' || po.vote_code === '990102')
        .filter(po => !po.po_number?.toUpperCase().startsWith('SQ-') && !po.po_number?.toUpperCase().startsWith('INV-'))
      const lpos = (lpoData || [])
        .filter((lpo: any) => lpo.po?.vote_code === '080702' || lpo.po?.vote_code === '990102')
        .filter((lpo: any) => !lpo.po?.po_number?.toUpperCase().startsWith('SQ-') && !lpo.po?.po_number?.toUpperCase().startsWith('INV-'))
      
      const lpoPoIds = new Set(lpos.map(lpo => lpo.po_id))

      let totalValue = 0
      let pendingCount = 0

      relevantPOs.forEach(po => {
        totalValue += po.total_amount || 0
        if (!lpoPoIds.has(po.id)) {
          pendingCount++
        }
      })

      const stats: LPOStats = {
        totalApproved: relevantPOs.length,
        pendingCount,
        sentCount: lpos.filter(lpo => lpo.status === 'sent').length,
        verifiedCount: lpos.filter(lpo => lpo.status === 'verified').length,
        totalValue
      }

      return { data: stats, error: null }
    }

    return { 
      data: {
        totalApproved: 361,
        pendingCount: 202,
        sentCount: 95,
        verifiedCount: 67,
        totalValue: 154000
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching LPO stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch LPO stats',
    }
  }
}

/**
 * Get LPO List (handles both pending and approved tabs)
 */
export async function getLPOList(
  hospitalId: string,
  tab: 'pending' | 'approved',
  filter?: ProcurementFilter,
  page: number = 1,
  pageSize: number = 15
): Promise<ApiResponse<PaginatedResponse<LPOListItem>>> {
  try {
    if (isSupabaseConfigured()) {
      if (tab === 'pending') {
        // PENDING TAB: POs that are approved but have no LPO record
        
        // 1. First get all LPO po_ids to exclude them
        const { data: existingLpos, error: lpoError } = await supabase
          .from('pharmacy_lpo')
          .select('po_id')
          .eq('hospital_id', hospitalId)
          .not('po_id', 'is', null)

        if (lpoError) throw lpoError
        const lpoPoIds = (existingLpos || []).map(lpo => lpo.po_id)

        // 2. Query POs
        let query = supabase
          .from('pharmacy_purchase_orders')
          .select('id, po_number, po_type, order_date, total_amount, vote_code, category, department, manual_supplier_name, supplier:suppliers(company_name), items:pharmacy_purchase_order_items(item_name)')
          .eq('hospital_id', hospitalId)
          .eq('status', 'approved')
          .in('vote_code', ['080702', '990102'])
          .not('po_number', 'ilike', 'SQ-%')
          .not('po_number', 'ilike', 'INV-%')

        // Apply filters
        if (filter?.search) {
          const search = filter.search.trim()
          if (search) {
            query = query.or(`po_number.ilike.%${search}%`)
          }
        }
        if (filter?.vote_code) query = query.eq('vote_code', filter.vote_code)
        if (filter?.category) query = query.eq('category', filter.category)
        if (filter?.department) query = query.eq('department', filter.department)

        const { data: poData, error: poError } = await query.order('order_date', { ascending: false })

        if (poError) throw poError

        // 3. Filter out POs that already have LPOs and enforce allowed vote codes
        let pendingPOs = (poData || []).filter(po => !lpoPoIds.includes(po.id) && (po.vote_code === '080702' || po.vote_code === '990102'))

        // Map to standard format
        let results: LPOListItem[] = pendingPOs.map(po => {
          const supplierData = Array.isArray(po.supplier) ? po.supplier[0] : po.supplier;
          return {
            po_id: po.id,
            po_number: po.po_number,
            po_type: po.po_type as any,
            order_date: po.order_date,
            total_amount: po.total_amount || 0,
            vote_code: po.vote_code,
            category: po.category,
            department: po.department,
            supplier_name: po.manual_supplier_name || supplierData?.company_name,
            item_names: (po.items || []).map((i: any) => i.item_name)
          }
        })

        // Apply search filter for supplier name (since it's a join/computed field)
        if (filter?.search) {
          const search = filter.search.toLowerCase()
          results = results.filter(item => 
            item.po_number?.toLowerCase().includes(search) || 
            item.supplier_name?.toLowerCase().includes(search) ||
            item.item_names?.some(name => name.toLowerCase().includes(search))
          )
        }

        // Pagination
        const total = results.length
        const totalPages = Math.ceil(total / pageSize)
        const start = (page - 1) * pageSize
        const paginatedData = results.slice(start, start + pageSize)

        return {
          data: { data: paginatedData, total, page, pageSize, totalPages },
          error: null
        }

      } else {
        // APPROVED TAB: POs joined with LPO records
        
        let query = supabase
          .from('pharmacy_lpo')
          .select(`
            id, lpo_number, status, document_date, document_url, verify_tracking, payment_status, sent_for_payment_date,
            po_id,
            po:pharmacy_purchase_orders!inner(po_number, po_type, order_date, total_amount, vote_code, category, department, manual_supplier_name, supplier:suppliers(company_name), status, items:pharmacy_purchase_order_items(item_name))
          `, { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .in('po.status', ['approved', 'completed', 'partial_received'])
          .in('po.vote_code', ['080702', '990102'])
          .not('po.category', 'in', '("ALAT TULIS", "Alat Tulis", "PRINTING SERVICE", "BEKALAN MAKANAN")')

        // Apply filters - we'll do the search filtering post-fetch for robust cross-table support
        // since PostgREST doesn't easily support cross-table OR in a single query string.
        // Client-side filtering is already implemented below in the 'results.filter' block.
        
        // Note: For inner joined table filtering in Supabase, we often have to do it post-query 
        // if we want to filter on the nested PO data in a single request, or we use PostgREST embedded filters.
        // For simplicity with complex filters, we might fetch and filter, but let's try embedded if possible,
        // or just rely on post-fetch filtering if count is small. Let's do post-fetch for robust complex filters.

        const { data: lpoData, error: lpoError } = await query.order('document_date', { ascending: false })

        if (lpoError) throw lpoError

        let results: LPOListItem[] = (lpoData || [])
          .filter((lpo: any) => lpo.po?.vote_code === '080702' || lpo.po?.vote_code === '990102')
          .map((lpo: any) => {
            const po = lpo.po || {}
          const supplierData = Array.isArray(po.supplier) ? po.supplier[0] : po.supplier;
          return {
            po_id: lpo.po_id,
            po_number: po.po_number,
            po_type: po.po_type,
            order_date: po.order_date,
            total_amount: po.total_amount || 0,
            vote_code: po.vote_code,
            category: po.category,
            department: po.department,
            supplier_name: po.manual_supplier_name || supplierData?.company_name,
            
            lpo_id: lpo.id,
            lpo_number: lpo.lpo_number,
            lpo_status: lpo.status,
            document_date: lpo.document_date,
            document_url: lpo.document_url,
            verify_tracking: lpo.verify_tracking,
            payment_status: lpo.payment_status,
            sent_for_payment_date: lpo.sent_for_payment_date,
            item_names: (po.items || []).map((i: any) => i.item_name)
          }
        })

        // Apply PO-level filters
        if (filter?.vote_code) results = results.filter(r => r.vote_code === filter.vote_code)
        if (filter?.category) results = results.filter(r => r.category === filter.category)
        if (filter?.department) results = results.filter(r => r.department === filter.department)
        // payment filter is not in ProcurementFilter standard yet, but we could add it.

        if (filter?.search) {
          const search = filter.search.toLowerCase()
          results = results.filter(item => 
            item.po_number?.toLowerCase().includes(search) || 
            item.lpo_number?.toLowerCase().includes(search) ||
            item.supplier_name?.toLowerCase().includes(search) ||
            item.item_names?.some(name => name.toLowerCase().includes(search))
          )
        }

        // Pagination
        const total = results.length
        const totalPages = Math.ceil(total / pageSize)
        const start = (page - 1) * pageSize
        const paginatedData = results.slice(start, start + pageSize)

        return {
          data: { data: paginatedData, total, page, pageSize, totalPages },
          error: null
        }
      }
    }

    // Mock data fallback
    return { data: { data: [], total: 0, page, pageSize, totalPages: 0 }, error: null }
  } catch (error) {
    console.error('Error fetching LPO list:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch LPO list',
    }
  }
}

/**
 * Upload new LPO and link it to a PO
 */
export async function uploadLPO(
  hospitalId: string,
  poId: string,
  userId: string,
  data: LPOUploadData
): Promise<ApiResponse<PharmacyLPO>> {
  try {
    if (isSupabaseConfigured()) {
      let documentUrl = undefined
      const originalFilename = data.document_file?.name
      const fileHash = data.file_hash

      // If a file was provided, upload it using the uploadService
      if (!data.document_file) {
        throw new Error('LPO Document PDF is required')
      }

      if (data.document_file.type !== 'application/pdf' && !data.document_file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Only PDF files are allowed for LPO documents')
      }

      // Slice the PDF to exactly 2 pages if it contains 3 or more pages
      // (This strips Page 3: "Surat Akuan Penerimaan dan Akuan Pematuhan")
      let fileToUpload = data.document_file
      try {
        const arrayBuffer = await data.document_file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = pdfDoc.getPages()
        if (pages.length >= 3) {
          console.log(`[lpoService] Uploaded PDF has ${pages.length} pages. Slicing to first 2 pages to remove Surat Akuan Penerimaan (Page 3).`)
          const newPdfDoc = await PDFDocument.create()
          const copiedPages = await newPdfDoc.copyPages(pdfDoc, [0, 1])
          copiedPages.forEach(p => newPdfDoc.addPage(p))
          const pdfBytes = await newPdfDoc.save()
          const blob = new Blob([pdfBytes] as any, { type: 'application/pdf' })
          fileToUpload = new File([blob], data.document_file.name, { type: 'application/pdf' })
        }
      } catch (err) {
        console.error('[lpoService] Failed to slice LPO PDF, falling back to original file:', err)
      }

      // We use a temporary ID for the folder name
      const tempId = crypto.randomUUID()
      const uploadResponse = await uploadLpoDocument(fileToUpload, tempId)
      
      if (uploadResponse.error) {
        throw new Error(`Document upload failed: ${uploadResponse.error}`)
      }
      
      documentUrl = uploadResponse.data

      // Check for existing LPO for this PO to avoid duplicates and handle placeholders
      const { data: existingLPO } = await supabase
        .from('pharmacy_lpo')
        .select('id, lpo_number')
        .eq('po_id', poId)
        .maybeSingle()

      let result;
      if (existingLPO) {
        // Update existing record (useful for fixing placeholders)
        const { data: updated, error: updateError } = await supabase
          .from('pharmacy_lpo')
          .update({
            lpo_number: data.lpo_number,
            document_date: data.document_date,
            document_url: documentUrl,
            original_filename: originalFilename,
            file_hash: fileHash,
            status: 'sent',
            created_by: userId,
            expected_delivery_date: data.expected_delivery_date
          })
          .eq('id', existingLPO.id)
          .select('*')
          .maybeSingle()
        
        if (updateError) throw updateError
        result = updated
      } else {
        // Create new record
        const { data: inserted, error: insertError } = await supabase
          .from('pharmacy_lpo')
          .insert({
            hospital_id: hospitalId,
            po_id: poId,
            lpo_number: data.lpo_number,
            document_date: data.document_date,
            document_url: documentUrl,
            original_filename: originalFilename,
            file_hash: fileHash,
            status: 'sent',
            created_by: userId,
            verify_tracking: false,
            payment_status: 'pending',
            expected_delivery_date: data.expected_delivery_date
          })
          .select('*')
          .maybeSingle()
        
        if (insertError) throw insertError
        result = inserted
      }

      return { data: result as PharmacyLPO, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error: any) {
    console.error('Error uploading LPO:', error)
    let message = 'Failed to upload LPO'
    if (error?.code === '23505') {
      const detail = error.detail || ''
      const match = detail.match(/\((.*)\)/)
      const val = match ? match[1] : 'unknown'
      message = `Conflict: LPO number "${val}" already exists in the database.`
    } else if (error?.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    
    return {
      data: null,
      error: message
    }
  }
}

/**
 * Update LPO status
 */
export async function updateLPOStatus(
  lpoId: string,
  status: 'sent' | 'verified',
  verifyTracking: boolean = true
): Promise<ApiResponse<PharmacyLPO>> {
  try {
    if (isSupabaseConfigured()) {
      // If status is verified, check if document exists
      if (status === 'verified') {
        const { data: checkLpo } = await supabase
          .from('pharmacy_lpo')
          .select('document_url')
          .eq('id', lpoId)
          .single();
        
        if (!checkLpo?.document_url) {
          throw new Error('Cannot verify LPO without an uploaded document');
        }
      }

      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .update({
          status,
          verify_tracking: verifyTracking,
          updated_at: new Date().toISOString()
        })
        .eq('id', lpoId)
        .select()
        .maybeSingle()

      if (error) throw error

      // Trigger tracking creation if verified
      if (status === 'verified') {
        await createOrderTrackingForLPO(lpoId)
      }

      return { data: data as PharmacyLPO, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error updating LPO status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update LPO status',
    }
  }
}
/**
 * Bulk verify LPOs
 */
export async function bulkVerifyLPOs(
  lpoIds: string[]
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .update({
          status: 'verified',
          verify_tracking: true,
          updated_at: new Date().toISOString()
        })
        .in('id', lpoIds)
        .not('document_url', 'is', null)

      if (error) throw error

      // Trigger tracking creation for each LPO
      if (lpoIds.length > 0) {
        await Promise.all(lpoIds.map(id => createOrderTrackingForLPO(id)))
      }

      return { data, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error bulk updating LPO status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to bulk verify LPOs',
    }
  }
}

/**
 * Get list of POs that are approved but don't have an LPO linked yet
 */
export async function getPendingPOsForLPO(hospitalId: string): Promise<ApiResponse<{ id: string, po_number: string, total_amount: number, manual_supplier_name: string | null, order_date: string }[]>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Get all approved POs with items
      const { data: pos, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id, 
          po_number, 
          total_amount, 
          manual_supplier_name, 
          order_date,
          supplier:suppliers(company_name),
          items:pharmacy_purchase_order_items(id, item_name, quantity_ordered, unit_price)
        `)
        .eq('hospital_id', hospitalId)
        .eq('status', 'approved')
        .not('po_number', 'ilike', 'SQ-%')
        .not('po_number', 'ilike', 'INV-%')

      if (poError) throw poError

      // 2. Get all PO IDs that already have an LPO
      const { data: linkedLPOs, error: lpoError } = await supabase
        .from('pharmacy_lpo')
        .select('po_id')
        .eq('hospital_id', hospitalId)

      if (lpoError) throw lpoError

      const linkedPoIds = new Set(linkedLPOs?.map(l => l.po_id).filter(Boolean))
      
      // 3. Filter POs that are not linked and map supplier name
      // Exclude Quotations (SQ) and Invoices (INV) as they shouldn't be matched with LPOs
      const pendingPOs = (pos || [])
        .filter(po => !linkedPoIds.has(po.id))
        .filter(po => !po.po_number.toUpperCase().startsWith('SQ-') && !po.po_number.toUpperCase().startsWith('INV-'))
        .map(po => ({
          ...po,
          supplier_name: po.manual_supplier_name || (po as any).supplier?.company_name || 'Generic Supplier'
        }))

      return { data: pendingPOs as any, error: null }

    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching pending POs:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch pending POs' }
  }
}

/**
 * Check if an LPO number already exists in the hospital
 */
export async function checkDuplicateLPO(hospitalId: string, lpoNumber: string): Promise<ApiResponse<{ isDuplicate: boolean, existingPoNumber?: string }>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .select('lpo_number, po_id, pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(po_number)')
        .eq('hospital_id', hospitalId)
        .eq('lpo_number', lpoNumber)
        .maybeSingle()

      if (error) throw error

      if (data) {
        return { 
          data: { 
            isDuplicate: true, 
            existingPoNumber: (data.pharmacy_purchase_orders as any)?.po_number 
          }, 
          error: null 
        }
      }

      return { data: { isDuplicate: false }, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error checking duplicate LPO:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to check duplicate LPO' }
  }
}
/**
 * Check for existing LPOs to prevent duplicates
 */
export async function getExistingLPONumbers(
  hospitalId: string
): Promise<ApiResponse<{ lpoNumbers: Set<string>, filenames: Set<string>, hashes: Set<string> }>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .select(`
          lpo_number, 
          document_url,
          file_hash,
          original_filename,
          pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(po_number)
        `)
        .eq('hospital_id', hospitalId)
        .limit(5000) // Increase limit to handle more historical records
      
      if (error) throw error
      
      const lpoNumbers = new Set<string>()
      const filenames = new Set<string>()
      const hashes = new Set<string>()

      ;(data || []).forEach(r => {
        // Add Hash (Highest Priority)
        if (r.file_hash) hashes.add(r.file_hash)

        // Add LPO number
        if (r.lpo_number) {
          lpoNumbers.add(r.lpo_number.toUpperCase().replace(/[\s\-_]/g, ''))
        }
        
        // Add linked PO number (if any)
        const poNum = (r.pharmacy_purchase_orders as any)?.po_number
        if (poNum) {
          lpoNumbers.add(poNum.toUpperCase().replace(/[\s\-_]/g, ''))
        }

        // Add filename and extract timestamp aliases
        let filename = ''
        if (r.original_filename) {
          filename = r.original_filename.toLowerCase()
        } else if (r.document_url) {
          const parts = r.document_url.split('/')
          filename = decodeURIComponent(parts[parts.length - 1]).toLowerCase()
        }
        
        if (filename) {
          filenames.add(filename)
          
          // Also extract the 6+ digit timestamp/identifier from the filename and add it as an LPO number alias
          const numMatch = filename.match(/(?:^|[^a-zA-Z0-9])(\d{6,})(?:$|[^a-zA-Z0-9])/i)
          if (numMatch) {
            lpoNumbers.add(numMatch[1])
          }
        }
      })
      
      return { data: { lpoNumbers, filenames, hashes }, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching existing LPO data:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch existing LPOs' }
  }
}

/**
 * Fetch ALL PO IDs that already have an LPO linked
 */
export async function getExistingPOIdsWithLPO(hospitalId: string): Promise<ApiResponse<Set<string>>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .select('po_id')
        .eq('hospital_id', hospitalId)
        .not('po_id', 'is', null)
      
      if (error) throw error
      
      const poIdSet = new Set((data || []).map(r => r.po_id))
      
      return { data: poIdSet, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching PO IDs with LPO:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch PO IDs' }
  }
}


/**
 * Check for duplicate/existing LPOs in batch
 * Also checks if the number matches a PO that already has an LPO linked
 */
export async function checkDuplicateLPOsBatch(hospitalId: string, lpoNumbers: string[]): Promise<ApiResponse<Record<string, { isDuplicate: boolean, existingPoNumber?: string, type?: 'lpo' | 'po' }>>> {
  try {
    if (lpoNumbers.length === 0) return { data: {}, error: null }
    
    if (isSupabaseConfigured()) {
      // Fetch all LPO and PO numbers for this hospital to perform robust local matching
      // We only select the necessary columns to keep the payload small
      const { data: allRecords, error } = await supabase
        .from('pharmacy_lpo')
        .select(`
          lpo_number, 
          po_id, 
          pharmacy_purchase_orders!pharmacy_lpo_po_id_fkey(po_number)
        `)
        .eq('hospital_id', hospitalId)

      if (error) throw error

      const result: Record<string, { isDuplicate: boolean, existingPoNumber?: string, type?: 'lpo' | 'po' }> = {}
      
      // Initialize all requested numbers as non-duplicates
      lpoNumbers.forEach(num => {
        result[num] = { isDuplicate: false }
      })

      if (!allRecords) return { data: result, error: null }

      // Update with found duplicates using robust matching
      lpoNumbers.forEach(searchNum => {
        const upperSearch = searchNum.toUpperCase().replace(/\s/g, '').replace(/[-_]/g, '')
        
        for (const record of allRecords) {
          const dbLpo = record.lpo_number.toUpperCase().replace(/\s/g, '').replace(/[-_]/g, '')
          const dbPo = (record.pharmacy_purchase_orders as any)?.po_number?.toUpperCase().replace(/\s/g, '').replace(/[-_]/g, '')
          
          // Match against LPO number
          if (dbLpo === upperSearch || dbLpo.includes(upperSearch) || upperSearch.includes(dbLpo)) {
            result[searchNum] = {
              isDuplicate: true,
              existingPoNumber: (record.pharmacy_purchase_orders as any)?.po_number,
              type: 'lpo'
            }
            break
          }
          
          // Match against PO number
          if (dbPo && (dbPo === upperSearch || dbPo.includes(upperSearch) || upperSearch.includes(dbPo))) {
            result[searchNum] = {
              isDuplicate: true,
              existingPoNumber: dbPo,
              type: 'po'
            }
            break
          }
        }
      })

      return { data: result, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error checking duplicate LPOs batch:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to check duplicate LPOs' }
  }
}

/**
 * Bulk upload LPOs
 */
export async function bulkUploadLPOs(
  hospitalId: string,
  userId: string,
  rows: { po_number: string; lpo_number: string; document_date: string }[]
): Promise<ApiResponse<{ successCount: number; errors: string[] }>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Get all approved POs for this hospital to match numbers to IDs
      const { data: pos, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, po_number')
        .eq('hospital_id', hospitalId)
        .eq('status', 'approved')

      if (poError) throw poError

      const poMap = new Map(pos?.map(p => [p.po_number, p.id]) || [])
      const insertData = []
      const errors = []

      for (const row of rows) {
        if (!row.po_number || !row.lpo_number) continue;
        
        const poId = poMap.get(row.po_number)
        if (poId) {
          insertData.push({
            hospital_id: hospitalId,
            po_id: poId,
            lpo_number: row.lpo_number,
            document_date: row.document_date,
            status: 'sent',
            created_by: userId,
            verify_tracking: false,
            payment_status: 'pending'
          })
        } else {
          errors.push(`PO Number ${row.po_number} not found or not approved.`)
        }
      }

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('pharmacy_lpo')
          .insert(insertData)

        if (insertError) throw insertError
      }

      return { 
        data: { successCount: insertData.length, errors }, 
        error: null 
      }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error bulk uploading LPOs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to bulk upload LPOs',
    }
  }
}

export async function repairLPONumber(lpoId: string, newLpoNumber: string) {
  try {
    const { data, error } = await supabase
      .from('pharmacy_lpo')
      .update({ lpo_number: newLpoNumber })
      .eq('id', lpoId)
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: `CONFLICT: LPO number "${newLpoNumber}" already exists in the system. Please delete the duplicate record.` }
      }
      throw error
    }
    return { data, error: null }
  } catch (error: any) {
    console.error('Error repairing LPO number:', error)
    return { data: null, error: error.message || 'Failed to repair LPO number' }
  }
}

/**
 * Update LPO payment status
 */
export async function updateLPOPaymentStatus(
  lpoId: string,
  status: 'pending' | 'sent_for_payment' | 'paid' | 'cancelled'
): Promise<ApiResponse<PharmacyLPO>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_lpo')
        .update({
          payment_status: status,
          sent_for_payment_date: status === 'sent_for_payment' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', lpoId)
        .select()
        .maybeSingle()

      if (error) throw error
      return { data: data as PharmacyLPO, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error updating LPO payment status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update payment status',
    }
  }
}

/**
 * Create a new supplier assessment
 */
export async function createSupplierAssessment(
  assessment: {
    lpo_id: string;
    goods_receipt_id?: string;
    ratings: {
      quality: number;
      support: number;
      delivery: number;
    };
    total_score: number;
    percentage: number;
    performance_level: string;
    comments?: string;
    assessed_by?: string;
  }
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_supplier_assessments')
        .insert({
          ...assessment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error creating supplier assessment:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to save supplier assessment',
    }
  }
}

/**
 * Get all supplier assessments with supplier details and items
 */
export async function getSupplierAssessments(
  hospitalId: string
): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_supplier_assessments')
        .select(`
          id, lpo_id, ratings, total_score, percentage, performance_level, comments, created_at, goods_receipt_id,
          lpo:pharmacy_lpo!inner(
            lpo_number, hospital_id,
            po:pharmacy_purchase_orders(
              po_number, total_amount, manual_supplier_name,
              supplier:suppliers(company_name),
              items:pharmacy_purchase_order_items(item_name, quantity:quantity_ordered, unit_price)
            )
          )
        `)
        .eq('lpo.hospital_id', hospitalId)
        .order('created_at', { ascending: false })

      if (error) throw error

      let finalData = data || []
      const goodsReceiptIds = finalData
        .map((r: any) => r.goods_receipt_id)
        .filter(Boolean)

      if (goodsReceiptIds.length > 0) {
        const { data: grData, error: grError } = await supabase
          .from('pharmacy_goods_receipts')
          .select('id, gr_number, delivery_note_number')
          .in('id', goodsReceiptIds)

        if (!grError && grData) {
          const grMap = new Map(grData.map((gr: any) => [gr.id, gr]))
          finalData = finalData.map((item: any) => ({
            ...item,
            goods_receipt: item.goods_receipt_id ? grMap.get(item.goods_receipt_id) : null
          }))
        }
      }

      return { data: finalData, error: null }
    }

    // Fallback static mock data for demo / offline development
    return {
      data: [
        {
          id: 'mock-1',
          lpo_id: 'lpo-1',
          ratings: { quality: 5, support: 5, delivery: 5 },
          total_score: 15,
          percentage: 100,
          performance_level: 'SANGAT MEMUASKAN',
          created_at: new Date().toISOString(),
          lpo: {
            lpo_number: 'CO260000000278194',
            po: {
              po_number: 'PO-2026-0329',
              total_amount: 4380.60,
              manual_supplier_name: 'Generic Supplier',
              supplier: { company_name: 'Generic Supplier' },
              items: [
                { item_name: 'Paracetamol 500mg Tab', quantity: 100, unit_price: 12.50 }
              ]
            }
          }
        }
      ],
      error: null
    }
  } catch (error) {
    console.error('Error fetching supplier assessments:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch supplier assessments',
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LPO BINDING AUDIT
// ─────────────────────────────────────────────────────────────────────────────

export interface LPOAuditRecord {
  lpo_id: string
  lpo_number: string
  document_url: string | null
  po_id: string
  po_number: string
  po_amount: number
  supplier_name: string
  items: { item_name: string }[]
}

/**
 * Fetch all LPO–PO pairs (with full PO details) needed for the integrity audit.
 */
export async function getAllLPOsForAudit(
  hospitalId: string
): Promise<ApiResponse<LPOAuditRecord[]>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase
      .from('pharmacy_lpo')
      .select(`
        id,
        lpo_number,
        document_url,
        po_id,
        po:pharmacy_purchase_orders!inner(
          po_number,
          total_amount,
          manual_supplier_name,
          supplier:suppliers(company_name),
          items:pharmacy_purchase_order_items(item_name)
        )
      `)
      .eq('hospital_id', hospitalId)
      .not('po_id', 'is', null)
      .not('document_url', 'is', null)
      .order('lpo_number', { ascending: true })

    if (error) throw error

    const records: LPOAuditRecord[] = (data || []).map((row: any) => {
      const po = row.po || {}
      const supplierData = Array.isArray(po.supplier) ? po.supplier[0] : po.supplier
      return {
        lpo_id: row.id,
        lpo_number: row.lpo_number || '',
        document_url: row.document_url || null,
        po_id: row.po_id,
        po_number: po.po_number || '',
        po_amount: po.total_amount || 0,
        supplier_name: po.manual_supplier_name || supplierData?.company_name || '',
        items: (po.items || []).map((i: any) => ({ item_name: i.item_name || '' })),
      }
    })

    return { data: records, error: null }
  } catch (err) {
    console.error('Error fetching LPOs for audit:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch LPOs for audit',
    }
  }
}

/**
 * Reassign an LPO to a different PO (fix a wrong binding).
 */
export async function rebindLPO(
  lpoId: string,
  newPoId: string
): Promise<ApiResponse<PharmacyLPO>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase
      .from('pharmacy_lpo')
      .update({ po_id: newPoId, updated_at: new Date().toISOString() })
      .eq('id', lpoId)
      .select('*')
      .maybeSingle()

    if (error) throw error
    return { data: data as PharmacyLPO, error: null }
  } catch (err) {
    console.error('Error rebinding LPO:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to rebind LPO',
    }
  }
}
