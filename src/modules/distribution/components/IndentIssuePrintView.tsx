import React, { useEffect, useState } from 'react'
import { X, Printer, Loader2, FileText, CheckCircle2, User, Building2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/services/supabase'
import {
  getIndentRequestById,
  getIndentItemsStockAvailability,
  getSkuUnit,
  type ItemStoreStockInfo,
} from '@/modules/distribution/services/indentService'
import type { IndentRequestWithRelations } from '@/types/pharmacy'
import { useAuthStore } from '@/stores/authStore'

interface IndentIssuePrintViewProps {
  requestId: string | null
  isOpen: boolean
  onClose: () => void
}

export const IndentIssuePrintView: React.FC<IndentIssuePrintViewProps> = ({
  requestId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'

  const [request, setRequest] = useState<IndentRequestWithRelations | null>(null)
  const [stockInfoMap, setStockInfoMap] = useState<Record<string, ItemStoreStockInfo>>({})
  const [hospitalUsers, setHospitalUsers] = useState<{ id: string; full_name: string; jawatan?: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Signatures / Personnel Customization
  const [pemohonName, setPemohonName] = useState('')
  const [pemohonPosition, setPemohonPosition] = useState('')

  const [pelulusName, setPelulusName] = useState('')
  const [pelulusPosition, setPelulusPosition] = useState('')

  const [pengeluarName, setPengeluarName] = useState('')
  const [pengeluarPosition, setPengeluarPosition] = useState('')

  const [penerimaName, setPenerimaName] = useState('')
  const [penerimaPosition, setPenerimaPosition] = useState('')

  useEffect(() => {
    if (isOpen && requestId) {
      void loadRequestData()
    }
  }, [isOpen, requestId])

  const fetchHospitalUsers = async (hospId: string) => {
    try {
      const { data, error: uErr } = await supabase
        .from('users')
        .select('id, full_name, jawatan')
        .eq('hospital_id', hospId)
        .order('full_name')

      if (!uErr && data && data.length > 0) {
        setHospitalUsers(data)
        return data
      }
    } catch (err) {
      console.warn('Could not fetch hospital users:', err)
    }
    return []
  }

  const loadRequestData = async () => {
    if (!requestId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getIndentRequestById(requestId)
      if (res.error) throw new Error(res.error)
      const data = res.data
      setRequest(data)

      if (data) {
        // Hydrate default signatures
        setPemohonName(data.requester?.full_name || 'Jururawat / Pegawai Perubatan')
        setPemohonPosition('Pegawai Pemohon Wad')
        setPenerimaName('')
        setPenerimaPosition('Staf Penerima Wad')

        // Fetch hospital staff list for dropdown selector
        const usersList = await fetchHospitalUsers(data.hospital_id || hospitalId)

        // Auto-match Pelulus and automatic Jawatan
        const matchedPelulus =
          usersList.find((u) => u.full_name === data.approver?.full_name || u.id === data.approved_by) ||
          usersList.find((u) => u.full_name === user?.full_name || u.id === user?.id) ||
          usersList[0]

        if (matchedPelulus) {
          setPelulusName(matchedPelulus.full_name)
          setPelulusPosition(matchedPelulus.jawatan || 'Pegawai Farmasi')
        } else {
          setPelulusName(data.approver?.full_name || user?.full_name || '')
          setPelulusPosition((user as any)?.jawatan || 'Pegawai Farmasi')
        }

        // Auto-match Pengeluar and automatic Jawatan
        const matchedPengeluar =
          usersList.find((u) => u.full_name === user?.full_name || u.id === user?.id) ||
          usersList.find((u) => u.full_name !== (matchedPelulus?.full_name)) ||
          matchedPelulus

        if (matchedPengeluar) {
          setPengeluarName(matchedPengeluar.full_name)
          setPengeluarPosition(matchedPengeluar.jawatan || 'Penolong Pegawai Farmasi')
        } else {
          setPengeluarName(user?.full_name || '')
          setPengeluarPosition((user as any)?.jawatan || 'Penolong Pegawai Farmasi')
        }

        // Fetch live item batches if available
        if (data.items && data.items.length > 0) {
          const stockRes = await getIndentItemsStockAvailability(hospitalId, data.items)
          if (stockRes.data) {
            setStockInfoMap(stockRes.data)
          }
        }
      }
    } catch (err) {
      console.error('Error loading indent print data:', err)
      setError(err instanceof Error ? err.message : 'Gagal memuatkan data dokumen indent.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    if (!request) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Sila benarkan pop-up browser untuk mencetak dokumen rasmi.')
      return
    }

    const logoUrl = window.location.origin + '/512px-Jata_MalaysiaV2.svg.png'
    const reqDate = new Date(request.request_date || request.created_at)
    const reqDateStr = reqDate.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const reqTimeStr = reqDate.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    const actionDate = request.updated_at ? new Date(request.updated_at) : reqDate
    const actionDateStr = actionDate.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    const issueDateStr = request.issued_at
      ? new Date(request.issued_at).toLocaleDateString('en-MY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''

    let statusLabel = 'DRAF'
    let statusColorStyle = 'color: #475569; background-color: #f1f5f9;'
    if (request.status === 'pending') {
      statusLabel = 'MENUNGGU KELULUSAN'
      statusColorStyle = 'color: #b45309; background-color: #fef3c7;'
    } else if (request.status === 'approved') {
      statusLabel = 'DILULUSKAN (READY TO ISSUE)'
      statusColorStyle = 'color: #0369a1; background-color: #e0f2fe;'
    } else if (request.status === 'rejected') {
      statusLabel = 'DITOLAK / REJECTED'
      statusColorStyle = 'color: #be123c; background-color: #ffe4e6;'
    } else if (request.status === 'issued') {
      statusLabel = 'TELAH DIKELUARKAN (ISSUED)'
      statusColorStyle = 'color: #0f766e; background-color: #ccfbf1;'
    } else if (request.status === 'completed') {
      statusLabel = 'SELESAI (COMPLETED)'
      statusColorStyle = 'color: #047857; background-color: #d1fae5;'
    }

    let rowsHtml = ''
    let renderedCount = 0
    let grandTotalVal = 0

    const formatMoney = (val: number, fallback = '—') => {
      if (!val || val <= 0) return fallback
      if (val.toFixed(3).endsWith('0')) {
        return val.toFixed(2)
      }
      return val.toFixed(3)
    }

    if (request.items && request.items.length > 0) {
      request.items.forEach((item, idx) => {
        const stockInfo = stockInfoMap[item.id]
        const availableStock = stockInfo?.available_stock ?? 0
        const batchNo =
          item.batch_number ||
          stockInfo?.primary_batch ||
          (stockInfo?.batches?.[0]?.batch_number ?? '—')
        const expiry =
          item.expiry_date ||
          stockInfo?.primary_expiry ||
          (stockInfo?.batches?.[0]?.expiry_date ?? '—')

        const requestedQty = item.qty_requested || 0
        const approvedQty =
          request.status === 'rejected'
            ? 0
            : item.qty_approved !== undefined
            ? item.qty_approved
            : requestedQty

        const issuedQty =
          request.status === 'rejected'
            ? 0
            : item.qty_issued !== undefined && item.qty_issued > 0
            ? item.qty_issued
            : approvedQty

        const rawUnit =
          stockInfo?.sku_unit ||
          stockInfo?.unit ||
          (item.unit && item.unit !== 'TAB/VIAL' && item.unit !== 'PCS/PKT' ? item.unit : '')

        const displaySku = getSkuUnit(stockInfo?.packaging || rawUnit, rawUnit)

        const formatQtyWithSku = (qty: number, sku: string) => {
          const lower = sku.toLowerCase()
          if (
            lower.includes('bottle') ||
            lower.includes('tube') ||
            lower.includes('vial') ||
            lower.includes('ampoule') ||
            lower.includes('syringe') ||
            lower.includes('pack') ||
            lower.includes('bag') ||
            lower.includes('box') ||
            lower.includes('can')
          ) {
            return `${qty} x ${sku}`
          }
          return `${qty} ${sku}`
        }

        const balanceStockNum =
          request.status === 'rejected'
            ? availableStock
            : Math.max(0, availableStock - issuedQty)

        const unitPriceVal = Number(stockInfo?.unit_price ?? (item as any).unit_price ?? 0)
        const lineTotalVal = issuedQty * unitPriceVal
        grandTotalVal += lineTotalVal

        const qtyReqStr = formatQtyWithSku(requestedQty, displaySku)
        const qtyApprStr = formatQtyWithSku(approvedQty, displaySku)
        const qtyIssStr = formatQtyWithSku(issuedQty, displaySku)
        const balanceStoreStr = formatQtyWithSku(balanceStockNum, displaySku)

        const packagingDesc = stockInfo?.packaging || (item as any).packaging || '—'

        rowsHtml += `
          <tr style="border-bottom: 1px solid black; font-size: 8px; height: 28px; text-align: center;">
            <!-- Bahagian A -->
            <td style="border-right: 1px solid black; padding: 2px;">${idx + 1}</td>
            <td style="border-right: 1px solid black; padding: 2px; font-family: monospace; font-weight: bold; text-align: center;">
              ${item.item_code || '—'}
            </td>
            <td style="border-right: 1px solid black; padding: 2px 5px; text-align: left; font-weight: 600; line-height: 1.25;">
              ${item.item_name}
            </td>
            <td style="border-right: 1px solid black; padding: 2px 4px; font-weight: 600; font-size: 7.5px; line-height: 1.2;">
              ${packagingDesc}
            </td>
            <td style="border-right: 1px solid black; padding: 2px; font-weight: bold;">
              ${qtyReqStr}
            </td>
            <td style="border-right: 1px solid black; padding: 2px; font-family: monospace; font-size: 7.5px;">
              ${batchNo}
            </td>
            <td style="border-right: 1.5px solid black; padding: 2px; font-size: 7.5px; white-space: nowrap;">
              ${expiry}
            </td>

            <!-- Bahagian B -->
            <td style="border-right: 1px solid black; padding: 2px; font-weight: bold; color: #047857;">
              ${qtyApprStr}
            </td>
            <td style="border-right: 1px solid black; padding: 2px; font-weight: bold; color: #0f766e;">
              ${qtyIssStr}
            </td>
            <td style="border-right: 1px solid black; padding: 2px 4px; text-align: right; font-family: monospace; font-weight: 600; font-size: 8px;">
              ${formatMoney(unitPriceVal)}
            </td>
            <td style="border-right: 1.5px solid black; padding: 2px 4px; text-align: right; font-family: monospace; font-weight: bold; font-size: 8px; color: #0f766e;">
              ${formatMoney(lineTotalVal)}
            </td>

            <!-- Bahagian C -->
            <td style="border-right: 1px solid black; padding: 2px; font-weight: bold; color: #1e293b;">
              ${balanceStoreStr}
            </td>
            <td style="border-right: 1px solid black; padding: 2px; font-family: monospace; font-weight: 600; font-size: 7.5px;">
              ${batchNo}
            </td>
            <td style="padding: 2px; font-weight: 600; font-size: 7.5px; white-space: nowrap;">
              ${expiry}
            </td>
          </tr>
        `
        renderedCount++
      })
    }

    // Pad blank rows for neat A4 standard voucher height
    const targetMinRows = Math.max(5, renderedCount)
    while (renderedCount < targetMinRows) {
      rowsHtml += `
        <tr style="border-bottom: 1px solid black; height: 26px;">
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1.5px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1.5px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td></td>
        </tr>
      `
      renderedCount++
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Borang Pesanan & Pengeluaran Stok Farmasi - ${request.indent_number}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 5mm;
            }
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: black; 
              font-size: 9px;
              background-color: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; box-sizing: border-box; padding: 4px;">
            <!-- Official Header -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
              <tr>
                <td style="width: 75px; vertical-align: top;">
                  <img src="${logoUrl}" alt="Jata Malaysia" style="width: 62px; height: auto;" />
                </td>
                <td style="vertical-align: top; padding-left: 8px;">
                  <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    KEMENTERIAN KESIHATAN MALAYSIA
                  </div>
                  <div style="font-size: 13px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px;">
                    HOSPITAL LAWAS
                  </div>
                  <div style="font-size: 8px; font-weight: 500; color: #475569; line-height: 1.3;">
                    Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.<br/>
                    <strong style="color: #334155;">Telefon:</strong> 085-283781 &bull; <strong style="color: #334155;">Faks:</strong> 085-285993
                  </div>
                </td>
                <td style="width: 250px; text-align: right; vertical-align: top;">
                  <div style="font-size: 8px; font-weight: bold; margin-bottom: 3px; color: #475569;">SALINAN WAD / STOR FARMASI</div>
                  <table style="border: 1.5px solid black; border-collapse: collapse; width: 100%; font-size: 8px;">
                    <tr>
                      <td style="padding: 2px 4px; font-weight: bold; background-color: #f1f5f9; border-bottom: 1px solid black; border-right: 1px solid black;">NO. INDENT</td>
                      <td style="padding: 2px 4px; font-weight: 800; border-bottom: 1px solid black; text-align: center;">${request.indent_number}</td>
                    </tr>
                    <tr>
                      <td style="padding: 2px 4px; font-weight: bold; background-color: #f1f5f9; border-bottom: 1px solid black; border-right: 1px solid black;">TARIKH</td>
                      <td style="padding: 2px 4px; font-weight: 600; border-bottom: 1px solid black; text-align: center;">${reqDateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 2px 4px; font-weight: bold; background-color: #f1f5f9; border-right: 1px solid black;">STATUS</td>
                      <td style="padding: 2px 4px; font-weight: 800; text-align: center; ${statusColorStyle}">${statusLabel}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Document Title -->
            <div style="border-top: 2px solid black; border-bottom: 1.5px solid black; padding: 5px 0; margin-bottom: 10px; text-align: center; background-color: #f8fafc;">
              <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a;">
                BORANG PESANAN DAN PENGELUARAN STOK FARMASI (INDENT WAD / UNIT)
              </div>
              <div style="font-size: 8px; font-weight: 600; color: #475569; margin-top: 1px;">
                (Tatacara Pengurusan Stor Kerajaan Farmasi & Perbekalan Kesihatan)
              </div>
            </div>

            <!-- Requester and Supplying Store Box -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid black;">
              <tr>
                <td style="width: 50%; padding: 6px 8px; border-right: 1px solid black; vertical-align: top; background-color: #fafafa;">
                  <div style="font-weight: 800; color: #475569; font-size: 7.5px; text-transform: uppercase; margin-bottom: 2px;">
                    DARI: UNIT / WAD PEMOHON (REQUESTING UNIT)
                  </div>
                  <div style="font-size: 10.5px; font-weight: 800; color: #0f172a;">
                    ${(request.requesting_department?.department_name || 'Nephrology Department').toUpperCase()}
                  </div>
                  <div style="font-size: 8.5px; color: #334155; margin-top: 2px;">
                    <strong>Pegawai Pemohon:</strong> ${pemohonName} ${pemohonPosition ? `(${pemohonPosition})` : ''}
                  </div>
                </td>
                <td style="width: 50%; padding: 6px 8px; vertical-align: top;">
                  <div style="font-weight: 800; color: #475569; font-size: 7.5px; text-transform: uppercase; margin-bottom: 2px;">
                    KEPADA: CAWANGAN / STOR PENGELUAR (ISSUING DEPARTMENT)
                  </div>
                  <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                    ${request.fulfilling_department?.department_name ? `${request.fulfilling_department.department_name.toUpperCase()} HOSPITAL LAWAS` : 'STOR UTAMA FARMASI'}
                  </div>
                  <div style="font-size: 8.5px; color: #334155; margin-top: 2px;">
                    <strong>Pegawai Pelulus:</strong> ${pelulusName} ${pelulusPosition ? `(${pelulusPosition})` : ''}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Line Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid black;">
              <thead>
                <tr style="background-color: #e2e8f0; font-size: 7.5px; font-weight: 800; text-align: center; border-bottom: 1px solid black; height: 18px;">
                  <th colspan="7" style="border-right: 1.5px solid black; text-transform: uppercase; letter-spacing: 0.3px; padding: 2px;">
                    BAHAGIAN A: DILENGKAPKAN OLEH PEMESAN (REQUESTER)
                  </th>
                  <th colspan="4" style="border-right: 1.5px solid black; text-transform: uppercase; letter-spacing: 0.3px; padding: 2px;">
                    BAHAGIAN B: DILENGKAPKAN OLEH STOR FARMASI (KELULUSAN)
                  </th>
                  <th colspan="3" style="text-transform: uppercase; letter-spacing: 0.3px; padding: 2px;">
                    BAHAGIAN C: DILENGKAPKAN OLEH BAHAGIAN KAWALAN DAN PENGELUARAN STOR
                  </th>
                </tr>
                <tr style="background-color: #f1f5f9; font-size: 7px; font-weight: 800; text-align: center; border-bottom: 1.5px solid black; height: 22px;">
                  <!-- Bahagian A -->
                  <th style="border-right: 1px solid black; width: 3%;">BIL</th>
                  <th style="border-right: 1px solid black; width: 7.5%;">KOD ITEM</th>
                  <th style="border-right: 1px solid black; width: 18.5%; text-align: left; padding-left: 5px;">PERIHAL STOK & SPESIFIKASI</th>
                  <th style="border-right: 1px solid black; width: 8.5%;">PEMBUNGKUSAN (PACKAGING)</th>
                  <th style="border-right: 1px solid black; width: 6.5%;">KUANTITI DIPESAN</th>
                  <th style="border-right: 1px solid black; width: 6.5%;">NO. BATCH</th>
                  <th style="border-right: 1.5px solid black; width: 6.5%;">TARIKH LUPUT</th>

                  <!-- Bahagian B -->
                  <th style="border-right: 1px solid black; width: 6.5%;">KUANTITI DILULUSKAN</th>
                  <th style="border-right: 1px solid black; width: 6.5%;">KUANTITI DIKELUARKAN</th>
                  <th style="border-right: 1px solid black; width: 6%;">HARGA SEUNIT (RM)</th>
                  <th style="border-right: 1.5px solid black; width: 6%;">JUMLAH (RM)</th>

                  <!-- Bahagian C -->
                  <th style="border-right: 1px solid black; width: 6%;">BAKI KUANTITI STOR</th>
                  <th style="border-right: 1px solid black; width: 6%;">NO. BATCH</th>
                  <th style="width: 6%;">TARIKH LUPUT</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <!-- Total Price Row -->
                <tr style="background-color: #f8fafc; font-size: 8px; font-weight: 800; border-top: 1.5px solid black; height: 26px;">
                  <td colspan="10" style="border-right: 1px solid black; padding: 4px 8px; text-align: right; text-transform: uppercase; letter-spacing: 0.3px; color: #0f172a;">
                    JUMLAH KESELURUHAN (TOTAL AMOUNT RM):
                  </td>
                  <td style="border-right: 1.5px solid black; padding: 4px 4px; text-align: right; font-weight: 800; font-family: monospace; font-size: 8.5px; color: #047857;">
                    ${formatMoney(grandTotalVal, '0.00')}
                  </td>
                  <td colspan="3" style="background-color: #f8fafc;"></td>
                </tr>
              </tbody>
            </table>

            <!-- 4 Signatures Blocks (Malaysian Govt Standard Format) -->
            <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 8px;">
              <tr>
                <td style="width: 25%; padding: 5px; border-right: 1px solid black; vertical-align: top;">
                  <div style="font-weight: 800; font-size: 7.5px; color: #475569; text-transform: uppercase; margin-bottom: 2px;">
                    1. DIPERAKUKAN OLEH
                  </div>
                  <div style="font-size: 7px; color: #64748b; margin-bottom: 20px;">(Pegawai Pemohon Wad)</div>
                  <div style="border-bottom: 1px dotted black; margin-bottom: 3px;"></div>
                  <div><strong>Nama:</strong> ${pemohonName}</div>
                  <div><strong>Jawatan:</strong> ${pemohonPosition}</div>
                  <div><strong>Tarikh:</strong> ${reqDateStr}</div>
                </td>
                <!-- 2. Pelulus -->
                <td style="width: 25%; padding: 5px; border-right: 1px solid black; vertical-align: top;">
                  <div style="font-weight: 800; font-size: 7.5px; color: #475569; text-transform: uppercase; margin-bottom: 2px;">
                    2. DILULUSKAN / DISEMAK
                  </div>
                  <div style="font-size: 7px; color: #64748b; margin-bottom: 20px;">(Pegawai Farmasi Stor)</div>
                  <div style="border-bottom: 1px dotted black; margin-bottom: 3px;"></div>
                  <div><strong>Nama:</strong> ${pelulusName}</div>
                  <div><strong>Jawatan:</strong> ${pelulusPosition}</div>
                  <div><strong>Tarikh:</strong> ${actionDateStr}</div>
                </td>
                <!-- 3. Pengeluar -->
                <td style="width: 25%; padding: 5px; border-right: 1px solid black; vertical-align: top;">
                  <div style="font-weight: 800; font-size: 7.5px; color: #475569; text-transform: uppercase; margin-bottom: 2px;">
                    3. DIKELUARKAN OLEH
                  </div>
                  <div style="font-size: 7px; color: #64748b; margin-bottom: 20px;">(Kaunter Pengeluaran Farmasi)</div>
                  <div style="border-bottom: 1px dotted black; margin-bottom: 3px;"></div>
                  <div><strong>Nama:</strong> ${pengeluarName}</div>
                  <div><strong>Jawatan:</strong> ${pengeluarPosition}</div>
                  <div><strong>Tarikh:</strong> ${issueDateStr || '_________________'}</div>
                </td>
                <!-- 4. Penerima -->
                <td style="width: 25%; padding: 5px; vertical-align: top;">
                  <div style="font-weight: 800; font-size: 7.5px; color: #475569; text-transform: uppercase; margin-bottom: 2px;">
                    4. DITERIMA OLEH
                  </div>
                  <div style="font-size: 7px; color: #64748b; margin-bottom: 20px;">(Pegawai / Staf Wad Penerima)</div>
                  <div style="border-bottom: 1px dotted black; margin-bottom: 3px;"></div>
                  <div><strong>Nama:</strong> ${penerimaName || '____________________'}</div>
                  <div><strong>Jawatan:</strong> ${penerimaPosition || '____________________'}</div>
                  <div><strong>Tarikh:</strong> ${issueDateStr || '____________________'}</div>
                </td>
              </tr>
            </table>

            <div style="margin-top: 8px; font-size: 7px; color: #64748b; display: flex; justify-content: space-between;">
              <span>Sistem Pengurusan Operasi Hospital (HOMES) &bull; Hospital Lawas</span>
              <span>Dokumen ini dijana secara digital &bull; Tarikh Cetakan: ${new Date().toLocaleDateString('en-MY')} ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Cetak Borang Pesanan & Pengeluaran Stok Farmasi (KEW.PS-11)
              </h2>
              <p className="text-[11px] text-slate-400">
                Format Standard Kerajaan Malaysia &bull; Hospital Lawas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Memuatkan butiran dokumen indent...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          ) : request ? (
            <div className="space-y-6">
              {/* Document Overview Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">No. Indent</span>
                    <p className="font-mono text-base font-bold text-emerald-400">{request.indent_number}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Wad / Unit Pemohon (Dari)</span>
                    <p className="text-xs font-bold text-slate-200">
                      {request.requesting_department?.department_name || 'Nephrology'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Unit / Stor Penerima (Kepada)</span>
                    <p className="text-xs font-bold text-emerald-300">
                      {request.fulfilling_department?.department_name || 'Pharmacy logistic'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Status</span>
                    <p className="text-xs font-bold uppercase text-slate-200">{request.status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Jumlah Item</span>
                    <p className="text-xs font-bold text-slate-200">{request.items?.length || 0} Baris</p>
                  </div>
                </div>
              </div>

              {/* Personnel / Signatures Customization */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Pengesahan Pegawai Stor Farmasi
                  </h3>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Pilih nama staf bertugas dari menu dropdown
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Pelulus */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 block">
                        1. Pegawai Pelulus (Farmasi Stor)
                      </span>
                      <span className="text-[9px] uppercase font-bold text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Bahagian B & Perakuan
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1.5">
                        Pilih Nama Pegawai Pelulus:
                      </label>
                      <select
                        value={pelulusName}
                        onChange={(e) => {
                          const val = e.target.value
                          setPelulusName(val)
                          const match = hospitalUsers.find((u) => u.full_name === val)
                          setPelulusPosition(match?.jawatan || 'Pegawai Farmasi')
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">-- Pilih Pegawai Pelulus --</option>
                        {hospitalUsers.map((u) => (
                          <option key={u.id} value={u.full_name}>
                            {u.full_name} {u.jawatan ? `(${u.jawatan})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Jawatan Pegawai (Auto)</label>
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                        <span>{pelulusPosition || 'Tiada maklumat jawatan'}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          Auto
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pengeluar */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400 block">
                        2. Pegawai Pengeluar (Kaunter Farmasi)
                      </span>
                      <span className="text-[9px] uppercase font-bold text-teal-400/80 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                        Bahagian C & Pengeluaran
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1.5">
                        Pilih Nama Pegawai Pengeluar:
                      </label>
                      <select
                        value={pengeluarName}
                        onChange={(e) => {
                          const val = e.target.value
                          setPengeluarName(val)
                          const match = hospitalUsers.find((u) => u.full_name === val)
                          setPengeluarPosition(match?.jawatan || 'Penolong Pegawai Farmasi')
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                      >
                        <option value="">-- Pilih Pegawai Pengeluar --</option>
                        {hospitalUsers.map((u) => (
                          <option key={u.id} value={u.full_name}>
                            {u.full_name} {u.jawatan ? `(${u.jawatan})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Jawatan Pegawai (Auto)</label>
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-teal-300 flex items-center justify-between">
                        <span>{pengeluarPosition || 'Tiada maklumat jawatan'}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          Auto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 text-xs">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !request}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Buka Cetakan & Sedia Cetak
          </Button>
        </div>
      </div>
    </div>
  )
}
