/**
 * Facility Inventory Excel Export Service
 * Generates structured, multi-sheet Excel (.xlsx) workbooks for Facility Non-Drug and Drug Inventories.
 * Includes official MOH/KKM header metadata, inventory table rows, and analytical summary sheets.
 */

import * as XLSX from 'xlsx'
import { getDrugTherapeuticCategory, getDrugPrescriberCategory } from '@/lib/drugCategorizer'
import type { FacilityNonDrugItem } from '@/services/pharmacy/facilityNonDrugInventoryService'
import type { FacilityDrugItem } from '@/services/pharmacy/facilityDrugInventoryService'

export interface FacilityInventoryExcelOptions {
  hospitalName?: string
  departmentName?: string
  skim?: string
  generatedBy?: string
  generatedByTitle?: string
  filename?: string
}

/**
 * Calculates optimal column widths for an XLSX worksheet
 */
function setAutoColumnWidths(ws: XLSX.WorkSheet, data: any[][]) {
  const colWidths: number[] = []

  data.forEach(row => {
    if (!Array.isArray(row)) return
    row.forEach((val, colIdx) => {
      const cellStr = val !== null && val !== undefined ? String(val) : ''
      // Ignore long title lines in header
      if (cellStr.length > 80) return
      const currentWidth = colWidths[colIdx] || 10
      colWidths[colIdx] = Math.max(currentWidth, Math.min(cellStr.length + 3, 50))
    })
  })

  ws['!cols'] = colWidths.map(wch => ({ wch }))
}

/**
 * Formats date into DD/MM/YYYY
 */
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Export Facility Non-Drug Inventory to Excel (.xlsx)
 */
export function exportFacilityNonDrugInventoryToExcel(
  items: FacilityNonDrugItem[],
  options: FacilityInventoryExcelOptions = {}
): void {
  const {
    hospitalName = 'HOSPITAL LAWAS',
    departmentName = 'Stor Integrasi Bukan Ubat',
    skim = 'SEMUA SKIM',
    generatedBy = 'Penyelia Stor',
    generatedByTitle = 'Penyelia Stor / Pegawai Farmasi',
    filename,
  } = options

  const now = new Date()
  const dateStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })

  const totalStockUnits = items.reduce((acc, item) => acc + (Number(item.facility_stock) || 0), 0)
  const totalValuation = items.reduce((acc, item) => {
    const price = Number(item.price ?? (item as any).unit_price ?? 0)
    const stock = Number(item.facility_stock ?? 0)
    return acc + price * stock
  }, 0)

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: Master Inventory Table
  // ───────────────────────────────────────────────────────────────────────────
  const masterRows: any[][] = [
    ['KERAJAAN MALAYSIA - KEMENTERIAN KESIHATAN MALAYSIA'],
    [`${hospitalName.toUpperCase()}, SARAWAK`],
    [`SENARAI INVENTORI BUKAN UBAT FASILITI - ${skim.toUpperCase()}`],
    ['Jabatan / Stor:', departmentName, '', 'Status Dokumen:', 'RASMI / SULIT'],
    ['Tarikh Dijana:', `${dateStr} ${timeStr}`, '', 'Disediakan Oleh:', `${generatedBy} (${generatedByTitle})`],
    ['Jumlah Item:', items.length, '', 'Jumlah Stok (Unit):', totalStockUnits, '', 'Jumlah Nilai Stok (RM):', Number(totalValuation.toFixed(2))],
    [], // Blank separator row
    [
      'BIL.',
      'KOD BUKAN UBAT',
      'NAMA BUKAN UBAT',
      'KATEGORI',
      'SKIM PEROLEHAN',
      'UOM',
      'PEMBUNGKUSAN',
      'STOK FASILITI',
      'PARAS MINIMA',
      'PARAS MAKSIMA',
      'PARAS PENIMBAL',
      'NO. BATCH',
      'TARIKH LUPUT',
      'HARGA SEUNIT (RM)',
      'JUMLAH NILAI (RM)',
      'LOKASI STOR / RAK',
      'PEMBEKAL',
      'NO. KONTRAK',
      'MULA KONTRAK',
      'TAMAT KONTRAK',
      'STATUS',
      'CATATAN'
    ]
  ]

  items.forEach((item, index) => {
    const code = item.item_code || item.sku || '-'
    const name = item.item_name || '-'
    const category = item.category?.category_name || (item as any).category_name || 'General'
    const vote = (item.procurement_vote || 'appl').toUpperCase()
    const uom = item.unit_of_measure || (item as any).uom || 'PACK'
    const packaging = item.packaging_description || '-'
    const stock = Number(item.facility_stock) || 0
    const minLevel = Number(item.min_stock_level) || 0
    const maxLevel = Number(item.max_stock_level) || 0
    const bufferLevel = Number(item.min_buffer_level) || 0
    const batchNo = item.batch_number || (item as any).batch_no || '-'
    const expDate = formatDisplayDate(item.expiry_date || (item as any).exp_date)
    const price = Number(item.price ?? (item as any).unit_price ?? 0)
    const lineTotal = Number((price * stock).toFixed(2))
    
    // Store location
    let locationStr = item.location || '-'
    if (locationStr === '-' && (item.store_code || item.rack_name)) {
      locationStr = [item.store_code, item.rack_name, item.level_name].filter(Boolean).join(' / ')
    }

    const supplier = item.supplier?.supplier_name || item.cc_supplier_name || (item as any).supplier_name || '-'
    const contractNo = item.cc_contract_number || (item as any).kkm_contract_number || (item as any).contract_number || '-'
    const contractStart = formatDisplayDate(item.cc_contract_start_date)
    const contractEnd = formatDisplayDate(item.cc_contract_end_date)
    const status = item.is_active !== false ? 'Aktif' : 'Tidak Aktif'
    const notes = item.notes || ''

    masterRows.push([
      index + 1,
      code,
      name,
      category,
      vote,
      uom,
      packaging,
      stock,
      minLevel,
      maxLevel,
      bufferLevel,
      batchNo,
      expDate,
      price,
      lineTotal,
      locationStr,
      supplier,
      contractNo,
      contractStart,
      contractEnd,
      status,
      notes
    ])
  })

  // Summary Row at the bottom
  masterRows.push([
    'JUMLAH KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    '',
    totalStockUnits,
    '',
    '',
    '',
    '',
    '',
    '',
    Number(totalValuation.toFixed(2)),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: Ringkasan Mengikut Skim
  // ───────────────────────────────────────────────────────────────────────────
  const votes = ['APPL', 'CC', 'LP', 'DP']
  const skimRows: any[][] = [
    ['RINGKASAN INVENTORI BUKAN UBAT MENGIKUT SKIM PEROLEHAN'],
    [`Hospital: ${hospitalName} | Tarikh: ${dateStr}`],
    [],
    ['SKIM PEROLEHAN', 'JUMLAH ITEM', 'JUMLAH KUANTITI STOK', 'JUMLAH NILAI (RM)', 'PERATUS NILAI (%)']
  ]

  votes.forEach(v => {
    const vItems = items.filter(i => (i.procurement_vote || 'appl').toUpperCase() === v)
    const count = vItems.length
    const stock = vItems.reduce((acc, i) => acc + (Number(i.facility_stock) || 0), 0)
    const val = vItems.reduce((acc, i) => {
      const p = Number(i.price ?? (i as any).unit_price ?? 0)
      const s = Number(i.facility_stock ?? 0)
      return acc + p * s
    }, 0)
    const pct = totalValuation > 0 ? ((val / totalValuation) * 100).toFixed(1) + '%' : '0.0%'

    skimRows.push([v, count, stock, Number(val.toFixed(2)), pct])
  })

  skimRows.push([
    'JUMLAH KESELURUHAN',
    items.length,
    totalStockUnits,
    Number(totalValuation.toFixed(2)),
    '100.0%'
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 3: Ringkasan Mengikut Kategori
  // ───────────────────────────────────────────────────────────────────────────
  const catMap = new Map<string, { count: number; stock: number; value: number }>()
  items.forEach(item => {
    const cat = item.category?.category_name || (item as any).category_name || 'General'
    const stock = Number(item.facility_stock) || 0
    const price = Number(item.price ?? (item as any).unit_price ?? 0)
    const val = price * stock

    const current = catMap.get(cat) || { count: 0, stock: 0, value: 0 }
    catMap.set(cat, {
      count: current.count + 1,
      stock: current.stock + stock,
      value: current.value + val,
    })
  })

  const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1].value - a[1].value)

  const catRows: any[][] = [
    ['RINGKASAN INVENTORI BUKAN UBAT MENGIKUT KATEGORI'],
    [`Hospital: ${hospitalName} | Tarikh: ${dateStr}`],
    [],
    ['KATEGORI BUKAN UBAT', 'JUMLAH ITEM', 'JUMLAH KUANTITI STOK', 'JUMLAH NILAI (RM)', 'PERATUS NILAI (%)']
  ]

  sortedCats.forEach(([catName, stats]) => {
    const pct = totalValuation > 0 ? ((stats.value / totalValuation) * 100).toFixed(1) + '%' : '0.0%'
    catRows.push([
      catName,
      stats.count,
      stats.stock,
      Number(stats.value.toFixed(2)),
      pct
    ])
  })

  catRows.push([
    'JUMLAH KESELURUHAN',
    items.length,
    totalStockUnits,
    Number(totalValuation.toFixed(2)),
    '100.0%'
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // Assemble Workbook & Download
  // ───────────────────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows)
  setAutoColumnWidths(wsMaster, masterRows)
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Inventori Bukan Ubat')

  const wsSkim = XLSX.utils.aoa_to_sheet(skimRows)
  setAutoColumnWidths(wsSkim, skimRows)
  XLSX.utils.book_append_sheet(wb, wsSkim, 'Ringkasan Skim')

  const wsCat = XLSX.utils.aoa_to_sheet(catRows)
  setAutoColumnWidths(wsCat, catRows)
  XLSX.utils.book_append_sheet(wb, wsCat, 'Ringkasan Kategori')

  const dateSlug = now.toISOString().split('T')[0]
  const skimSlug = skim.toLowerCase().replace(/\s+/g, '_')
  const defaultFilename = `Inventori_Bukan_Ubat_${skimSlug}_${dateSlug}.xlsx`

  XLSX.writeFile(wb, filename || defaultFilename)
}

/**
 * Export Facility Drug Inventory to Excel (.xlsx)
 */
export function exportFacilityDrugInventoryToExcel(
  items: FacilityDrugItem[],
  options: FacilityInventoryExcelOptions = {}
): void {
  const {
    hospitalName = 'HOSPITAL LAWAS',
    departmentName = 'Jabatan Farmasi / Stor Utama',
    skim = 'SEMUA SKIM',
    generatedBy = 'Pegawai Farmasi',
    generatedByTitle = 'Pegawai Farmasi (S41/S44/S48)',
    filename,
  } = options

  const now = new Date()
  const dateStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })

  const totalStockUnits = items.reduce((acc, item) => acc + (Number(item.facility_stock) || 0), 0)
  const totalValuation = items.reduce((acc, item) => {
    const price = Number(item.price ?? (item as any).unit_price ?? 0)
    const stock = Number(item.facility_stock ?? 0)
    return acc + price * stock
  }, 0)

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: Master Drug Inventory Table
  // ───────────────────────────────────────────────────────────────────────────
  const masterRows: any[][] = [
    ['KERAJAAN MALAYSIA - KEMENTERIAN KESIHATAN MALAYSIA'],
    [`${hospitalName.toUpperCase()}, SARAWAK`],
    [`SENARAI FORMULARI & INVENTORI UBAT FASILITI - ${skim.toUpperCase()}`],
    ['Jabatan / Stor:', departmentName, '', 'Status Dokumen:', 'RASMI / SULIT'],
    ['Tarikh Dijana:', `${dateStr} ${timeStr}`, '', 'Disediakan Oleh:', `${generatedBy} (${generatedByTitle})`],
    ['Jumlah Item:', items.length, '', 'Jumlah Stok (Unit):', totalStockUnits, '', 'Jumlah Nilai Stok (RM):', Number(totalValuation.toFixed(2))],
    [],
    [
      'BIL.',
      'KOD UBAT',
      'NAMA UBAT',
      'NAMA GENERIK',
      'BENTUK DOSAJ',
      'KEKUATAN',
      'UOM',
      'PEMBUNGKUSAN',
      'KATEGORI TERAPEUTIK',
      'KAT. PRESKRIPSI',
      'SKIM PEROLEHAN',
      'STOK FASILITI',
      'PARAS MINIMA',
      'PARAS MAKSIMA',
      'PARAS PENIMBAL',
      'NO. BATCH',
      'TARIKH LUPUT',
      'HARGA SEUNIT (RM)',
      'JUMLAH NILAI (RM)',
      'LOKASI STOR',
      'STATUS',
      'CATATAN'
    ]
  ]

  items.forEach((item, index) => {
    const code = item.drug_code || item.item_code || item.sku || '-'
    const name = item.drug_name || item.item_name || '-'
    const generic = item.generic_name || '-'
    const form = item.dosage_form || '-'
    const strength = item.strength || '-'
    const uom = item.unit_of_measure || item.uom || '-'
    const packaging = item.packaging_description || '-'
    const therapCat = getDrugTherapeuticCategory(item)
    const prescriberCat = getDrugPrescriberCategory(item)
    const vote = (item.procurement_vote || 'appl').toUpperCase()
    const stock = Number(item.facility_stock) || 0
    const minLevel = Number(item.min_stock_level) || 0
    const maxLevel = Number(item.max_stock_level) || 0
    const bufferLevel = Number(item.min_buffer_level) || 0
    const batchNo = item.batch_number || (item as any).batch_no || '-'
    const expDate = formatDisplayDate(item.expiry_date || (item as any).exp_date)
    const price = Number(item.price ?? (item as any).unit_price ?? 0)
    const lineTotal = Number((price * stock).toFixed(2))
    const locationStr = item.location || '-'
    const status = item.is_active !== false ? 'Aktif' : 'Tidak Aktif'
    const notes = (item as any).notes || ''

    masterRows.push([
      index + 1,
      code,
      name,
      generic,
      form,
      strength,
      uom,
      packaging,
      therapCat,
      prescriberCat,
      vote,
      stock,
      minLevel,
      maxLevel,
      bufferLevel,
      batchNo,
      expDate,
      price,
      lineTotal,
      locationStr,
      status,
      notes
    ])
  })

  masterRows.push([
    'JUMLAH KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalStockUnits,
    '',
    '',
    '',
    '',
    '',
    '',
    Number(totalValuation.toFixed(2)),
    '',
    '',
    ''
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: Ringkasan Mengikut Skim
  // ───────────────────────────────────────────────────────────────────────────
  const votes = ['APPL', 'CC', 'LP', 'DP']
  const skimRows: any[][] = [
    ['RINGKASAN FORMULARI UBAT MENGIKUT SKIM PEROLEHAN'],
    [`Hospital: ${hospitalName} | Tarikh: ${dateStr}`],
    [],
    ['SKIM PEROLEHAN', 'JUMLAH ITEM', 'JUMLAH KUANTITI STOK', 'JUMLAH NILAI (RM)', 'PERATUS NILAI (%)']
  ]

  votes.forEach(v => {
    const vItems = items.filter(i => (i.procurement_vote || 'appl').toUpperCase() === v)
    const count = vItems.length
    const stock = vItems.reduce((acc, i) => acc + (Number(i.facility_stock) || 0), 0)
    const val = vItems.reduce((acc, i) => {
      const p = Number(i.price ?? (i as any).unit_price ?? 0)
      const s = Number(i.facility_stock ?? 0)
      return acc + p * s
    }, 0)
    const pct = totalValuation > 0 ? ((val / totalValuation) * 100).toFixed(1) + '%' : '0.0%'

    skimRows.push([v, count, stock, Number(val.toFixed(2)), pct])
  })

  skimRows.push([
    'JUMLAH KESELURUHAN',
    items.length,
    totalStockUnits,
    Number(totalValuation.toFixed(2)),
    '100.0%'
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // Assemble Workbook & Download
  // ───────────────────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows)
  setAutoColumnWidths(wsMaster, masterRows)
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Inventori Ubat')

  const wsSkim = XLSX.utils.aoa_to_sheet(skimRows)
  setAutoColumnWidths(wsSkim, skimRows)
  XLSX.utils.book_append_sheet(wb, wsSkim, 'Ringkasan Skim')

  const dateSlug = now.toISOString().split('T')[0]
  const skimSlug = skim.toLowerCase().replace(/\s+/g, '_')
  const defaultFilename = `Inventori_Ubat_${skimSlug}_${dateSlug}.xlsx`

  XLSX.writeFile(wb, filename || defaultFilename)
}
