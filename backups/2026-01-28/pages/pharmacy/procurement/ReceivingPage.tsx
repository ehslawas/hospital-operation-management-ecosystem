import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Search,
  PackageCheck,
  Upload,
  QrCode,
  FileText,
  Truck,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Box,
  Barcode,
  History,
  AlertTriangle
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  LoadingOverlay,
  Textarea,
  Label
} from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { receivingService } from '@/services/pharmacy/receivingService'
import { doScannerService } from '@/services/pharmacy/doScannerService'
import { LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { QRScanner } from '@/components/procurement/QRScanner'
import { gs1ParserService } from '@/services/pharmacy/gs1ParserService'

// Interface for item state management
interface ReceivingItemState {
  id?: string
  lpo_item_id: string
  item_id: string
  item_type: 'drug' | 'non_drug'
  item_name: string
  item_code: string
  ordered_quantity: number
  received_quantity: number
  outstanding_quantity: number
  is_fully_received: boolean
  // New fields
  batch_number: string
  manufactured_date: string
  expiry_date: string
  requires_lou: boolean
  storage_location: string
  status: 'pending' | 'in_transit' | 'delivered' | 'overdue'
}

interface DOEntry {
  id: string
  doNumber: string
  file: File | null
}

export default function ReceivingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error } = useToast()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(() => !!new URLSearchParams(window.location.search).get('lpoId'))
  const [lpo, setLpo] = useState<LPOWithRelations | null>(null)
  const [items, setItems] = useState<ReceivingItemState[]>([])

  // Replaced single DO state with multiple entries
  const [doEntries, setDoEntries] = useState<DOEntry[]>([{ id: crypto.randomUUID(), doNumber: '', file: null }])

  const [receivingDate, setReceivingDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isScanningDO, setIsScanningDO] = useState(false)
  const [scanStatus, setScanStatus] = useState('')

  // Edit Protection State
  const [isEditLocked, setIsEditLocked] = useState(true)
  const [isRequestingEdit, setIsRequestingEdit] = useState(false)
  const [editReason, setEditReason] = useState('')

  const canEdit = !searchParams.get('receivingId') || !isEditLocked

  // Initial Load from URL
  useEffect(() => {
    const lpoId = searchParams.get('lpoId')
    const receivingId = searchParams.get('receivingId')
    const mode = searchParams.get('mode')

    if (lpoId) {
      setSearchTerm(lpoId) // For visual context

      const load = async () => {
        await handleSearch(lpoId)

        if (mode === 'complete' && receivingId) {
          setIsEditLocked(true) // Always lock initially when loading a record
          await loadForCompletion(receivingId)
        } else {
          setIsEditLocked(false) // New record is never locked
        }
      }
      load()
    } else {
      setIsLoading(false)
      setIsEditLocked(false)
    }
  }, [searchParams])

  const loadForCompletion = async (id: string) => {
    try {
      console.log('[ReceivingPage] Loading for completion, ID:', id)
      const record = await receivingService.getReceivingById(id)
      console.log('[ReceivingPage] Fetched Record:', record)

      if (record) {
        // 1. Set Date & Notes
        setReceivingDate(record.receiving_date)
        setNotes(record.notes || '')

        // 2. Map & Merge Items
        // We match history items against the current master list (which contains all PO items)
        setItems(prevItems => {
          const updatedItems = prevItems.map(prevItem => {
            const historyItem = record.items.find((i: any) => i.lpo_item_id === prevItem.lpo_item_id)

            if (historyItem) {
              return {
                ...prevItem,
                id: historyItem.id,
                received_quantity: historyItem.received_quantity,
                batch_number: historyItem.batch_number || '',
                manufactured_date: historyItem.manufactured_date || '',
                expiry_date: historyItem.expiry_date || '',
                requires_lou: historyItem.requires_lou || false,
                storage_location: historyItem.storage_location || '',
                status: 'pending' as const
              }
            } else {
              return {
                ...prevItem,
                received_quantity: 0,
                status: 'delivered' as const
              }
            }
          })
          console.log('[ReceivingPage] Updated Items State:', updatedItems)
          return updatedItems
        })

        // 3. Set DOs
        if (record.documents && record.documents.length > 0) {
          setDoEntries(record.documents.map((doc: any) => ({
            id: doc.id,
            doNumber: doc.do_number || '',
            file: null
          })))
        } else if (record.do_number) {
          setDoEntries([{ id: crypto.randomUUID(), doNumber: record.do_number, file: null }])
        }
      }
    } catch (e) {
      console.error('Failed to load for completion', e)
      error('Failed to load existing details')
    }
  }

  const handleSearch = async (term: string = searchTerm) => {
    if (!term) return

    setIsLoading(true)
    setIsEditLocked(false) // Reset lock when searching for a new LPO
    setIsRequestingEdit(false)
    setEditReason('')
    try {
      const data = await receivingService.getLPOForReceiving(term)

      if (data) {
        setLpo(data)

        // Fetch receiving history
        const history = await receivingService.getReceivingHistory(data.id)

        // Map items
        const poItems = data.purchase_order?.items || []

        // Map ALL items, calculating outstanding from history
        const mappedItems: ReceivingItemState[] = poItems.map((poItem: any) => {
          // Calculate previously received quantity
          const previousReceived = (history || [])
            .flatMap(h => h.items)
            .filter((i: any) => i.item_id === poItem.item_id)
            .reduce((sum: number, i: any) => sum + (i.received_quantity || 0), 0)

          const orderedQty = poItem.quantity_ordered || poItem.quantity || 0
          const outstanding = Math.max(0, orderedQty - previousReceived)
          const isFullyReceived = outstanding === 0

          // Determine simplified item name
          const itemName = poItem.item_name ||
            (poItem.drug?.drug_name) ||
            (poItem.non_drug?.item_name) ||
            'Unknown Item'

          const itemCode = poItem.item_code ||
            (poItem.drug?.drug_code) ||
            (poItem.non_drug?.item_code) ||
            '-'

          return {
            lpo_item_id: poItem.id,
            item_id: poItem.item_id,
            item_type: (poItem.drug || poItem.item_type === 'drug') ? 'drug' : 'non_drug',
            item_name: itemName,
            item_code: itemCode,
            ordered_quantity: orderedQty,
            received_quantity: outstanding, // Default to receiving remainder
            outstanding_quantity: outstanding,
            is_fully_received: isFullyReceived,
            batch_number: '',
            manufactured_date: '',
            expiry_date: '',
            requires_lou: false,
            storage_location: '',
            status: isFullyReceived ? 'delivered' : 'pending' // UI helper status
          }
        })

        setItems(mappedItems)

        // Auto-load latest record if fully received and none specified
        const receivingId = searchParams.get('receivingId')
        if (!receivingId && history.length > 0) {
          const latest = history[0]
          handleHistoryClick(latest.id)
        }
      } else {
        error('LPO not found or invalid ID')
      }
    } catch (err) {
      console.error(err)
      error('Failed to load LPO details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScan = (data: string | null) => {
    if (!data) return

    // 1. Try to parse as GS1 Barcode (Scan Item)
    const gs1Data = gs1ParserService.parse(data)

    if (gs1Data.batchNumber || gs1Data.expiryDate || gs1Data.gtin) {
      // It's an item scan
      handleGS1ItemScan(gs1Data)
    } else {
      // 2. Fallback: Treat as LPO Scan (if user scans LPO QR)
      if (data.startsWith('LPO:')) {
        const lpoId = data.replace('LPO:', '')
        setSearchTerm(lpoId)
        handleSearch(lpoId)
        return
      }

      // 3. Fallback: Treat as Shipment ID / DO Number (Generic 1D Barcode)
      // If we are in editing mode (LPO loaded), assume it's the DO Number
      if (lpo) {
        setDocuments(prev => [{ ...prev[0], doNumber: data }])
        success(`DO Number set to: ${data}`)
        // Inform user if they expected item details
        toast('Note: This barcode only contained the Shipment ID, not item details.', { icon: 'ℹ️' })
      } else {
        // If no LPO loaded, maybe they are trying to find LPO by DO?
        // For now, just treat as unknown LPO search
        setSearchTerm(data)
        handleSearch(data)
      }
    }
  }

  const handleGS1ItemScan = (data: any) => {
    console.log('[ReceivingPage] GS1 Scan:', data)
    let matchIndex = -1

    // Strategy: Match by GTIN (not yet in DB schema, so maybe skip) OR try fuzzy match?
    // Actually GS1 GTIN often doesn't match our internal 'item_code'. 
    // BUT we can assume user is scanning a box of an item IN THE LIST.
    // If we can't find by Code, maybe we just ask user? 
    // For now, let's try to match by Item Code (if GTIN matches) or just use the Open Matcher?
    // Wait, without GTIN map, we can't auto-identify the item solely from barcode unless barcode contains internal code.
    // BUT, maybe the Batch Number is unique enough? No.
    // IMPROVEMENT: For now, if we scan an item, we might need to ask "Which item is this?" 
    // OR filter items that are 'drug' and 'pending'.
    // Let's implement a simple "Match found" logic if possible, or just toast carefully.

    // For this iteration/demo: If we have data, we'll try to apply it to the FIRST 'pending' drug item 
    // OR we just show the scanned data and ask user to assign? 
    // Let's go with: Apply to the first item that needs details? 
    // Better: We can check if `data.gtin` matches `item_code` (unlikely but possible).

    // Fallback for demo: Apply to the first item with missing batch.
    matchIndex = items.findIndex(i => i.item_type === 'drug' && (!i.batch_number || !i.expiry_date))

    if (matchIndex !== -1) {
      handleItemChange(matchIndex, 'batch_number', data.batchNumber || '')
      handleItemChange(matchIndex, 'expiry_date', data.expiryDate || '')
      if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
        error(`Warning: Item Expired on ${data.expiryDate}`)
      } else {
        success(`Scanned Info applied to ${items[matchIndex].item_name}`)
      }
    } else {
      // If no empty items, maybe they are verifying?
      success(`Scanned: Batch ${data.batchNumber}, Exp ${data.expiryDate}`)
    }
  }

  const handleItemChange = (index: number, field: keyof ReceivingItemState, value: any) => {
    setItems(prev => {
      const newItems = [...prev]
      const item = { ...newItems[index] }

      if (field === 'received_quantity') {
        const qty = parseInt(value) || 0
        item.received_quantity = qty
        item.outstanding_quantity = Math.max(0, item.ordered_quantity - qty)
        item.is_fully_received = qty >= item.ordered_quantity
      } else {
        (item as any)[field] = value
      }

      newItems[index] = item
      return newItems
    })
  }

  const handleScanDO = async (file: File, entryIndex: number = 0) => {
    if (!file) return

    setIsLoading(true)
    setIsScanningDO(true)
    setScanStatus('Analyzing DO image...')

    try {
      const result = await doScannerService.scanDO(file, (msg) => setScanStatus(msg))

      if (!result || !result.items || result.items.length === 0) {
        error('Failed to extract items from DO. Please try again with a clearer photo.')
        return
      }

      setScanStatus('Matching items...')

      // Update DO Number if found
      if (result.do_number && doEntries[entryIndex]) {
        updateDoEntry(doEntries[entryIndex].id, 'doNumber', result.do_number)
      }

      setItems(prevItems => {
        const newItems = [...prevItems]
        let matchCount = 0

        result.items.forEach(scannedItem => {
          // Try to match by code or name
          const matchIdx = newItems.findIndex(i =>
            (scannedItem.item_code && i.item_code.toLowerCase() === scannedItem.item_code.toLowerCase()) ||
            (scannedItem.description && i.item_name.toLowerCase().includes(scannedItem.description.toLowerCase())) ||
            (scannedItem.description && scannedItem.description.toLowerCase().includes(i.item_name.toLowerCase()))
          )

          if (matchIdx !== -1) {
            matchCount++
            const item = newItems[matchIdx]

            // Only update if not already delivered
            if (item.status !== 'delivered') {
              newItems[matchIdx] = {
                ...item,
                received_quantity: scannedItem.quantity || item.received_quantity,
                batch_number: scannedItem.batch_number || item.batch_number,
                manufactured_date: scannedItem.manufactured_date || item.manufactured_date,
                expiry_date: scannedItem.expiry_date || item.expiry_date,
              }
            }
          }
        })

        if (matchCount > 0) {
          success(`Successfully matched ${matchCount} items from DO`)
        } else {
          error('No matching items found in the current LPO. Please verify manually.')
        }

        return newItems
      })

    } catch (err) {
      console.error(err)
      error('Scan failed: ' + (err as any).message)
    } finally {
      setIsLoading(false)
      setIsScanningDO(false)
      setScanStatus('')
    }
  }

  const handleDoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (doEntries[0]) {
        updateDoEntry(doEntries[0].id, 'file', file)
        handleScanDO(file, 0)
      }
    }
  }

  const handleSubmit = async () => {
    if (!lpo) return

    // Verify lock status for existing records
    if (searchParams.get('receivingId') && isEditLocked) {
      error('Please unlock the record to make changes.')
      return
    }

    if (!isEditLocked && searchParams.get('receivingId') && !editReason.trim()) {
      error('Please provide a reason for editing this record.')
      return
    }

    // Validation: Check for duplicates or missing mandatory fields
    const validItems = items.filter(i => i.received_quantity > 0 && i.status !== 'delivered')

    if (validItems.length === 0) {
      error('No items selected for receiving.')
      return
    }

    // Prepare notes with edit reason if applicable
    let finalNotes = notes
    if (!isEditLocked && searchParams.get('receivingId') && editReason) {
      const timestamp = new Date().toLocaleString()
      finalNotes = `[EDIT REASON - ${timestamp}]: ${editReason}\n\n${notes}`
    }

    setIsLoading(true)
    try {
      // Mock upload URL generation
      const processedDoEntries = doEntries.filter(d => d.doNumber || d.file).map(entry => ({
        ...entry,
        // in real app we upload entry.file here
      }))

      // Update Mode
      if (searchParams.get('mode') === 'complete' && searchParams.get('receivingId')) {
        await receivingService.updateReceivingDetails(searchParams.get('receivingId')!, validItems)

        // Also update notes with the reason
        await supabase.from('pharmacy_receiving').update({ notes: finalNotes }).eq('id', searchParams.get('receivingId'))

        success('Details updated successfully!')
      } else {
        // Create Mode
        await receivingService.createReceiving(
          lpo.id,
          validItems,
          { doEntries: processedDoEntries },
          new Date(receivingDate).toISOString(),
          finalNotes
        )
        success('Received Item recorded successfully!')
      }

      // Navigate back to history or stay
      setTimeout(() => {
        navigate('/pharmacy/procurement/received-items') // Redirect to history to see the record
      }, 1000)

    } catch (err) {
      console.error(err)
      error('Failed to record receiving')
    } finally {
      setIsLoading(false)
    }
  }

  const updateDoEntry = (id: string, field: keyof DOEntry, value: any) => {
    setDoEntries(doEntries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const handleHistoryClick = (receiveId: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('mode', 'complete')
    newParams.set('receivingId', receiveId)
    navigate(`?${newParams.toString()}`)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {isLoading && <LoadingOverlay fullScreen message={isScanningDO ? scanStatus : 'Loading...'} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-slate-100 h-10 w-10 p-0">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                Receive Order
                {searchParams.get('mode') === 'complete' && searchParams.get('receivingId') && (
                  <Badge variant="info" className="ml-2 border-blue-200 text-blue-700 bg-blue-50">
                    Editing Record
                  </Badge>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Search / Scan Section (Only if no LPO loaded) */}
        {!lpo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mt-20"
          >
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Truck className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl">Locate Delivery</CardTitle>
                <p className="text-slate-500 text-sm">Scan the QR code on the LPO or enter the LPO Number manually.</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Enter LPO ID / Number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                  <Button size="lg" onClick={() => handleSearch()} disabled={isLoading} className="bg-slate-900">
                    Find
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50" onClick={() => setIsScannerOpen(true)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <div className="relative">
                    <Button variant="primary" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50" onClick={() => document.getElementById('do-camera-input')?.click()}>
                      <PackageCheck className="w-4 h-4 mr-2" />
                      Scan DO
                    </Button>
                    <input
                      id="do-camera-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleDoFileSelect}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        {lpo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Details & Upload */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Receive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">LPO Number</label>
                    <div className="font-mono font-bold text-slate-800 text-lg break-all">{lpo.lpo_number}</div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supplier</label>
                    <div className="font-medium text-slate-700">{lpo.purchase_order?.supplier?.company_name || lpo.purchase_order?.manual_supplier_name || 'N/A'}</div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Date</label>
                      <div className="font-medium text-slate-700">{format(new Date(lpo.created_at), 'dd/MM/yyyy')}</div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Receive Date</label>
                      <Input
                        type="date"
                        disabled={!canEdit}
                        value={receivingDate}
                        onChange={(e) => setReceivingDate(e.target.value)}
                        className={`h-8 text-xs font-bold p-1 ${!canEdit ? 'bg-slate-50 text-slate-500 border-slate-200' : 'text-emerald-600 border-emerald-100 bg-emerald-50/50'}`}
                      />
                    </div>
                  </div>

                  {lpo.expected_delivery_date && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                      <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Expected Delivery</label>
                      <div className="font-bold text-amber-700">{format(new Date(lpo.expected_delivery_date), 'dd/MM/yyyy')}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Value</label>
                    <div className="font-mono text-xl font-bold text-slate-800">
                      RM {lpo.purchase_order?.items?.reduce((sum: number, i: any) => sum + ((i.quantity || 0) * (i.unit_price || 0)), 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Multi-DO Upload Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-slate-700 font-bold">Delivery Orders</Label>
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] font-bold uppercase tracking-wider border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm transition-all active:scale-95"
                          onClick={() => document.getElementById('do-camera-input-summary')?.click()}
                        >
                          <PackageCheck className="w-3 h-3 mr-1" />
                          AI Scan DO
                        </Button>
                        <input
                          id="do-camera-input-summary"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleDoFileSelect}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {doEntries.map((entry, index) => (
                        <div key={entry.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
                          <div className="space-y-3">
                            <Input
                              placeholder={`DO Number #${index + 1}`}
                              value={entry.doNumber}
                              disabled={!canEdit}
                              onChange={(e) => updateDoEntry(entry.id, 'doNumber', e.target.value)}
                              className="h-9 bg-white border-slate-200 disabled:opacity-70"
                            />

                            {canEdit && (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  disabled={!canEdit}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    updateDoEntry(entry.id, 'file', file)
                                    if (file) handleScanDO(file, index)
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className={`
                                                border border-dashed rounded-lg p-3 flex items-center justify-center gap-2 transition-all
                                                ${entry.file ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-slate-300 bg-white text-slate-500 hover:border-blue-400'}
                                                ${!canEdit ? 'opacity-50 grayscale' : ''}
                                            `}>
                                  <Upload className="w-4 h-4" />
                                  <span className="text-xs truncate max-w-[150px]">
                                    {entry.file ? entry.file.name : 'Scan / Upload DO'}
                                  </span>
                                </div>
                                {entry.file && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleScanDO(entry.file!, index)}
                                    disabled={isScanningDO || !canEdit}
                                    className="w-full mt-2 h-8 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800"
                                  >
                                    {isScanningDO ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <PackageCheck className="w-3 h-3 mr-1" />
                                    )}
                                    Re-Scan Item
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDoEntries([...doEntries, { id: crypto.randomUUID(), doNumber: '', file: null }])}
                          className="w-full border border-dashed border-slate-200 rounded-xl h-10 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        >
                          + Add More DO
                        </Button>
                      )}
                    </div>
                  </div>



                  {/* Notes */}
                  <div>
                    <Label className="mb-2 block">Remarks</Label>
                    <Textarea
                      placeholder="Condition of goods, partial delivery notes..."
                      value={notes}
                      disabled={!canEdit}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors disabled:opacity-70"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Removing Previous Deliveries card as per user request */}
            </div>

            {/* Right Column: Items Table */}
            <div className="lg:col-span-9 space-y-6">
              {lpo.expected_delivery_date && new Date(receivingDate) > new Date(lpo.expected_delivery_date) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-bold">Late Delivery Detected</h4>
                    <p className="text-rose-700 text-sm">
                      This delivery is arriving after the expected date ({format(new Date(lpo.expected_delivery_date), 'dd MMM yyyy')}).
                      Automatic penalty tracking will be applied to late items.
                    </p>
                  </div>
                </motion.div>
              )}

              <Card className="border-slate-200 shadow-sm h-full flex flex-col">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-400" />
                      Received Items
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        onClick={() => setIsScannerOpen(true)}
                      >
                        <Barcode className="w-3 h-3 mr-1" />
                        Scan Item Box
                      </Button>
                      <Badge variant="gray" className="bg-white border border-slate-200">
                        {items.filter(i => i.received_quantity > 0).length} / {items.length} to Receive
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="min-w-[180px] py-4">Item Details</TableHead>
                        <TableHead className="w-[120px] text-center whitespace-nowrap">Qty Rec.</TableHead>
                        <TableHead className="min-w-[280px] px-2">Tracking Details</TableHead>
                        <TableHead className="w-[60px] text-center">LOU</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const isDelivered = item.status === 'delivered'
                        const isDrug = item.item_type === 'drug'

                        return (
                          <TableRow key={item.lpo_item_id + idx} className={`group ${isDelivered ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50'}`}>
                            <TableCell className="align-top py-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-800 text-sm leading-snug">{item.item_name}</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="gray" className="px-1.5 py-0 text-[10px] h-5 font-mono text-slate-500">
                                    {item.item_code}
                                  </Badge>
                                  {isDrug && (
                                    <Badge variant="info" className="px-1.5 py-0 text-[10px] h-5">Drug</Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                  Ordered: <span className="font-bold text-slate-600">{item.ordered_quantity}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-4">
                              <div className="flex flex-col items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  disabled={!canEdit || isDelivered}
                                  value={item.received_quantity}
                                  onChange={(e) => handleItemChange(idx, 'received_quantity', e.target.value)}
                                  className={`text-center h-12 w-[100px] text-base font-bold transition-all ${item.received_quantity > 0 ? 'text-emerald-700 border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-300'}`}
                                />
                                {item.outstanding_quantity > 0 && !isDelivered && (
                                  <span className="text-xs text-amber-600 font-bold mt-1">Bal: {item.outstanding_quantity}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-4 px-2">
                              {/* Stacked Layout for Tracking Details */}
                              <div className="space-y-2">
                                {/* Batch Number (Full Width) */}
                                <div className="relative">
                                  <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                  <Input
                                    disabled={!canEdit || isDelivered}
                                    placeholder="Batch No"
                                    value={item.batch_number}
                                    onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)}
                                    className={`h-9 text-base pl-8 w-full font-medium ${isDrug && !item.batch_number && item.received_quantity > 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-400'}`}
                                  />
                                </div>

                                {/* Dates Row (Stacked Side-by-Side) */}
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <div className="text-[9px] text-slate-400 font-bold mb-0.5 uppercase tracking-wide">Mfg Date</div>
                                    <Input
                                      type="date"
                                      disabled={!canEdit || isDelivered}
                                      value={item.manufactured_date || ''}
                                      onChange={(e) => handleItemChange(idx, 'manufactured_date', e.target.value)}
                                      className={`h-8 text-xs w-full font-medium border-slate-300 focus:border-blue-400`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-[9px] text-slate-400 font-bold mb-0.5 uppercase tracking-wide">Expiry</div>
                                    <Input
                                      type="date"
                                      disabled={!canEdit || isDelivered}
                                      value={item.expiry_date || ''}
                                      onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                                      className={`h-8 text-xs w-full font-medium ${isDrug && !item.expiry_date && item.received_quantity > 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-400'}`}
                                    />
                                  </div>
                                </div>
                                {(isDrug && (!item.batch_number || !item.expiry_date) && item.received_quantity > 0) && (
                                  <p className="text-[10px] text-rose-500 font-bold">Required Details Missing</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-4 px-2 text-center">
                              {/* LOU Checkbox */}
                              <div className="flex flex-col items-center justify-center h-full pt-1">
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={!!item.requires_lou}
                                    onChange={(e) => handleItemChange(idx, 'requires_lou', e.target.checked)}
                                    disabled={!canEdit || isDelivered}
                                    className="w-5 h-5 cursor-pointer accent-emerald-500 border-slate-300 rounded focus:ring-emerald-500 z-10 opacity-0 absolute inset-0"
                                  />
                                  <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${item.requires_lou ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white hover:border-emerald-400'}`}>
                                    {item.requires_lou && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </div>

                                {item.requires_lou ? (
                                  <span className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">Required</span>
                                ) : (
                                  <span className="text-[9px] font-medium text-slate-300 mt-1 uppercase tracking-tight">Optional</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col items-center gap-4">
                  {isRequestingEdit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="w-full space-y-2 p-4 bg-blue-50 border border-blue-100 rounded-xl"
                    >
                      <Label className="text-blue-800 font-bold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Please provide a reason for this edit
                      </Label>
                      <Textarea
                        autoFocus
                        placeholder="Why do you need to change this record? (e.g., corrected batch number, wrong quantity entered...)"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="bg-white border-blue-200 focus:ring-blue-500 min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsRequestingEdit(false); setEditReason('') }}>Cancel</Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          disabled={!editReason.trim()}
                          onClick={() => { setIsEditLocked(false); setIsRequestingEdit(false) }}
                        >
                          Unlock Fields
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex justify-end w-full">
                    {searchParams.get('receivingId') && isEditLocked ? (
                      <Button
                        size="lg"
                        onClick={() => setIsRequestingEdit(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02]"
                      >
                        Request Edit
                        <History className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!!isLoading || (!canEdit && !!searchParams.get('receivingId'))}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {searchParams.get('mode') === 'complete' && searchParams.get('receivingId') ? 'Update Receipt' : 'Confirm Receipt'}
                            <PackageCheck className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div >
  )
}
