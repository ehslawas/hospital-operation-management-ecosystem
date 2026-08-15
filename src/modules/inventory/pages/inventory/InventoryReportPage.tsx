// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Package,
  Layers,
  Printer,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Badge, Select, Button, Input } from '@/components/ui'
import { getInventoryReport } from '@/services/pharmacy/inventoryService'
import type { InventoryReportRow, ReportPeriod, InventoryReportFilter } from '@/types/pharmacy'
import { cn, formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const InventoryReportPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-001'

  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [subPeriod, setSubPeriod] = useState<number>(new Date().getMonth() + 1) // 1-12 for monthly
  const [itemType, setItemType] = useState<'all' | 'drug' | 'non_drug'>('all')
  const [procurementVote, setProcurementVote] = useState<'all' | 'appl' | 'cc' | 'dp' | 'lp'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [rows, setRows] = useState<InventoryReportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset subPeriod default when period changes
  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod)
    if (newPeriod === 'monthly') setSubPeriod(new Date().getMonth() + 1)
    else if (newPeriod === 'quarterly') setSubPeriod(Math.floor(new Date().getMonth() / 3) + 1)
    else if (newPeriod === 'half-yearly') setSubPeriod(new Date().getMonth() < 6 ? 1 : 2)
    else setSubPeriod(1)
  }

  // Load report data
  const loadReport = async () => {
    setIsLoading(true)
    setError(null)

    const filter: InventoryReportFilter = {
      period,
      year,
      subPeriod,
      item_type: itemType,
      procurement_vote: procurementVote,
      search: searchTerm,
    }

    const res = await getInventoryReport(hospitalId, filter)

    if (res.error) {
      setError(res.error)
      setRows([])
    } else {
      setRows(res.data || [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void loadReport()
  }, [hospitalId, period, year, subPeriod, itemType, procurementVote])

  // Filtered and sorted (A-Z) rows for display
  const filteredRows = useMemo(() => {
    let list = rows
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      list = rows.filter(r => r.item_name.toLowerCase().includes(q) || r.item_code.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => (a.item_name || '').localeCompare(b.item_name || '', 'ms', { sensitivity: 'base' }))
  }, [rows, searchTerm])

  // Summary Totals
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.openingQty += r.opening_qty
        acc.openingValue += r.opening_value
        acc.receiptQty += r.receipt_qty
        acc.receiptValue += r.receipt_value
        acc.transferInQty += r.transfer_in_qty
        acc.transferInValue += r.transfer_in_value
        acc.issueQty += r.issue_qty
        acc.issueValue += r.issue_value
        acc.transferOutQty += r.transfer_out_qty
        acc.transferOutValue += r.transfer_out_value
        acc.returnQty += r.return_qty
        acc.returnValue += r.return_value
        acc.adjustmentQty += r.adjustment_qty
        acc.adjustmentValue += r.adjustment_value
        acc.closingQty += r.closing_qty
        acc.closingValue += r.closing_value
        return acc
      },
      {
        openingQty: 0, openingValue: 0,
        receiptQty: 0, receiptValue: 0,
        transferInQty: 0, transferInValue: 0,
        issueQty: 0, issueValue: 0,
        transferOutQty: 0, transferOutValue: 0,
        returnQty: 0, returnValue: 0,
        adjustmentQty: 0, adjustmentValue: 0,
        closingQty: 0, closingValue: 0,
      }
    )
  }, [filteredRows])

  // Period Label helper
  const getPeriodTitle = () => {
    const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
    if (period === 'monthly') return `Bulan ${monthNames[(subPeriod || 1) - 1]} ${year}`
    if (period === 'quarterly') return `Suku Ke-${subPeriod} (Q${subPeriod}) ${year}`
    if (period === 'half-yearly') return `Setengah Tahun Ke-${subPeriod} (H${subPeriod}) ${year}`
    return `Tahun ${year}`
  }

  // Skim Badge renderer
  const renderSkimBadge = (vote?: string) => {
    const v = (vote || 'APPL').toUpperCase()
    if (v === 'APPL') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">APPL</span>
    if (v === 'CC') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">CC</span>
    if (v === 'LP') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">LP</span>
    if (v === 'DP') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">DP</span>
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{v}</span>
  }

  // Chart data setup
  const chartData = useMemo(() => {
    if (period === 'monthly') {
      return [
        { name: 'Penerimaan Supplier', RM: totals.receiptValue, Qty: totals.receiptQty },
        { name: 'Pindahan Masuk', RM: totals.transferInValue, Qty: totals.transferInQty },
        { name: 'Pengeluaran Dept', RM: totals.issueValue, Qty: totals.issueQty },
        { name: 'Pindahan Keluar', RM: totals.transferOutValue, Qty: totals.transferOutQty },
        { name: 'Pulangan Stok', RM: totals.returnValue, Qty: totals.returnQty },
      ]
    }
    return [
      { name: 'Stok Awal', RM: totals.openingValue },
      { name: 'Terima (Supplier)', RM: totals.receiptValue },
      { name: 'Terima (Fasiliti)', RM: totals.transferInValue },
      { name: 'Agihan (Dept)', RM: totals.issueValue },
      { name: 'Agihan (Fasiliti)', RM: totals.transferOutValue },
      { name: 'Stok Akhir', RM: totals.closingValue },
    ]
  }, [totals, period])

  // Export CSV
  const exportCSV = () => {
    if (filteredRows.length === 0) return

    const headers = [
      'Kod Item', 'Nama Item', 'Skim / Vote', 'Kategori', 'Harga Seunit (RM)',
      'Baki Awal (Qty)', 'Nilai Awal (RM)',
      'Terima Supplier (Qty)', 'Nilai Terima Supplier (RM)',
      'Terima Fasiliti (Qty)', 'Nilai Terima Fasiliti (RM)',
      'Pengeluaran Dept (Qty)', 'Nilai Pengeluaran Dept (RM)',
      'Pindahan Keluar (Qty)', 'Nilai Pindahan Keluar (RM)',
      'Pulangan (Qty)', 'Nilai Pulangan (RM)',
      'Pelarasan (Qty)', 'Nilai Pelarasan (RM)',
      'Baki Akhir (Qty)', 'Nilai Akhir (RM)'
    ]

    const csvRows = filteredRows.map(r => [
      `"${r.item_code}"`,
      `"${r.item_name.replace(/"/g, '""')}"`,
      `"${r.procurement_vote || 'APPL'}"`,
      `"${r.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}"`,
      r.unit_price.toFixed(2),
      r.opening_qty, r.opening_value.toFixed(2),
      r.receipt_qty, r.receipt_value.toFixed(2),
      r.transfer_in_qty, r.transfer_in_value.toFixed(2),
      r.issue_qty, r.issue_value.toFixed(2),
      r.transfer_out_qty, r.transfer_out_value.toFixed(2),
      r.return_qty, r.return_value.toFixed(2),
      r.adjustment_qty, r.adjustment_value.toFixed(2),
      r.closing_qty, r.closing_value.toFixed(2)
    ])

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Pergerakan_Inventori_${procurementVote.toUpperCase()}_${period}_${year}_${subPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export PDF
  const exportPDF = () => {
    if (filteredRows.length === 0) return

    const doc = new jsPDF('landscape', 'mm', 'a4')

    // Header Title
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42)
    doc.text('LAPORAN PERGERAKAN & NILAI INVENTORI STOR', 14, 15)

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`Tempoh Laporan: ${getPeriodTitle()} | Skim: ${procurementVote === 'all' ? 'Semua Skim (APPL/CC/LP/DP)' : procurementVote.toUpperCase()} | Kategori: ${itemType === 'all' ? 'Semua Item' : itemType === 'drug' ? 'Ubat' : 'Bukan Ubat'}`, 14, 22)
    doc.text(`Tarikh Cetakan: ${new Date().toLocaleDateString('ms-MY')} | Jumlah Item: ${filteredRows.length}`, 14, 27)

    // Summary Box
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 31, 269, 14, 2, 2, 'FD')

    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(`Jumlah Terima (Supplier): ${formatCurrency(totals.receiptValue)} (${totals.receiptQty} unit)`, 18, 37)
    doc.text(`Jumlah Agihan (Dept): ${formatCurrency(totals.issueValue)} (${totals.issueQty} unit)`, 105, 37)
    doc.text(`Jumlah Nilai Pegangan Akhir: ${formatCurrency(totals.closingValue)}`, 200, 37)

    const tableHeaders = [
      ['Kod', 'Nama Item', 'Skim', 'Baki Awal (Qty/RM)', 'Terima Supplier (Qty/RM)', 'Terima Fasiliti (Qty/RM)', 'Agihan Dept (Qty/RM)', 'Pindahan Out (Qty/RM)', 'Baki Akhir (Qty/RM)']
    ]

    const tableData = filteredRows.map(r => [
      r.item_code,
      r.item_name.length > 25 ? r.item_name.substring(0, 23) + '...' : r.item_name,
      r.procurement_vote || 'APPL',
      `${r.opening_qty}\nRM ${r.opening_value.toFixed(2)}`,
      `${r.receipt_qty}\nRM ${r.receipt_value.toFixed(2)}`,
      `${r.transfer_in_qty}\nRM ${r.transfer_in_value.toFixed(2)}`,
      `${r.issue_qty}\nRM ${r.issue_value.toFixed(2)}`,
      `${r.transfer_out_qty}\nRM ${r.transfer_out_value.toFixed(2)}`,
      `${r.closing_qty}\nRM ${r.closing_value.toFixed(2)}`
    ])

    // Add totals row
    tableData.push([
      'JUMLAH',
      'KESELURUHAN',
      '-',
      `${totals.openingQty}\nRM ${totals.openingValue.toFixed(2)}`,
      `${totals.receiptQty}\nRM ${totals.receiptValue.toFixed(2)}`,
      `${totals.transferInQty}\nRM ${totals.transferInValue.toFixed(2)}`,
      `${totals.issueQty}\nRM ${totals.issueValue.toFixed(2)}`,
      `${totals.transferOutQty}\nRM ${totals.transferOutValue.toFixed(2)}`,
      `${totals.closingQty}\nRM ${totals.closingValue.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 48,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 50 },
        2: { cellWidth: 16, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
        }
      }
    })

    doc.save(`Laporan_Inventori_${procurementVote.toUpperCase()}_${period}_${year}_${subPeriod}.pdf`)
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Layers className="w-4 h-4" /> Stock Analysis & Store Intelligence
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">
              Laporan Pergerakan & Nilai Inventori (Inventory Report)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-4xl">
              Pemantauan terperinci kuantiti dan nilai ringgit (RM) mengikut Skim (APPL, CC, LP, DP) bagi transaksi item diterima daripada pembekal, penerimaan/pindahan fasiliti, agihan unit/wad, serta pelarasan stok stor secara bulanan, suku tahunan, 6-bulanan & tahunan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button variant="outline" onClick={exportCSV} className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" /> Export CSV
            </Button>
            <Button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30">
              <Printer className="w-4 h-4 mr-2" /> Cetak PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Period & Filter Selection Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handlePeriodChange('monthly')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                period === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Bulanan (Monthly)
            </button>
            <button
              onClick={() => handlePeriodChange('quarterly')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                period === 'quarterly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Suku Tahun (Quarterly)
            </button>
            <button
              onClick={() => handlePeriodChange('half-yearly')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                period === 'half-yearly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              6-Bulanan (Half-Yearly)
            </button>
            <button
              onClick={() => handlePeriodChange('yearly')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                period === 'yearly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Tahunan (Yearly)
            </button>
          </div>

          {/* Date Selector Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Tahun:</span>
              <Select value={year.toString()} onChange={e => setYear(Number(e.target.value))} className="w-28 text-xs">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </Select>
            </div>

            {period === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Bulan:</span>
                <Select value={subPeriod.toString()} onChange={e => setSubPeriod(Number(e.target.value))} className="w-36 text-xs">
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Mac</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Jun</option>
                  <option value="7">Julai</option>
                  <option value="8">Ogos</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Disember</option>
                </Select>
              </div>
            )}

            {period === 'quarterly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Suku Tahun:</span>
                <Select value={subPeriod.toString()} onChange={e => setSubPeriod(Number(e.target.value))} className="w-36 text-xs">
                  <option value="1">Q1 (Jan - Mac)</option>
                  <option value="2">Q2 (Apr - Jun)</option>
                  <option value="3">Q3 (Jul - Sep)</option>
                  <option value="4">Q4 (Okt - Dis)</option>
                </Select>
              </div>
            )}

            {period === 'half-yearly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Tempoh 6-Bulan:</span>
                <Select value={subPeriod.toString()} onChange={e => setSubPeriod(Number(e.target.value))} className="w-40 text-xs">
                  <option value="1">H1 (Jan - Jun)</option>
                  <option value="2">H2 (Jul - Dis)</option>
                </Select>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={loadReport} className="text-xs">
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isLoading && "animate-spin")} /> Muat Semula
            </Button>
          </div>
        </div>

        {/* Filters: Skim, Category, Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kod atau nama item..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Skim / Procurement Vote Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">Skim Pembekalan:</span>
              <Select value={procurementVote} onChange={e => setProcurementVote(e.target.value as any)} className="w-44 text-xs font-medium border-blue-200 bg-blue-50/50">
                <option value="all">Semua Skim (APPL / CC / LP / DP)</option>
                <option value="appl">APPL (Kontrak Pusat)</option>
                <option value="cc">CC (Cost Centre / Kontrak)</option>
                <option value="lp">LP (Pembelian Terus / Local)</option>
                <option value="dp">DP (Direct Procurement)</option>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Kategori:</span>
              <Select value={itemType} onChange={e => setItemType(e.target.value as any)} className="w-36 text-xs">
                <option value="all">Semua Item</option>
                <option value="drug">Ubat (Drug)</option>
                <option value="non_drug">Bukan Ubat (Non-Drug)</option>
              </Select>
            </div>

            <Badge variant="info" className="text-xs font-medium">
              {filteredRows.length} Item Ditemui
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Receipts from Supplier */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute right-3 top-3 bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terima (Supplier)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatCurrency(totals.receiptValue)}</p>
          <div className="flex items-center justify-between text-xs text-emerald-700 mt-2 bg-emerald-50/60 p-2 rounded-lg">
            <span>Kuantiti Diterima:</span>
            <span className="font-bold">{totals.receiptQty.toLocaleString()} unit</span>
          </div>
        </div>

        {/* Card 2: Inter-facility Transfers */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-sky-300 transition-all">
          <div className="absolute right-3 top-3 bg-sky-50 p-2.5 rounded-xl text-sky-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pindahan (Fasiliti)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatCurrency(totals.transferInValue)}</p>
          <div className="flex items-center justify-between text-xs text-sky-700 mt-2 bg-sky-50/60 p-2 rounded-lg">
            <span>Masuk: {totals.transferInQty} u</span>
            <span>Keluar: {totals.transferOutQty} u</span>
          </div>
        </div>

        {/* Card 3: Issues to Dept */}
        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute right-3 top-3 bg-amber-50 p-2.5 rounded-xl text-amber-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agihan (Department / Wad)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatCurrency(totals.issueValue)}</p>
          <div className="flex items-center justify-between text-xs text-amber-700 mt-2 bg-amber-50/60 p-2 rounded-lg">
            <span>Kuantiti Diagih:</span>
            <span className="font-bold">{totals.issueQty.toLocaleString()} unit</span>
          </div>
        </div>

        {/* Card 4: Closing Holding Value */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="absolute right-3 top-3 bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai Baki Pegangan Akhir</p>
          <p className="text-2xl font-extrabold text-indigo-900 mt-2">{formatCurrency(totals.closingValue)}</p>
          <div className="flex items-center justify-between text-xs text-indigo-700 mt-2 bg-indigo-50/60 p-2 rounded-lg">
            <span>Baki Akhir Unit:</span>
            <span className="font-bold">{totals.closingQty.toLocaleString()} unit</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm w-full">
        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Analisis Ringkas Pergerakan Stok ({getPeriodTitle()}) {procurementVote !== 'all' && `[Skim: ${procurementVote.toUpperCase()}]`}
        </h3>
        <p className="text-xs text-gray-500 mb-4">Perbandingan Nilai Ringgit (RM) Mengikut Jenis Pergerakan Stok Real-time</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `RM${(val/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => [`RM ${Number(value).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`, 'Nilai (RM)']} />
              <Bar dataKey="RM" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Jadual Pergerakan & Nilai Stok Terperinci</h2>
            <p className="text-xs text-gray-500">Menunjukkan perbandingan Kuantiti (Qty) dan Nilai Ringgit (RM) bagi tempoh {getPeriodTitle()} {procurementVote !== 'all' && `(Skim: ${procurementVote.toUpperCase()})`}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Menunjukkan {filteredRows.length} item
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">
            Gagal memuatkan laporan: {error}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table>
              <Table.Head>
                <Table.Row className="bg-gray-50/80">
                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 whitespace-nowrap">Kod Item</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 whitespace-nowrap min-w-[200px]">Nama Item</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 text-center whitespace-nowrap">Skim</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 text-right whitespace-nowrap">Harga Unit (RM)</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 text-right whitespace-nowrap bg-slate-100/70">Baki Awal (Qty)</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-gray-700 text-right whitespace-nowrap bg-slate-100/70">Nilai Awal (RM)</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-emerald-800 text-right whitespace-nowrap bg-emerald-50/60">Terima Supplier (Qty)</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-emerald-800 text-right whitespace-nowrap bg-emerald-50/60">Nilai Supplier (RM)</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-sky-800 text-right whitespace-nowrap bg-sky-50/60">Terima Fasiliti (Qty)</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-amber-800 text-right whitespace-nowrap bg-amber-50/60">Agihan Dept (Qty)</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-amber-800 text-right whitespace-nowrap bg-amber-50/60">Nilai Agihan (RM)</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-orange-800 text-right whitespace-nowrap bg-orange-50/60">Pindahan Keluar (Qty)</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-purple-800 text-right whitespace-nowrap bg-purple-50/60">Pelarasan / Pulangan</Table.Cell>

                  <Table.Cell as="th" className="text-xs font-bold text-indigo-900 text-right whitespace-nowrap bg-indigo-50/80">Baki Akhir (Qty)</Table.Cell>
                  <Table.Cell as="th" className="text-xs font-bold text-indigo-900 text-right whitespace-nowrap bg-indigo-50/80">Nilai Akhir (RM)</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filteredRows.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={15} className="text-center py-12 text-sm text-gray-500">
                      Tiada rekod pergerakan inventori ditemui bagi kriteria carian.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  <>
                    {filteredRows.map((r) => (
                      <Table.Row key={r.item_id} className="hover:bg-blue-50/30 transition-colors text-xs">
                        <Table.Cell className="font-mono text-gray-700 font-medium">{r.item_code}</Table.Cell>
                        <Table.Cell className="font-semibold text-gray-900">
                          <div>{r.item_name}</div>
                          <span className="text-[10px] text-gray-400 uppercase">{r.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}</span>
                        </Table.Cell>
                        <Table.Cell className="text-center">{renderSkimBadge(r.procurement_vote)}</Table.Cell>
                        <Table.Cell className="text-right text-gray-600">{r.unit_price.toFixed(2)}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-slate-50/50">{r.opening_qty.toLocaleString()}</Table.Cell>
                        <Table.Cell className="text-right text-slate-700 bg-slate-50/50">{formatCurrency(r.opening_value)}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-emerald-50/30 text-emerald-700">{r.receipt_qty > 0 ? `+${r.receipt_qty}` : '-'}</Table.Cell>
                        <Table.Cell className="text-right bg-emerald-50/30 text-emerald-800 font-medium">{r.receipt_value > 0 ? formatCurrency(r.receipt_value) : '-'}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-sky-50/30 text-sky-700">{r.transfer_in_qty > 0 ? `+${r.transfer_in_qty}` : '-'}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-amber-50/30 text-amber-700">{r.issue_qty > 0 ? `-${r.issue_qty}` : '-'}</Table.Cell>
                        <Table.Cell className="text-right bg-amber-50/30 text-amber-800 font-medium">{r.issue_value > 0 ? formatCurrency(r.issue_value) : '-'}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-orange-50/30 text-orange-700">{r.transfer_out_qty > 0 ? `-${r.transfer_out_qty}` : '-'}</Table.Cell>

                        <Table.Cell className="text-right font-medium bg-purple-50/30 text-purple-700">
                          {r.adjustment_qty !== 0 ? (r.adjustment_qty > 0 ? `+${r.adjustment_qty}` : r.adjustment_qty) : (r.return_qty > 0 ? `+${r.return_qty} (R)` : '-')}
                        </Table.Cell>

                        <Table.Cell className="text-right font-bold bg-indigo-50/50 text-indigo-950">{r.closing_qty.toLocaleString()}</Table.Cell>
                        <Table.Cell className="text-right font-bold bg-indigo-50/50 text-indigo-900">{formatCurrency(r.closing_value)}</Table.Cell>
                      </Table.Row>
                    ))}

                    {/* Totals Summary Row */}
                    <Table.Row className="bg-slate-900 text-white font-bold text-xs">
                      <Table.Cell colSpan={4} className="text-right uppercase tracking-wider py-3">Jumlah Keseluruhan:</Table.Cell>

                      <Table.Cell className="text-right">{totals.openingQty.toLocaleString()}</Table.Cell>
                      <Table.Cell className="text-right text-slate-200">{formatCurrency(totals.openingValue)}</Table.Cell>

                      <Table.Cell className="text-right text-emerald-300">+{totals.receiptQty.toLocaleString()}</Table.Cell>
                      <Table.Cell className="text-right text-emerald-300">{formatCurrency(totals.receiptValue)}</Table.Cell>

                      <Table.Cell className="text-right text-sky-300">+{totals.transferInQty.toLocaleString()}</Table.Cell>

                      <Table.Cell className="text-right text-amber-300">-{totals.issueQty.toLocaleString()}</Table.Cell>
                      <Table.Cell className="text-right text-amber-300">{formatCurrency(totals.issueValue)}</Table.Cell>

                      <Table.Cell className="text-right text-orange-300">-{totals.transferOutQty.toLocaleString()}</Table.Cell>

                      <Table.Cell className="text-right text-purple-300">{totals.adjustmentQty >= 0 ? `+${totals.adjustmentQty}` : totals.adjustmentQty}</Table.Cell>

                      <Table.Cell className="text-right text-indigo-200">{totals.closingQty.toLocaleString()}</Table.Cell>
                      <Table.Cell className="text-right text-indigo-200">{formatCurrency(totals.closingValue)}</Table.Cell>
                    </Table.Row>
                  </>
                )}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryReportPage
