// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { 
  QrCode, 
  AlertTriangle, 
  Camera, 
  Keyboard, 
  Search, 
  Volume2, 
  VolumeX, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Database,
  Calendar,
  Layers,
  MapPin,
  Clock,
  User,
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react'
import jsQR from 'jsqr'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button } from '@/components/ui'
import { 
  getStockLocations, 
  createStockReceipt, 
  issueStock, 
  getStockLevelSummary,
  getStockBatches,
  matchStockItem,
  normalizeItemCode
} from '../../services/inventoryService'
import type { StockLocation, StockLevelSummary, StockBatchWithRelations } from '@/types/pharmacy'

export const StockMovementScannerPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const loggedUserName = user?.full_name || (user as any)?.name || (user as any)?.username || 'Kakitangan Farmasi'

  // Tabs: receipt (Penerimaan) or issue (Pengeluaran)
  const [transactionType, setTransactionType] = useState<'receipt' | 'issue'>('receipt')
  const [activeScanTab, setActiveScanTab] = useState<'camera' | 'manual'>('camera')

  // Audio setup
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [successFlash, setSuccessFlash] = useState(false)

  // Camera setup
  const [cameraActive, setCameraActive] = useState(true)
  const [useRealCamera, setUseRealCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Lookup data
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogItems, setCatalogItems] = useState<StockLevelSummary[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

  // Scanned / Selected Item
  const [selectedItem, setSelectedItem] = useState<StockLevelSummary | null>(null)
  const [itemBatches, setItemBatches] = useState<StockBatchWithRelations[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)

  // Transaction form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Receipt Form States
  const [receiptBatchNum, setReceiptBatchNum] = useState('')
  const [receiptExpiryDate, setReceiptExpiryDate] = useState('')
  const [receiptMfgDate, setReceiptMfgDate] = useState('')
  const [receiptQty, setReceiptQty] = useState('')
  const [receiptUnitCost, setReceiptUnitCost] = useState('')
  const [receiptLocationId, setReceiptLocationId] = useState('')

  // Issuing Form States
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [issueQty, setIssueQty] = useState('')
  const [issueReason, setIssueReason] = useState('')
  const [issueTargetLocationId, setIssueTargetLocationId] = useState('')

  // Load locations and catalog list on mount
  useEffect(() => {
    if (!hospitalId) return

    const loadMetadata = async () => {
      setIsLoadingMetadata(true)
      try {
        const [locRes, catRes] = await Promise.all([
          getStockLocations(hospitalId),
          getStockLevelSummary(hospitalId)
        ])
        if (locRes.data) setLocations(locRes.data)
        if (catRes.data) setCatalogItems(catRes.data)
      } catch (err) {
        console.error('Error loading scanner metadata:', err)
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    void loadMetadata()
  }, [hospitalId])

  // If item selected, load its batches (especially for issuing)
  useEffect(() => {
    if (!selectedItem) {
      setItemBatches([])
      return
    }

    const loadBatches = async () => {
      setIsLoadingBatches(true)
      const res = await getStockBatches(selectedItem.item_id, selectedItem.item_type)
      if (res.data) {
        // Sort FEFO (batches with nearest expiry date first, nulls at the end)
        const sorted = [...res.data].sort((a, b) => {
          if (!a.expiry_date) return 1
          if (!b.expiry_date) return -1
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        })
        setItemBatches(sorted)
        if (sorted.length > 0) {
          setSelectedBatchId(sorted[0].id)
        }
      }
      setIsLoadingBatches(false)
    }

    void loadBatches()
  }, [selectedItem])

  // Camera activation side effects
  useEffect(() => {
    if (cameraActive && activeScanTab === 'camera') {
      void startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [cameraActive, activeScanTab])

  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (type === 'success') {
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(0.55, startTime + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
          osc.start(startTime)
          osc.stop(startTime + duration)
        }
        playTone(880, audioCtx.currentTime, 0.12)
        playTone(1320, audioCtx.currentTime + 0.13, 0.18)
        setTimeout(() => audioCtx.close(), 400)
      } else {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3)
        gain.gain.setValueAtTime(0.45, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
        osc.start(audioCtx.currentTime)
        osc.stop(audioCtx.currentTime + 0.3)
        setTimeout(() => audioCtx.close(), 400)
      }
    } catch (e) {
      console.warn('Could not play sound:', e)
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUseRealCamera(false)
      return
    }

    const constraintsToTry: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' } } },
      { video: { facingMode: 'environment' } },
      { video: { facingMode: 'user' } },
      { video: true }
    ]

    let s: MediaStream | null = null
    for (const constraints of constraintsToTry) {
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints)
        if (s) break
      } catch (err) {
        // Continue to try next fallback constraint
      }
    }

    if (s) {
      setStream(s)
      setUseRealCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } else {
      console.warn('Camera stream failed with all constraints, using fallback scan.')
      setUseRealCamera(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setUseRealCamera(false)
  }

  // Camera frame decoder loop
  const lastScannedRef = useRef<{ code: string; ts: number } | null>(null)
  useEffect(() => {
    let animFrameId: number
    let running = false

    if (cameraActive && useRealCamera && stream && videoRef.current) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })

      const scanFrame = () => {
        if (!running) return
        animFrameId = requestAnimationFrame(() => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && context) {
            const video = videoRef.current
            const scale = Math.min(1, 640 / video.videoWidth)
            canvas.width = Math.floor(video.videoWidth * scale)
            canvas.height = Math.floor(video.videoHeight * scale)
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const detected = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            })

            if (detected && detected.data) {
              const now = Date.now()
              const last = lastScannedRef.current
              if (!last || last.code !== detected.data || now - last.ts > 3000) {
                lastScannedRef.current = { code: detected.data, ts: now }
                handleQrPayload(detected.data)
              }
            }
          }
          setTimeout(scanFrame, 150)
        })
      }

      running = true
      scanFrame()
    }

    return () => {
      running = false
      if (animFrameId) cancelAnimationFrame(animFrameId)
    }
  }, [cameraActive, useRealCamera, stream])

  // Parse scanned QR Payload (format: MYINV:DRUG/NON_DRUG:id:code or JSON object string)
  const handleQrPayload = async (payload: string) => {
    let targetCode = payload
    let targetId: string | null = null
    let targetType: 'drug' | 'non_drug' | null = null

    const trimmed = payload.trim()

    // 1. Check for JSON format
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.code || parsed.item_code || parsed.drug_code) targetCode = parsed.code || parsed.item_code || parsed.drug_code
        if (parsed.facility_inventory_id || parsed.id || parsed.item_id || parsed.drug_id) targetId = parsed.facility_inventory_id || parsed.id || parsed.item_id || parsed.drug_id
        if (parsed.type || parsed.item_type) {
          const t = String(parsed.type || parsed.item_type).toLowerCase()
          targetType = (t === 'drug' || t === 'ubat') ? 'drug' : 'non_drug'
        }
      } catch (e) {
        console.warn('Invalid JSON payload:', e)
      }
    } 
    // 2. Check for MYINV prefix format
    else if (trimmed.startsWith('MYINV:')) {
      const parts = trimmed.split(':')
      if (parts.length >= 4) {
        targetType = parts[1].toLowerCase() === 'drug' ? 'drug' : 'non_drug'
        targetId = parts[2]
        targetCode = parts[3]
      } else if (parts.length === 3) {
        targetType = parts[1].toLowerCase() === 'drug' ? 'drug' : 'non_drug'
        targetCode = parts[2]
      } else if (parts.length === 2) {
        targetCode = parts[1]
      }
    }
    // 3. Pipe separated format
    else if (trimmed.includes('|')) {
      const parts = trimmed.split('|')
      targetCode = parts[0].trim()
    }

    const normCode = normalizeItemCode(targetCode)

    // Lookup in catalogItems by id, code (normalized + stripped), or name
    let matched = matchStockItem(catalogItems, targetCode, targetId, targetType)

    // Dynamic catalog refresh if not matched
    if (!matched && hospitalId) {
      try {
        const catRes = await getStockLevelSummary(hospitalId)
        if (catRes.data && catRes.data.length > 0) {
          setCatalogItems(catRes.data)
          matched = matchStockItem(catRes.data, targetCode, targetId, targetType)
        }
      } catch (e) {
        console.warn('Catalog refresh on scan failed:', e)
      }
    }

    if (matched) {
      playBeep('success')
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 500)
      setSelectedItem(matched)
      setStatusMessage(null)
      setCameraActive(false)
    } else {
      playBeep('error')
      const displayCode = normCode || targetCode
      setStatusMessage({ type: 'error', text: `Item tidak dijumpai dalam katalog untuk kod: ${displayCode}` })
    }
  }

  // Handle manual code lookup
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    void handleQrPayload(query)
    setSearchQuery('')
  }

  // Reset forms
  const resetForm = () => {
    setSelectedItem(null)
    setReceiptBatchNum('')
    setReceiptDate(new Date().toISOString().split('T')[0])
    setReceiptExpiryDate('')
    setReceiptMfgDate('')
    setReceiptQty('')
    setReceiptUnitCost('')
    setReceiptLocationId('')
    setSelectedBatchId('')
    setIssueQty('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setIssueReason('')
    setIssueTargetLocationId('')
  }

  // Handle Receipt Submit
  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    if (!receiptBatchNum || !receiptQty || !receiptLocationId) {
      setStatusMessage({ type: 'error', text: 'Sila isi Batch No, Kuantiti dan Lokasi Simpanan!' })
      playBeep('error')
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const payload = {
        item_type: selectedItem.item_type,
        item_id: selectedItem.item_id,
        batch_number: receiptBatchNum,
        manufacturing_date: receiptMfgDate || undefined,
        expiry_date: receiptExpiryDate || undefined,
        quantity_received: parseInt(receiptQty, 10),
        unit_cost: receiptUnitCost ? parseFloat(receiptUnitCost) : undefined,
        location_id: receiptLocationId,
        received_date: receiptDate || new Date().toISOString().split('T')[0],
        transaction_date: receiptDate ? `${receiptDate}T12:00:00.000Z` : undefined,
        performed_by: loggedUserName
      }

      const res = await createStockReceipt(hospitalId, payload)
      if (res.error) {
        throw new Error(res.error)
      }

      playBeep('success')
      setStatusMessage({ 
        type: 'success', 
        text: `Penerimaan berjaya direkod! ${payload.quantity_received} unit dimasukkan ke Batch ${payload.batch_number}.` 
      })

      // Reload catalog list to update quantities
      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)

      resetForm()
    } catch (err) {
      console.error(err)
      playBeep('error')
      setStatusMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Gagal memproses penerimaan stok.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Issuing Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    if (!selectedBatchId || !issueQty) {
      setStatusMessage({ type: 'error', text: 'Sila pilih Batch dan isi Kuantiti Pengeluaran!' })
      playBeep('error')
      return
    }

    const batchObj = itemBatches.find(b => b.id === selectedBatchId)
    if (!batchObj) {
      setStatusMessage({ type: 'error', text: 'Batch tidak sah!' })
      playBeep('error')
      return
    }

    const availableQty = (batchObj.quantity_on_hand || 0) - (batchObj.quantity_reserved || 0)
    const qtyToIssue = parseInt(issueQty, 10)
    if (qtyToIssue > availableQty) {
      setStatusMessage({ 
        type: 'error', 
        text: `Kuantiti melebihi baki tersedia! Baki tersedia: ${availableQty}` 
      })
      playBeep('error')
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const payload = {
        batch_id: selectedBatchId,
        quantity: qtyToIssue,
        to_location_id: issueTargetLocationId || undefined,
        reason: issueReason || undefined,
        issued_date: issueDate || new Date().toISOString().split('T')[0],
        transaction_date: issueDate ? `${issueDate}T12:00:00.000Z` : undefined,
        performed_by: loggedUserName
      }

      const res = await issueStock(hospitalId, payload)
      if (res.error) {
        throw new Error(res.error)
      }

      playBeep('success')
      setStatusMessage({ 
        type: 'success', 
        text: `Pengeluaran berjaya direkod! ${qtyToIssue} unit dikeluarkan dari Batch ${batchObj.batch_number}.` 
      })

      // Reload catalog list to update quantities
      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)

      resetForm()
    } catch (err) {
      console.error(err)
      playBeep('error')
      setStatusMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Gagal memproses pengeluaran stok.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter list helper for quick item finder
  const getSearchTerm = () => {
    const raw = searchQuery.trim()
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw)
        return parsed.code || parsed.item_code || ''
      } catch (e) {}
    } else if (raw.startsWith('MYINV:')) {
      const parts = raw.split(':')
      if (parts.length >= 4) {
        return parts[3]
      }
    }
    return raw
  }

  const searchTerm = getSearchTerm()
  const searchResults = searchTerm 
    ? catalogItems.filter(i => 
        i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : []

  return (
    <div className={`p-6 md:p-8 space-y-8 text-slate-800 transition-all duration-300 ${successFlash ? 'bg-emerald-500/10' : ''}`}>
      
      {/* LUXURY EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase tracking-wider font-bold">
                  MyInventory QR & Barcode Hub
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Fasiliti Kesihatan KKM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <QrCode className="w-7 h-7 text-teal-400" />
                <span>Imbasan & Transaksi Stok</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                Penerimaan dan Pengeluaran item menggunakan kamera imbasan QR atau carian kod manual secara selamat.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-2xl border transition-all ${
                  soundEnabled 
                    ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={soundEnabled ? 'Bunyi Aktif' : 'Bunyi Senyap'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
                <button
                  onClick={() => { setTransactionType('receipt'); resetForm(); }}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                    transactionType === 'receipt' 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Penerimaan
                </button>
                <button
                  onClick={() => { setTransactionType('issue'); resetForm(); }}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                    transactionType === 'issue' 
                      ? 'bg-rose-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Pengeluaran
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Scanner Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400" />
                <span>Imbasan Item</span>
              </h3>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => { setActiveScanTab('camera'); setCameraActive(true); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeScanTab === 'camera' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-400'
                  }`}
                >
                  Kamera
                </button>
                <button
                  onClick={() => { setActiveScanTab('manual'); stopCamera(); setCameraActive(false); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeScanTab === 'manual' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-400'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {activeScanTab === 'camera' ? (
              <div className="p-6 text-center space-y-4">
                {cameraActive && useRealCamera ? (
                  <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                    {/* Scanner Target Box Overlay */}
                    <div className="absolute inset-0 border-[3px] border-emerald-500/30 m-12 pointer-events-none rounded-xl">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square w-full max-w-[320px] mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-400 p-8">
                    <QrCode className="w-16 h-16 text-slate-350 animate-pulse" />
                    <p className="text-sm font-bold mt-4 text-slate-500">Kamera Tidak Aktif</p>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      Klik butang di bawah untuk memulakan pengimbas kamera
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  {cameraActive ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setCameraActive(false)} 
                      className="rounded-xl w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                    >
                      Hentikan Kamera
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setCameraActive(true)}
                      className="rounded-xl w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
                    >
                      Aktifkan Kamera
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      placeholder="Taip Kod Item atau Nama..."
                      className="pl-9 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900">
                    Cari
                  </Button>
                </form>

                {searchResults.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                    {searchResults.map(item => (
                      <button
                        key={`${item.item_type}-${item.item_id}`}
                        onClick={() => { setSelectedItem(item); setSearchQuery(''); }}
                        className="w-full text-left p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-400 block">{item.item_code}</span>
                          <span className="font-bold text-slate-700 block mt-0.5">{item.item_name}</span>
                        </div>
                        <Badge variant={item.item_type === 'drug' ? 'success' : 'secondary'} className="uppercase">
                          {item.item_type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback message display */}
          {statusMessage && (
            <div className={`rounded-2xl border p-5 flex items-start gap-3 shadow-sm ${
              statusMessage.type === 'success' 
                ? 'border-emerald-100 bg-emerald-50 text-emerald-800' 
                : 'border-rose-100 bg-rose-50 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <div className="p-1 bg-emerald-500 text-white rounded-lg flex-shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5" />
                </div>
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {statusMessage.type === 'success' ? 'Rekod Disimpan' : 'Ralat Transaksi'}
                </p>
                <p className="text-xs mt-1 font-medium leading-relaxed">{statusMessage.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transaction Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-6">
            <h3 className="font-black text-slate-800 text-lg border-b border-slate-50 pb-4 flex items-center gap-2">
              {transactionType === 'receipt' ? (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                  <span>Borang Penerimaan Stok</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-teal-500" />
                  <span>Borang Pengeluaran Stok</span>
                </>
              )}
            </h3>

            {selectedItem ? (
              <div className="space-y-6">
                
                {/* Active Selected Item Header Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider block uppercase">
                      Item Terpilih ({selectedItem.item_type})
                    </span>
                    <h4 className="font-black text-slate-800 text-base leading-tight">
                      {selectedItem.item_name}
                    </h4>
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                      <span className="font-mono font-bold text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded">
                        {selectedItem.item_code}
                      </span>
                      <span>•</span>
                      <span>Stok Semasa: <strong className="text-slate-800">{selectedItem.current_stock}</strong> {selectedItem.unit_of_measure}</span>
                    </div>
                  </div>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    onClick={resetForm}
                    className="rounded-xl border-slate-200 text-slate-500 hover:text-slate-800"
                  >
                    Tukar Item
                  </Button>
                </div>

                {/* Form Inputs based on transaction type */}
                {transactionType === 'receipt' ? (
                  <form onSubmit={handleReceiptSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">No Batch *</label>
                        <Input
                          placeholder="cth: B10243"
                          value={receiptBatchNum}
                          onChange={(e) => setReceiptBatchNum(e.target.value.toUpperCase())}
                          className="rounded-xl font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kuantiti Penerimaan *</label>
                        <Input
                          type="number"
                          placeholder="Kuantiti kemasukan"
                          value={receiptQty}
                          onChange={(e) => setReceiptQty(e.target.value)}
                          className="rounded-xl"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tarikh Terima *</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input
                            type="date"
                            value={receiptDate}
                            onChange={(e) => setReceiptDate(e.target.value)}
                            className="pl-10 rounded-xl font-mono"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tarikh Luput</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input
                            type="date"
                            value={receiptExpiryDate}
                            onChange={(e) => setReceiptExpiryDate(e.target.value)}
                            className="pl-10 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tarikh Pembuatan</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input
                            type="date"
                            value={receiptMfgDate}
                            onChange={(e) => setReceiptMfgDate(e.target.value)}
                            className="pl-10 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kos Seunit (RM)</label>
                        <div className="relative">
                          <span className="text-slate-400 text-xs font-bold absolute left-3 top-3">RM</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={receiptUnitCost}
                            onChange={(e) => setReceiptUnitCost(e.target.value)}
                            className="pl-9 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Lokasi Simpanan *</label>
                      <Select 
                        value={receiptLocationId} 
                        onChange={(e) => setReceiptLocationId(e.target.value)}
                        className="rounded-xl"
                        required
                      >
                        <option value="">Pilih Lokasi</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location_name} ({loc.aisle_number || 'Aisle —'})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <User className="w-4 h-4" />
                        <span>Direkod oleh: <strong>{loggedUserName}</strong></span>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold px-6 py-2.5 flex items-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <Spinner size="xs" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Simpan Penerimaan
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleIssueSubmit} className="space-y-5">
                    
                    {/* FEFO Batch Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Batch (Susunan FEFO) *</label>
                      {isLoadingBatches ? (
                        <div className="flex items-center justify-center p-6 border border-slate-100 rounded-2xl bg-slate-50">
                          <Spinner size="sm" />
                          <span className="text-xs text-slate-400 font-bold ml-2">Menyusun batch FEFO...</span>
                        </div>
                      ) : itemBatches.length === 0 ? (
                        <div className="p-4 border border-rose-100 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold text-center">
                          Tiada batch aktif ditemui dalam stor bagi item ini! Sila rekod Penerimaan terlebih dahulu.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {itemBatches.map((batch, index) => {
                            const available = (batch.quantity_on_hand || 0) - (batch.quantity_reserved || 0)
                            const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date()
                            
                            return (
                              <label
                                key={batch.id}
                                className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                                  selectedBatchId === batch.id
                                    ? 'bg-teal-50/50 border-teal-300 text-teal-900 shadow-sm'
                                    : 'bg-white border-slate-150 hover:bg-slate-50/50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-3.5">
                                  <input
                                    type="radio"
                                    name="issueBatch"
                                    value={batch.id}
                                    checked={selectedBatchId === batch.id}
                                    onChange={() => setSelectedBatchId(batch.id)}
                                    className="text-teal-600 focus:ring-teal-500"
                                  />
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-sm">{batch.batch_number}</span>
                                      {index === 0 && <Badge variant="success">FEFO (Terawal)</Badge>}
                                      {isExpired && <Badge variant="error">EXPIRED</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
                                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {batch.location?.location_name || 'Stor'}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3" /> Luput: {batch.expiry_date || '—'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-slate-400 block uppercase">Baki</span>
                                  <span className="text-sm font-black font-mono text-slate-800">{available} unit</span>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kuantiti Pengeluaran *</label>
                        <Input
                          type="number"
                          placeholder="Jumlah unit"
                          value={issueQty}
                          onChange={(e) => setIssueQty(e.target.value)}
                          className="rounded-xl font-mono"
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tarikh Pengeluaran *</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            className="pl-10 rounded-xl font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Unit / Lokasi Sasaran</label>
                        <Select 
                          value={issueTargetLocationId} 
                          onChange={(e) => setIssueTargetLocationId(e.target.value)}
                          className="rounded-xl"
                        >
                          <option value="">Pilih Sub-stor / Wad Sasaran</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.location_name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sebab / Catatan</label>
                        <Input
                          placeholder="cth: Pengedaran ke Sub-stor Dispensari"
                          value={issueReason}
                          onChange={(e) => setIssueReason(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <User className="w-4 h-4" />
                        <span>Pengeluar: <strong>{loggedUserName}</strong></span>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting || itemBatches.length === 0}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold px-6 py-2.5 flex items-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <Spinner size="xs" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Keluarkan Stok
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <QrCode className="w-12 h-12 text-slate-350 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-700">Imbas QR atau Cari Item Dahulu</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Sila mulakan pengimbasan kamera atau taip nama ubat/barang secara manual untuk membuka borang transaksi.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  )
}

export default StockMovementScannerPage
