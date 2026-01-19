import React, { useEffect, useState } from 'react'
import {
  Wind,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  AirVent,
  Truck
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Table,
  StatCard
} from '@/components/ui'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import { useToast } from '@/stores/toastStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  getOxygenSummary,
  getOxygenReceptionRecords,
  createOxygenReceptionRecord,
  getOxygenCylinderSizes,
  getOxygenCylinderTypes,
  getOxygenPricingConfig,
  getOxygenSystemSettings
} from '@/services/pharmacy/oxygenService'
import { ROUTES } from '@/lib/constants'
import type {
  OxygenSummary,
  OxygenReceptionRecordWithRelations,
  OxygenCylinderSize,
  OxygenCylinderType,
  OxygenPricingConfig,
  OxygenSystemSettings
} from '@/types/pharmacy'
import type { ApiResponse, PaginatedResponse, Column } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export const OxygenDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const toast = useToast()

  const [summary, setSummary] = useState<OxygenSummary | null>(null)
  const [receptions, setReceptions] = useState<OxygenReceptionRecordWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sizes, setSizes] = useState<OxygenCylinderSize[]>([])
  const [types, setTypes] = useState<OxygenCylinderType[]>([])
  const [prices, setPrices] = useState<OxygenPricingConfig[]>([])
  const [settings, setSettings] = useState<OxygenSystemSettings | null>(null)
  const [selectedReception, setSelectedReception] = useState<OxygenReceptionRecordWithRelations | null>(null)

  // QR Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetIndex, setScannerTargetIndex] = useState<number | null>(null);

  // Batch Add State
  const [batchData, setBatchData] = useState({
    size_id: '',
    quantity: 1
  })

  const [formData, setFormData] = useState({
    delivery_order_no: '',
    sales_order_no: '',
    reception_date: new Date().toISOString().split('T')[0],
    refill_amount: 0,
    loan_amount: 0,
    cylinders: [] as {
      qr_code: string;
      cylinder_size_id: string;
      cylinder_type_id: string;
      serial_number?: string;
      refill_price: number;
      loan_price: number;
    }[]
  })

  // Load Request
  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)

    try {
      const [summaryRes, recordsRes, sizesRes, typesRes, pricingRes, settingsRes]: [
        ApiResponse<OxygenSummary>,
        ApiResponse<PaginatedResponse<OxygenReceptionRecordWithRelations>>,
        ApiResponse<OxygenCylinderSize[]>,
        ApiResponse<OxygenCylinderType[]>,
        ApiResponse<OxygenPricingConfig[]>,
        ApiResponse<OxygenSystemSettings>
      ] = await Promise.all([
        getOxygenSummary(hospitalId),
        getOxygenReceptionRecords(hospitalId, 1, 10),
        getOxygenCylinderSizes(),
        getOxygenCylinderTypes(),
        getOxygenPricingConfig(hospitalId),
        getOxygenSystemSettings(hospitalId)
      ])

      if (summaryRes.error) throw new Error(summaryRes.error)

      setSummary(summaryRes.data)
      setReceptions(recordsRes.data?.data || [])
      setSizes(sizesRes.data || [])
      setTypes(typesRes.data || [])
      setPrices(pricingRes.data || [])
      setSettings(settingsRes.data || null)
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [hospitalId])

  // -- Event Handlers --

  const handleCreateReception = async () => {
    if (!hospitalId || !user?.id) return

    setIsSubmitting(true)
    try {
      const res = await createOxygenReceptionRecord({
        hospital_id: hospitalId,
        delivery_order_no: formData.delivery_order_no,
        sales_order_no: formData.sales_order_no,
        reception_date: formData.reception_date,
        refill_amount: formData.refill_amount,
        loan_amount: formData.loan_amount,
        vote_code: '080702',
        vote_activity: '27402',
        status: 'completed',
        created_by: user.id
      }, formData.cylinders.map(c => ({
        cylinder_size_id: c.cylinder_size_id,
        cylinder_type_id: c.cylinder_type_id,
        qr_code: c.qr_code,
        serial_number: c.serial_number,
        refill_price: c.refill_price,
        loan_price: c.loan_price
      })))

      if (res.error) throw new Error(res.error)

      toast.success('Success', 'Oxygen reception recorded successfully')

      setIsModalOpen(false)
      setFormData({
        delivery_order_no: '',
        sales_order_no: '',
        reception_date: new Date().toISOString().split('T')[0],
        refill_amount: 0,
        loan_amount: 0,
        cylinders: []
      })
      void loadData()
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to record reception')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScan = (data: string) => {
    if (scannerTargetIndex !== null) {
      updateCylinder(scannerTargetIndex, { qr_code: data });
    } else {
      const defaultSizeId = sizes[0]?.id || '';
      const defaultTypeId = types[0]?.id || '';
      const { refill, loan } = calculatePricing(defaultSizeId, data);
      const newCylinders = [
        ...formData.cylinders,
        {
          qr_code: data,
          cylinder_size_id: defaultSizeId,
          cylinder_type_id: defaultTypeId,
          refill_price: refill,
          loan_price: loan,
        }
      ]
      updateFormTotals(newCylinders)
    }
    setIsScannerOpen(false);
    setScannerTargetIndex(null);
  };

  const calculatePricing = (sizeId: string, qrCode: string) => {
    const size = sizes.find(s => s.id === sizeId)
    if (!size) return { refill: 0, loan: 0 }
    const isPrivate = size.code.startsWith('P') || qrCode.startsWith('P')
    const refillPrice = prices.find(p => p.cylinder_size_code === size.code)?.refill_price || 0
    const loanPrice = isPrivate ? 0 : (settings?.loan_cylinder_rate || 14.00)
    return { refill: refillPrice, loan: loanPrice }
  }

  const updateFormTotals = (cylinders: typeof formData.cylinders) => {
    const refillTotal = cylinders.reduce((sum, c) => sum + c.refill_price, 0)
    const loanTotal = cylinders.reduce((sum, c) => sum + c.loan_price, 0)
    setFormData(prev => ({ ...prev, cylinders, refill_amount: refillTotal, loan_amount: loanTotal }))
  }

  const addCylinder = () => {
    const defaultSizeId = sizes[0]?.id || ''
    const { refill, loan } = calculatePricing(defaultSizeId, '')
    updateFormTotals([...formData.cylinders, {
      qr_code: '',
      cylinder_size_id: defaultSizeId,
      cylinder_type_id: types[0]?.id || '',
      refill_price: refill,
      loan_price: loan
    }])
  }

  const updateCylinder = (index: number, updates: Partial<typeof formData['cylinders'][0]>) => {
    const newCylinders = [...formData.cylinders]
    const current = newCylinders[index]
    const updated = { ...current, ...updates }
    if (updates.cylinder_size_id !== undefined || updates.qr_code !== undefined) {
      const { refill, loan } = calculatePricing(updated.cylinder_size_id, updated.qr_code)
      updated.refill_price = refill
      updated.loan_price = loan
    }
    newCylinders[index] = updated
    updateFormTotals(newCylinders)
  }

  const removeCylinder = (index: number) => {
    updateFormTotals(formData.cylinders.filter((_, i) => i !== index))
  }

  const handleBatchAdd = () => {
    if (!batchData.size_id || batchData.quantity <= 0) return

    const size = sizes.find(s => s.id === batchData.size_id)
    if (!size) return

    const newCyls = [...formData.cylinders]
    for (let i = 0; i < batchData.quantity; i++) {
      const { refill, loan } = calculatePricing(size.id, '')
      newCyls.push({
        qr_code: '',
        cylinder_size_id: size.id,
        cylinder_type_id: types[0]?.id || '',
        refill_price: refill,
        loan_price: loan
      })
    }
    updateFormTotals(newCyls)
    setBatchData(prev => ({ ...prev, quantity: 1 }))
  }

  const quantitySummary = formData.cylinders.reduce((acc, cyl) => {
    const size = sizes.find(s => s.id === cyl.cylinder_size_id)
    const code = size?.code || 'Unknown'
    acc[code] = (acc[code] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const generateReceptionPDF = (record: OxygenReceptionRecordWithRelations) => {
    const doc = new jsPDF()
    const hospitalName = "HOSPITAL DAERAH LAWAS"

    // Header
    doc.setFontSize(14)
    doc.text("LAPORAN PENERIMAAN BEKALAN GAS PERUBATAN", 105, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.text("(KEW.PS-3)", 105, 22, { align: 'center' })

    // Metadata
    autoTable(doc, {
      startY: 30,
      body: [
        ["HOSPITAL:", hospitalName.toUpperCase(), "NO. DO / INVOIS:", record.delivery_order_no.toUpperCase()],
        ["TARIKH TERIMA:", formatDate(record.reception_date).toUpperCase(), "PEGAWAI PENERIMA:", (record.created_by_user?.full_name || '-').toUpperCase()],
        ["VOTE CODE:", record.vote_code || '080702', "AKTIVITI:", record.vote_activity || '27402']
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 40 } }
    })

    // Items
    const cylinders = record.items || []
    const itemsBody = cylinders.map((item, idx) => [
      idx + 1,
      item.cylinder?.qr_code || '-',
      item.cylinder_size?.code || '-',
      item.cylinder_type?.name || '-',
      "1 UNIT",
      formatCurrency(item.unit_price || 0)
    ])

    autoTable(doc, {
      startY: 55,
      head: [['BIL', 'NO. SIRI / QR', 'SAIZ', 'JENIS', 'KUANTITI', 'HARGA SEUNIT (RM)']],
      body: itemsBody,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 5: { halign: 'right' } }
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(9)
    doc.text("JUMLAH KESELURUHAN (RM): " + formatCurrency(record.total_amount), 195, finalY, { align: 'right' })

    doc.text("Tandatangan Pegawai Penerima:", 20, finalY + 20)
    doc.text("....................................................", 20, finalY + 35)
    doc.text("( Nama: " + (record.created_by_user?.full_name || '') + " )", 20, finalY + 40)

    doc.save(`reception-${record.delivery_order_no}.pdf`)
  }

  const recordsColumns: Column<OxygenReceptionRecordWithRelations>[] = [
    { key: 'reception_date', label: 'Date', render: (val) => formatDate(String(val)) },
    { key: 'delivery_order_no', label: 'DO No', className: 'font-bold' },
    { key: 'sales_order_no', label: 'SO No', render: (val) => val || '-' },
    {
      key: 'refill_amount',
      label: 'Refill (RM)',
      className: 'text-right',
      render: (val) => formatCurrency(Number(val))
    },
    {
      key: 'loan_amount',
      label: 'Loan (RM)',
      className: 'text-right',
      render: (val) => formatCurrency(Number(val))
    },
    {
      key: 'id',
      label: '',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedReception(row)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => generateReceptionPDF(row)}>
            PDF
          </Button>
        </div>
      )
    }
  ]

  const kpis = summary?.kpis

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wind className="w-8 h-8 text-sky-600" />
            Pharmacy Oxygen Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Financial monitoring and medical oxygen reception management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="w-4 h-4 mr-2" /> Receive Oxygen
          </Button>
        </div>
      </div>

      {/* Financial KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Allocation"
          value={formatCurrency(kpis?.total_allocation || 0)}
          color="primary"
          subtitle="FY 2026 (080702 / 27402)"
        />
        <StatCard
          icon={TrendingUp}
          title="Total Expenses"
          value={formatCurrency(kpis?.expense || 0)}
          color="success"
          subtitle="Refill & Service costs"
        />
        <StatCard
          icon={AlertCircle}
          title="Liabilities"
          value={formatCurrency(kpis?.liabilities || 0)}
          color="warning"
          subtitle="Pending invoices"
        />
        <StatCard
          icon={DollarSign}
          title="Current Balance"
          value={formatCurrency(kpis?.balance || 0)}
          color="info"
          subtitle="Remaining allocation"
        />
        <StatCard
          icon={Truck}
          title="Loan Charges"
          value={formatCurrency(kpis?.loan_total || 0)}
          color="primary"
          subtitle="Private cylinder fees"
        />
      </div>

      <div className="lg:col-span-3 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col pt-4">
        <div className="px-4 pb-2 border-b flex justify-between items-center bg-gray-50/30">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Receptions
          </h3>
          <Button variant="ghost" size="sm" className="text-xs text-sky-600">View All</Button>
        </div>
        <Table
          data={receptions}
          columns={recordsColumns}
          isLoading={isLoading}
          emptyMessage="No records"
          onRowClick={(row) => setSelectedReception(row)}
        />
      </div>

      {/* Modal for Reception */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Oxygen Reception"
        size="3xl"
      >
        {isScannerOpen && (
          <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
        )}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Header info */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-sky-600 rounded-full" />
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Document Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Delivery Order No (DO) <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Plus className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      </div>
                      <Input
                        placeholder="e.g. DO/LAWAS/2026/001"
                        value={formData.delivery_order_no}
                        onChange={e => setFormData({ ...formData, delivery_order_no: e.target.value })}
                        className="pl-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm h-11 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Sales Order No (SO)</label>
                    <Input
                      placeholder="e.g. SO-8877665544"
                      value={formData.sales_order_no}
                      onChange={e => setFormData({ ...formData, sales_order_no: e.target.value })}
                      className="bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm h-11 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Reception Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input
                      type="date"
                      value={formData.reception_date}
                      onChange={e => setFormData({ ...formData, reception_date: e.target.value })}
                      className="pl-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm h-11 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Add Section */}
              <div className="bg-sky-50/40 p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-sky-500 rounded-full" />
                    <h4 className="text-[11px] font-black text-sky-700 uppercase tracking-widest">Rapid Batch Addition</h4>
                  </div>
                  <Badge variant="info" className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">Efficiency Tool</Badge>
                </div>
                <div className="flex items-end gap-3 p-1">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-600 uppercase tracking-wider ml-1">Cylinder Size</label>
                    <Select
                      value={batchData.size_id}
                      onChange={e => setBatchData({ ...batchData, size_id: e.target.value })}
                      options={sizes.map(s => ({ label: s.code, value: s.id }))}
                      className="bg-white border-sky-200 focus:border-sky-500 shadow-sm h-11 transition-all"
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-600 uppercase tracking-wider ml-1">Qty (Unit)</label>
                    <Input
                      type="number"
                      min="1"
                      value={batchData.quantity}
                      onChange={e => setBatchData({ ...batchData, quantity: parseInt(e.target.value) || 1 })}
                      className="bg-white border-sky-200 focus:border-sky-500 shadow-sm h-11 transition-all text-center font-bold"
                    />
                  </div>
                  <Button
                    onClick={handleBatchAdd}
                    className="bg-sky-600 hover:bg-sky-700 text-white h-11 px-6 shadow-md shadow-sky-600/10 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Slots
                  </Button>
                </div>
              </div>
            </div>

            {/* Qty Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Inventory Loadout</h4>
              </div>
              <div className="flex-1 space-y-2.5 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(quantitySummary).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-4">
                    <AirVent className="w-8 h-8 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Awaiting scan or batch</p>
                  </div>
                ) : (
                  Object.entries(quantitySummary).map(([code, qty]) => (
                    <div key={code} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl group hover:border-sky-200 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">{code}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Cylinder SKU</span>
                      </div>
                      <Badge variant="primary" className="bg-sky-600 text-white border-0 font-mono text-sm px-3 shadow-sm">{qty}</Badge>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t border-slate-200 mt-2">
                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest Total</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">{formData.cylinders.length} <span className="text-xs font-bold text-slate-400">UNITS</span></span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Wind className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center bg-white p-2 ml-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 tracking-tight">
                  Verification Manifest
                </h4>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={addCylinder} className="text-[11px] font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all rounded-lg px-4">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Manual Slot
                </Button>
                <Button size="sm" onClick={() => setIsScannerOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-bold rounded-lg px-5 shadow-sm transform active:scale-95 transition-all flex items-center gap-2">
                  <AirVent className="w-3.5 h-3.5" /> Scan QR Code
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-slate-50/80 text-[10px] text-slate-400 uppercase font-black tracking-widest sticky top-0 backdrop-blur-md z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Tracking Identity (QR/Serial)</th>
                      <th className="px-6 py-4 text-left">Configuration</th>
                      <th className="px-6 py-4 text-right">Landed Cost (RM)</th>
                      <th className="px-6 py-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.cylinders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-16 text-center">
                          <div className="flex flex-col items-center justify-center opacity-30">
                            <Plus className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Empty Manifest</p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">Initialize with Rapid Add or Scan</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      formData.cylinders.map((cyl, idx) => (
                        <tr key={idx} className="group hover:bg-sky-50/30 transition-all duration-200">
                          <td className="px-5 py-3">
                            <div className="relative">
                              <Input
                                value={cyl.qr_code}
                                onChange={e => updateCylinder(idx, { qr_code: e.target.value })}
                                className="h-10 text-xs font-mono border-slate-100 bg-slate-50 group-hover:bg-white group-hover:border-sky-200 focus:bg-white focus:border-sky-500 rounded-xl transition-all pl-9"
                                placeholder="Scan/Type Serial No..."
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Plus className={`w-3.5 h-3.5 ${cyl.qr_code ? 'text-sky-500' : 'text-slate-300'}`} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Select
                              value={cyl.cylinder_size_id}
                              onChange={e => updateCylinder(idx, { cylinder_size_id: e.target.value })}
                              options={sizes.map(s => ({ label: s.code, value: s.id }))}
                              className="h-10 text-xs border-slate-100 bg-slate-50 group-hover:bg-white group-hover:border-sky-200 focus:bg-white focus:border-sky-500 rounded-xl transition-all font-bold text-slate-700"
                            />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-black text-slate-800 tracking-tight">
                              {formatCurrency(cyl.refill_price + cyl.loan_price)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => removeCylinder(idx)}
                              className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-lg"
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-8 gap-6 pb-2">
            <div className="flex items-center gap-5 bg-slate-50/80 px-8 py-4 rounded-3xl border border-slate-100 shadow-inner">
              <div className="flex flex-col border-r border-slate-200 pr-5">
                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Total Items</span>
                <span className="text-xl font-black text-slate-800 tracking-tighter">{formData.cylinders.length} <span className="text-xs font-bold text-slate-400 ml-1">UNITS</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-sky-500 font-black tracking-widest mb-1">Final Liability (Est)</span>
                <span className="text-3xl font-black text-sky-700 tracking-tighter leading-none">{formatCurrency(formData.refill_amount + formData.loan_amount)}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center border border-sky-200 ml-2 animate-bounce hover:pause">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 sm:px-8 py-6 text-slate-500 hover:text-slate-800 font-black uppercase text-[11px] tracking-widest border border-transparent hover:border-slate-200 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateReception}
                disabled={isSubmitting || formData.cylinders.length === 0}
                className="flex-1 sm:px-12 py-6 bg-sky-600 hover:bg-sky-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-sky-600/20 transform active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Submit Reception</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal for Reception */}
      <Modal
        isOpen={!!selectedReception}
        onClose={() => setSelectedReception(null)}
        title="Reception Manifest Details"
        size="4xl"
      >
        {selectedReception && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                {/* Header Info */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Order</p>
                    <p className="font-bold text-slate-900">{selectedReception.delivery_order_no}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Order</p>
                    <p className="font-bold text-slate-900">{selectedReception.sales_order_no || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reception Date</p>
                    <p className="font-bold text-slate-900">{formatDate(selectedReception.reception_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received By</p>
                    <p className="font-bold text-slate-900">{selectedReception.created_by_user?.full_name || '-'}</p>
                  </div>
                </div>

                {/* Cylinder Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left">#</th>
                        <th className="px-6 py-4 text-left">Tracking ID (QR/Serial)</th>
                        <th className="px-6 py-4 text-left">Size</th>
                        <th className="px-6 py-4 text-left">Type</th>
                        <th className="px-6 py-4 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedReception.items?.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{item.cylinder?.qr_code || item.qr_code}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="border-slate-200 font-bold text-slate-600">
                              {item.cylinder_size?.code}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{item.cylinder_type?.name}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-800">
                            {formatCurrency(item.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <DollarSign className="w-4 h-4 text-sky-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-400">Financial Summary</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Refill Cost</span>
                      <span className="font-bold">{formatCurrency(selectedReception.refill_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Loan Fees</span>
                      <span className="font-bold">{formatCurrency(selectedReception.loan_amount)}</span>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Total Liability</span>
                        <span className="text-2xl font-black tracking-tighter">{formatCurrency(selectedReception.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vote Code</p>
                      <p className="text-xs font-bold text-slate-700">{selectedReception.vote_code || '080702'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Activity Code</p>
                      <p className="text-xs font-bold text-slate-700">{selectedReception.vote_activity || '27402'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Status</p>
                      <Badge variant="success" className="text-[10px] font-black uppercase">{selectedReception.status}</Badge>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => generateReceptionPDF(selectedReception)}
                  className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-sky-600/20"
                >
                  Download PDF Report
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setSelectedReception(null)} className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-800">
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OxygenDashboardPage
