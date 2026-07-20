// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, FileText } from 'lucide-react';
import { getCylinderDispatchRequestById } from '@/services/pharmacy/cylinderDispatchService';
import type { CylinderDispatchRequestWithRelations } from '@/types/pharmacy';
import { supabase } from '@/services/supabase';

interface CylinderDispatchPrintViewProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CylinderDispatchPrintView: React.FC<CylinderDispatchPrintViewProps> = ({
  requestId,
  isOpen,
  onClose,
}) => {
  const [request, setRequest] = useState<CylinderDispatchRequestWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; full_name: string; jawatan?: string }[]>([]);

  // Signature States
  const [pemohonName, setPemohonName] = useState('');
  const [pemohonPosition, setPemohonPosition] = useState('');

  const [penerimaName, setPenerimaName] = useState('');
  const [penerimaPosition, setPenerimaPosition] = useState('');
  const [penerimaDate, setPenerimaDate] = useState('');

  const [pelulusName, setPelulusName] = useState('');
  const [pelulusPosition, setPelulusPosition] = useState('');

  const [direkodName, setDirekodName] = useState('');
  const [direkodPosition, setDirekodPosition] = useState('');

  useEffect(() => {
    if (isOpen && requestId) {
      loadRequestDetails();
    }
  }, [isOpen, requestId]);

  const loadRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCylinderDispatchRequestById(requestId);
      if (res.error) throw new Error(res.error);
      const data = res.data;
      setRequest(data);

      if (data) {
        const formattedDate = new Date(data.request_date).toLocaleDateString('en-GB');

        // Initialize Signature fields
        setPemohonName(data.requester?.full_name || data.remarks || '');
        setPemohonPosition(data.requester?.jawatan || '');

        setPenerimaName('');
        setPenerimaPosition('');
        setPenerimaDate(data.status === 'completed' || data.status === 'issued' ? formattedDate : '');

        setPelulusName(data.approver?.full_name || 'Saidin Bin Bakar');
        setPelulusPosition(data.approver?.jawatan || 'Pembantu Awam H11');

        setDirekodName(data.issuer?.full_name || 'Saidin Bin Bakar');
        setDirekodPosition(data.issuer?.jawatan || 'Pembantu Awam H11');

        // Fetch users from the same hospital
        await fetchHospitalUsers(data.hospital_id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuatkan butiran permohonan.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHospitalUsers = async (hospitalId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, jawatan')
        .eq('hospital_id', hospitalId)
        .order('full_name');
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err) {
      console.error('Error fetching hospital users:', err);
    }
  };

  const getCylinderPrice = (sizeCode: string) => {
    const code = sizeCode.toUpperCase();
    if (code.includes('F')) return 117.20;
    if (code.includes('D')) return 114.50;
    if (code.includes('E')) return 80.00;
    if (code.includes('BN') || code.includes('N')) return 310.00;
    if (code.includes('HS')) return 250.00;
    return 0.00;
  };

  const getCylinderSizeLabel = (sizeCode: string) => {
    const code = sizeCode.toUpperCase();
    if (code.includes('N')) return '8.0m3';
    if (code.includes('F')) return '1.4m3';
    if (code.includes('E')) return '0.7m3';
    if (code.includes('D')) return '0.5m3';
    if (code.includes('HS')) return '6.4m3';
    return '1.4m3';
  };

  const getMockBarcodes = (sizeCode: string, qty: number, reqNum: string) => {
    const barcodes = [];
    const numPart = parseInt(reqNum.replace(/\D/g, '')) || 1000;
    for (let i = 0; i < qty; i++) {
      const uniqueId = String((numPart * (i + 1) + 80) % 10000).padStart(4, '0');
      barcodes.push(`â€¢ O2-${sizeCode}-${uniqueId}`);
    }
    return barcodes;
  };

  const handlePrint = () => {
    if (!request) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Sila benarkan tetingkap timbul (popups) untuk mencetak borang.');
      return;
    }

    const logoUrl = window.location.origin + '/512px-Jata_MalaysiaV2.svg.png';
    const reqDateStr = new Date(request.request_date).toLocaleDateString('en-GB');
    const reqTimeStr = new Date(request.request_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    const todayDateStr = today.toLocaleDateString('en-GB');
    const todayTimeStr = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let rowsHtml = '';
    let grandTotal = 0;
    let renderedRowsCount = 0;

    if (request.items && request.items.length > 0) {
      request.items.forEach((item, index) => {
        const sizeLabel = getCylinderSizeLabel(item.size_code);
        const price = getCylinderPrice(item.size_code);
        const qtyIssued = request.status === 'pending' || request.status === 'rejected' ? item.quantity_requested : item.quantity_issued;
        const rowTotal = qtyIssued * price;
        grandTotal += rowTotal;

        const barcodes = getMockBarcodes(item.size_code, item.quantity_requested, request.request_number);
        const barcodesHtml = barcodes.map(b => `<div style="margin-bottom: 2px;">${b}</div>`).join('');

        rowsHtml += `
          <tr style="border-bottom: 1px solid black; text-align: center; font-size: 9px; height: 35px;">
            <td style="border-right: 1px solid black; padding: 4px;">${index + 1}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold; font-family: monospace;">${item.size_code}</td>
            <td style="border-right: 1px solid black; padding: 4px;">${sizeLabel}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">PRIVATE</td>
            <td style="border-right: 1px solid black; padding: 4px;">silinder</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">${item.quantity_requested}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">${qtyIssued}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">${qtyIssued}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">${price.toFixed(2)}</td>
            <td style="padding: 4px; text-align: left; font-size: 8px; font-family: monospace; line-height: 1.1;">
              ${barcodesHtml}
            </td>
          </tr>
        `;
        renderedRowsCount++;
      });
    }

    // Pad empty rows
    const targetRowCount = 6;
    while (renderedRowsCount < targetRowCount) {
      rowsHtml += `
        <tr style="border-bottom: 1px solid black; height: 35px;">
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td style="border-right: 1px solid black;"></td>
          <td></td>
        </tr>
      `;
      renderedRowsCount++;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Borang Kew.PS-8 - ${request.request_number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: black; 
              font-size: 10px;
              line-height: 1.3;
            }
            .print-page {
              position: relative;
              width: 100%;
              box-sizing: border-box;
            }
            .watermark {
              background-image: url('${logoUrl}');
              background-repeat: no-repeat;
              background-position: center 40%;
              background-size: 25%;
              opacity: 0.05;
              position: absolute;
              inset: 0;
              pointer-events: none;
              height: 100%;
            }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 12px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .border { border: 1px solid black; }
            .border-collapse { border-collapse: collapse; }
            .w-full { width: 100%; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
          </style>
        </head>
        <body>
          <div class="print-page">
            <div class="watermark"></div>

            <!-- Header Info -->
            <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
              <tr>
                <td style="width: 8%; vertical-align: middle;">
                  <img src="${logoUrl}" alt="Jata Negara" style="width: 50px; height: auto;" onerror="this.style.display='none'" />
                </td>
                <td style="width: 50%; vertical-align: middle; padding-left: 10px;">
                  <div style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px;">HOSPITAL LAWAS</div>
                  <div style="font-size: 9px; font-weight: 700; color: #222; margin-top: 2px; text-transform: uppercase;">KEMENTERIAN KESIHATAN MALAYSIA</div>
                </td>
                <td style="width: 42%; text-align: right; vertical-align: top;">
                  <div style="font-size: 8px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; color: #333;">SALINAN PEMESAN (REQUESTER)</div>
                  <div style="display: inline-block; text-align: left;">
                    <table style="border: 1px solid black; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 4px 8px; font-size: 11px; font-weight: 800; font-family: monospace; border-bottom: 1px solid black; text-align: center; background-color: #fafafa;">
                          ${request.request_number}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 6px; font-size: 8px; font-weight: 600; text-align: center; color: #444;">
                          ${reqDateStr} &nbsp;&nbsp; ${reqTimeStr}
                        </td>
                      </tr>
                    </table>
                    <div style="font-size: 8px; text-align: right; margin-top: 3px; font-weight: 600; color: #444;">PAGE 1 OF 1</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Title -->
            <div style="margin-bottom: 15px; position: relative;">
              <div style="font-size: 12px; font-weight: 800; text-decoration: underline; letter-spacing: 0.3px;">
                PERMOHONAN STOK OKSIGEN PERUBATAN <span style="font-size: 10px; font-weight: 500; text-decoration: none; font-style: italic;">(Medical Oxygen Requisition)</span>
              </div>
              <div style="font-size: 9px; font-weight: bold; margin-top: 3px; color: #333;">KEW.PS-8 (PIN. 1/2026)</div>
            </div>

            <!-- Requester / Supplier Parties -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
              <tr style="border-top: 1px solid black; border-bottom: 1px solid black; background-color: #fafafa;">
                <td style="width: 50%; padding: 6px; border-right: 1px solid black; vertical-align: top;">
                  <div style="font-weight: bold; color: #555; font-size: 8px; margin-bottom: 3px;">DARI: PEMESAN (REQUESTER)</div>
                  <div style="font-size: 10px; font-weight: 800;">${(request.department?.department_name || 'Emergency & Trauma').toUpperCase()}</div>
                  <div style="font-size: 9px; color: #444; margin-top: 1px;">HOSPITAL LAWAS</div>
                </td>
                <td style="width: 50%; padding: 6px; vertical-align: top;">
                  <div style="font-weight: bold; color: #555; font-size: 8px; margin-bottom: 3px;">KEPADA: PENGELUAR (SUPPLIER)</div>
                  <div style="font-size: 10px; font-weight: 800;">UNIT FARMASI / STOR GAS PERUBATAN</div>
                  <div style="font-size: 9px; color: #444; margin-top: 1px;">HOSPITAL LAWAS</div>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <table class="w-full border-collapse" style="border: 1px solid black; margin-bottom: 15px;">
              <thead>
                <!-- Top Header Level -->
                <tr style="border-bottom: 1px solid black; background-color: #f3f4f6; text-align: center; font-size: 8px; font-weight: 800; height: 20px;">
                  <th colspan="6" style="border-right: 1px solid black; text-transform: uppercase; letter-spacing: 0.3px;">DILENGKAPKAN OLEH PEMESAN (REQUESTER)</th>
                  <th colspan="4" style="text-transform: uppercase; letter-spacing: 0.3px;">DILENGKAPKAN OLEH PENGELUAR (SUPPLIER)</th>
                </tr>
                <!-- Sub Header Level -->
                <tr style="border-bottom: 1.5px solid black; background-color: #f9fafb; text-align: center; font-size: 8px; font-weight: bold; height: 22px;">
                  <th style="border-right: 1px solid black; width: 3%;">NO.</th>
                  <th style="border-right: 1px solid black; width: 8%;">KOD</th>
                  <th style="border-right: 1px solid black; width: 12%;">SAIZ SILINDER</th>
                  <th style="border-right: 1px solid black; width: 10%;">JENIS</th>
                  <th style="border-right: 1px solid black; width: 8%;">UOM</th>
                  <th style="border-right: 1px solid black; width: 12%;">KUANTITI DIMOHON</th>
                  <th style="border-right: 1px solid black; width: 12%;">KUANTITI DILULUSKAN</th>
                  <th style="border-right: 1px solid black; width: 12%;">KUANTITI DIKELUARKAN</th>
                  <th style="border-right: 1px solid black; width: 10%;">HARGA (RM)</th>
                  <th style="width: 15%; text-align: left; padding-left: 6px;">CATATAN</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <!-- Total Row -->
                <tr style="border-top: 1.5px solid black; height: 26px; font-weight: bold; text-align: center; background-color: #f3f4f6; font-size: 9px;">
                  <td colspan="8" style="border-right: 1px solid black; text-align: right; padding-right: 15px; letter-spacing: 0.5px;">JUMLAH KESELURUHAN (RM)</td>
                  <td style="border-right: 1px solid black; font-weight: 800; font-size: 10px;">${grandTotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <!-- Signatures Section -->
            <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 8px; margin-bottom: 15px; table-layout: fixed;">
              <thead>
                <tr style="border-bottom: 1px solid black; background-color: #f3f4f6; text-align: center; font-weight: bold; height: 18px;">
                  <th colspan="2" style="border-right: 1px solid black; width: 50%;">DILENGKAPKAN OLEH PEMESAN (REQUESTER)</th>
                  <th colspan="2" style="width: 50%;">DILENGKAPKAN OLEH PENGELUAR (SUPPLIER)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <!-- Pemohon Box -->
                  <td style="width: 25%; border-right: 1px solid black; padding: 8px; vertical-align: top; height: 110px;">
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                      <div>
                        <div style="font-weight: 800; text-decoration: underline; margin-bottom: 6px;">1. PEMOHON</div>
                        <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
                          <tr><td style="width: 25%; padding: 2px 0;">NAMA:</td><td style="font-weight: bold; text-transform: uppercase;">${pemohonName || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">JAWATAN:</td><td>${pemohonPosition || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">JABATAN:</td><td>${request.department?.department_name || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">TARIKH:</td><td>${reqDateStr}</td></tr>
                        </table>
                      </div>
                      <div style="text-align: center; padding-top: 8px; margin-top: auto;">
                        <div style="border-bottom: 1px dotted black; width: 85%; margin: 0 auto 3px auto;"></div>
                        <div style="font-size: 7.5px; color: #444; font-weight: bold;">TANDATANGAN & COP</div>
                      </div>
                    </div>
                  </td>

                  <!-- Penerima Box -->
                  <td style="width: 25%; border-right: 1px solid black; padding: 8px; vertical-align: top; height: 110px;">
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                      <div>
                        <div style="font-weight: 800; text-decoration: underline; margin-bottom: 6px;">2. PENERIMA</div>
                        <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
                          <tr><td style="width: 25%; padding: 2px 0;">NAMA:</td><td style="font-weight: bold; text-transform: uppercase;">${penerimaName || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">JAWATAN:</td><td>${penerimaPosition || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">TARIKH:</td><td>${penerimaDate || '-'}</td></tr>
                          <tr><td colspan="2" style="font-style: italic; color: #666; padding-top: 4px;">(Lengkapkan setelah stok diterima)</td></tr>
                        </table>
                      </div>
                      <div style="text-align: center; padding-top: 8px; margin-top: auto;">
                        <div style="border-bottom: 1px dotted black; width: 85%; margin: 0 auto 3px auto;"></div>
                        <div style="font-size: 7.5px; color: #444; font-weight: bold;">TANDATANGAN & COP</div>
                      </div>
                    </div>
                  </td>

                  <!-- Pelulus Box -->
                  <td style="width: 25%; border-right: 1px solid black; padding: 8px; vertical-align: top; height: 110px;">
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                      <div>
                        <div style="font-weight: 800; text-decoration: underline; margin-bottom: 6px;">3. PELULUS</div>
                        <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
                          <tr><td style="width: 25%; padding: 2px 0;">NAMA:</td><td style="font-weight: bold; text-transform: uppercase;">${pelulusName || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">JAWATAN:</td><td>${pelulusPosition || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">UNIT:</td><td>Farmasi Logistik</td></tr>
                          <tr><td style="padding: 2px 0;">TARIKH:</td><td>${request.approved_date ? new Date(request.approved_date).toLocaleDateString('en-GB') : reqDateStr}</td></tr>
                        </table>
                      </div>
                      <div style="text-align: center; padding-top: 8px; margin-top: auto;">
                        <div style="border-bottom: 1px dotted black; width: 85%; margin: 0 auto 3px auto;"></div>
                        <div style="font-size: 7.5px; color: #444; font-weight: bold;">TANDATANGAN & COP</div>
                      </div>
                    </div>
                  </td>

                  <!-- Direkod Oleh Box -->
                  <td style="width: 25%; padding: 8px; vertical-align: top; height: 110px;">
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                      <div>
                        <div style="font-weight: 800; text-decoration: underline; margin-bottom: 6px;">4. DIREKOD OLEH</div>
                        <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
                          <tr><td style="width: 25%; padding: 2px 0;">NAMA:</td><td style="font-weight: bold; text-transform: uppercase;">${direkodName || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">JAWATAN:</td><td>${direkodPosition || '-'}</td></tr>
                          <tr><td style="padding: 2px 0;">UNIT:</td><td>Farmasi Logistik</td></tr>
                          <tr><td style="padding: 2px 0;">TARIKH:</td><td>${request.issued_date ? new Date(request.issued_date).toLocaleDateString('en-GB') : reqDateStr}</td></tr>
                        </table>
                      </div>
                      <div style="text-align: center; padding-top: 8px; margin-top: auto;">
                        <div style="border-bottom: 1px dotted black; width: 85%; margin: 0 auto 3px auto;"></div>
                        <div style="font-size: 7.5px; color: #444; font-weight: bold;">TANDATANGAN & COP</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Document Footer -->
            <table style="width: 100%; border-collapse: collapse; font-size: 7.5px; color: #555; margin-top: 15px;">
              <tr>
                <td style="width: 50%;">
                  <div style="font-weight: bold;">PRINTED BY: ${direkodName || 'AMRI AMIT'}</div>
                  <div style="margin-top: 2px;">DATE: ${todayDateStr} TIME: ${todayTimeStr}</div>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: bottom; font-weight: bold; text-transform: uppercase;">
                  THIS DOCUMENT GENERATED BY HOSPITAL OPERATION AND MANAGEMENT ECOSYSTEM (HOME)
                </td>
              </tr>
            </table>

          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const reqDateStr = request ? new Date(request.request_date).toLocaleDateString('en-GB') : '';
  const reqTimeStr = request ? new Date(request.request_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  
  let grandTotal = 0;
  if (request && request.items) {
    request.items.forEach((item) => {
      const price = getCylinderPrice(item.size_code);
      const qtyIssued = request.status === 'pending' || request.status === 'rejected' ? item.quantity_requested : item.quantity_issued;
      grandTotal += qtyIssued * price;
    });
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .watermark-bg {
          position: absolute;
          inset: 0;
          background-image: url('/512px-Jata_MalaysiaV2.svg.png');
          background-repeat: no-repeat;
          background-position: center 35%;
          background-size: 35%;
          opacity: 0.03;
          pointer-events: none;
        }
      `}</style>
      <div 
        className="bg-white w-full max-w-5xl h-full rounded-l-3xl shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-md font-bold text-slate-800">
              Borang Kew.PS-8 Requisition Preview ({request?.request_number})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100 flex justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-slate-500 text-sm">Memuatkan dokumen...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
              {error}
            </div>
          ) : request ? (
            /* Document Preview Sheet */
            <div className="bg-white w-[297mm] min-h-[210mm] p-[10mm] border border-slate-300 shadow-xl text-black text-[10px] relative flex flex-col justify-between overflow-hidden">
              <div className="watermark-bg" />
              
              <div className="relative z-10">
                {/* Header Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img src="/512px-Jata_MalaysiaV2.svg.png" alt="Jata Malaysia" className="w-12 h-auto" />
                    <div>
                      <h4 className="text-sm font-extrabold tracking-wide m-0">HOSPITAL LAWAS</h4>
                      <h5 className="text-[9px] font-bold text-slate-700 m-0 uppercase mt-0.5">KEMENTERIAN KESIHATAN MALAYSIA</h5>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-bold text-slate-600 mb-1">SALINAN PEMESAN (REQUESTER)</div>
                    <div className="inline-block border border-black text-left">
                      <div className="px-3 py-1 font-mono font-bold text-xs bg-slate-50 border-b border-black text-center">
                        {request.request_number}
                      </div>
                      <div className="px-2 py-0.5 text-[8px] text-slate-600 font-semibold text-center">
                        {reqDateStr} &nbsp;&nbsp; {reqTimeStr}
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-500 mt-1 font-bold">PAGE 1 OF 1</div>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <h3 className="text-[12px] font-extrabold m-0 text-slate-900 border-b-2 border-slate-900 pb-0.5 inline-block">
                    PERMOHONAN STOK OKSIGEN PERUBATAN <span className="font-normal italic text-[10px] text-slate-500">(Medical Oxygen Requisition)</span>
                  </h3>
                  <div className="text-[8px] font-bold text-slate-600 mt-1">KEW.PS-8 (PIN. 1/2026)</div>
                </div>

                {/* Parties details */}
                <div className="grid grid-cols-2 border border-black divide-x divide-black mb-4 bg-slate-50/50">
                  <div className="p-2.5">
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">Dari: Pemesan (Requester)</span>
                    <div className="font-extrabold text-slate-950 text-xs mt-0.5">
                      {(request.department?.department_name || 'Emergency & Trauma').toUpperCase()}
                    </div>
                    <div className="text-slate-600 text-[9px] mt-0.5">HOSPITAL LAWAS</div>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">Kepada: Pengeluar (Supplier)</span>
                    <div className="font-extrabold text-slate-950 text-xs mt-0.5">
                      UNIT FARMASI / STOR GAS PERUBATAN
                    </div>
                    <div className="text-slate-600 text-[9px] mt-0.5">HOSPITAL LAWAS</div>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-black mb-4 text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-[8px] font-bold text-center text-slate-700">
                      <th colSpan={6} className="border-r border-black py-1">DILENGKAPKAN OLEH PEMESAN (REQUESTER)</th>
                      <th colSpan={4} className="py-1">DILENGKAPKAN OLEH PENGELUAR (SUPPLIER)</th>
                    </tr>
                    <tr className="bg-slate-50 border-b border-black text-[8px] font-bold text-center text-slate-600">
                      <th className="border-r border-black p-1.5 w-8">NO.</th>
                      <th className="border-r border-black p-1.5 w-16">KOD</th>
                      <th className="border-r border-black p-1.5 w-24">SAIZ SILINDER</th>
                      <th className="border-r border-black p-1.5 w-20">JENIS</th>
                      <th className="border-r border-black p-1.5 w-16">UOM</th>
                      <th className="border-r border-black p-1.5 w-28">KUANTITI DIMOHON</th>
                      <th className="border-r border-black p-1.5 w-28">KUANTITI DILULUSKAN</th>
                      <th className="border-r border-black p-1.5 w-28">KUANTITI DIKELUARKAN</th>
                      <th className="border-r border-black p-1.5 w-24">HARGA (RM)</th>
                      <th className="p-1.5">CATATAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(request.items || []).map((itm, idx) => {
                      const sizeLabel = getCylinderSizeLabel(itm.size_code);
                      const price = getCylinderPrice(itm.size_code);
                      const qtyIssued = request.status === 'pending' || request.status === 'rejected' ? itm.quantity_requested : itm.quantity_issued;
                      const barcodes = getMockBarcodes(itm.size_code, itm.quantity_requested, request.request_number);

                      return (
                        <tr key={itm.id} className="border-b border-black text-center text-[9px] hover:bg-slate-50/20">
                          <td className="border-r border-black p-2">{idx + 1}</td>
                          <td className="border-r border-black p-2 font-mono font-bold text-slate-800">{itm.size_code}</td>
                          <td className="border-r border-black p-2">{sizeLabel}</td>
                          <td className="border-r border-black p-2 font-semibold text-slate-600">PRIVATE</td>
                          <td className="border-r border-black p-2 text-slate-500">silinder</td>
                          <td className="border-r border-black p-2 font-bold">{itm.quantity_requested}</td>
                          <td className="border-r border-black p-2 font-bold">{qtyIssued}</td>
                          <td className="border-r border-black p-2 font-bold">{qtyIssued}</td>
                          <td className="border-r border-black p-2 font-bold text-slate-700">{price.toFixed(2)}</td>
                          <td className="p-2 text-left font-mono text-[8px] leading-relaxed">
                            {barcodes.map((b, bIdx) => (
                              <div key={bIdx}>{b}</div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty spacer rows */}
                    {Array.from({ length: Math.max(0, 5 - (request.items?.length || 0)) }).map((_, idx) => (
                      <tr key={idx} className="border-b border-black h-8">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td></td>
                      </tr>
                    ))}
                    {/* Grand Totals */}
                    <tr className="font-bold text-center bg-slate-100 border-t border-black text-[9px]">
                      <td colSpan={8} className="border-r border-black text-right pr-6 p-2 uppercase tracking-wide">
                        JUMLAH KESELURUHAN (RM)
                      </td>
                      <td className="border-r border-black p-2 text-sm text-slate-900 font-extrabold">
                        {grandTotal.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <table className="w-full border-collapse border border-black text-[8px] table-layout-fixed mb-4">
                  <thead>
                    <tr className="border-b border-black bg-slate-100 text-center font-bold h-[18px]">
                      <th colSpan={2} className="border-r border-black w-1/2">DILENGKAPKAN OLEH PEMESAN (REQUESTER)</th>
                      <th colSpan={2} className="w-1/2">DILENGKAPKAN OLEH PENGELUAR (SUPPLIER)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {/* Pemohon */}
                      <td className="w-1/4 border-r border-black p-2.5 vertical-align-top h-[120px]">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <div className="font-extrabold text-slate-800 underline uppercase mb-1.5">1. Pemohon</div>
                            <div className="space-y-1 text-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">NAMA:</span>
                                <select 
                                  value={pemohonName}
                                  onChange={(e) => {
                                    setPemohonName(e.target.value);
                                    const match = users.find(u => u.full_name === e.target.value);
                                    if (match?.jawatan) setPemohonPosition(match.jawatan);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] font-bold text-slate-900 focus:outline-none"
                                >
                                  <option value="">Manual Entry...</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.full_name}>{u.full_name}</option>
                                  ))}
                                </select>
                              </div>
                              {(!pemohonName || !users.some(u => u.full_name === pemohonName)) && (
                                <div className="flex items-center gap-1 pl-13">
                                  <input 
                                    type="text" 
                                    placeholder="Taip nama manual..."
                                    value={pemohonName} 
                                    onChange={(e) => setPemohonName(e.target.value.toUpperCase())}
                                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[8px] uppercase focus:outline-none"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">JAWATAN:</span>
                                <input 
                                  type="text" 
                                  value={pemohonPosition} 
                                  onChange={(e) => setPemohonPosition(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] focus:outline-none"
                                />
                              </div>
                              <div>JABATAN: <span className="font-semibold">{request.department?.department_name || '-'}</span></div>
                              <div>TARIKH: <span>{reqDateStr}</span></div>
                            </div>
                          </div>
                          <div className="text-center pt-2">
                            <div className="border-b border-dotted border-black w-4/5 mx-auto mb-1"></div>
                            <span className="font-bold text-slate-500">TANDATANGAN & COP</span>
                          </div>
                        </div>
                      </td>

                      {/* Penerima */}
                      <td className="w-1/4 border-r border-black p-2.5 vertical-align-top h-[120px]">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <div className="font-extrabold text-slate-800 underline uppercase mb-1.5">2. Penerima</div>
                            <div className="space-y-1 text-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">NAMA:</span>
                                <select 
                                  value={penerimaName}
                                  onChange={(e) => {
                                    setPenerimaName(e.target.value);
                                    const match = users.find(u => u.full_name === e.target.value);
                                    if (match?.jawatan) setPenerimaPosition(match.jawatan);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] font-bold text-slate-900 focus:outline-none"
                                >
                                  <option value="">Manual Entry...</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.full_name}>{u.full_name}</option>
                                  ))}
                                </select>
                              </div>
                              {(!penerimaName || !users.some(u => u.full_name === penerimaName)) && (
                                <div className="flex items-center gap-1 pl-13">
                                  <input 
                                    type="text" 
                                    placeholder="Taip nama manual..."
                                    value={penerimaName} 
                                    onChange={(e) => setPenerimaName(e.target.value.toUpperCase())}
                                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[8px] uppercase focus:outline-none"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">JAWATAN:</span>
                                <input 
                                  type="text" 
                                  value={penerimaPosition} 
                                  onChange={(e) => setPenerimaPosition(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">TARIKH:</span>
                                <input 
                                  type="text" 
                                  value={penerimaDate} 
                                  onChange={(e) => setPenerimaDate(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] focus:outline-none font-sans"
                                  placeholder="Tarikh penerimaan..."
                                />
                              </div>
                              <div className="italic text-slate-400 text-[7.5px] mt-1">(Lengkapkan setelah stok diterima)</div>
                            </div>
                          </div>
                          <div className="text-center pt-2">
                            <div className="border-b border-dotted border-black w-4/5 mx-auto mb-1"></div>
                            <span className="font-bold text-slate-500">TANDATANGAN & COP</span>
                          </div>
                        </div>
                      </td>

                      {/* Pelulus */}
                      <td className="w-1/4 border-r border-black p-2.5 vertical-align-top h-[120px]">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <div className="font-extrabold text-slate-800 underline uppercase mb-1.5">3. Pelulus</div>
                            <div className="space-y-1 text-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">NAMA:</span>
                                <select 
                                  value={pelulusName}
                                  onChange={(e) => {
                                    setPelulusName(e.target.value);
                                    const match = users.find(u => u.full_name === e.target.value);
                                    if (match?.jawatan) setPelulusPosition(match.jawatan);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] font-bold text-slate-900 focus:outline-none"
                                >
                                  <option value="">Manual Entry...</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.full_name}>{u.full_name}</option>
                                  ))}
                                </select>
                              </div>
                              {(!pelulusName || !users.some(u => u.full_name === pelulusName)) && (
                                <div className="flex items-center gap-1 pl-13">
                                  <input 
                                    type="text" 
                                    placeholder="Taip nama manual..."
                                    value={pelulusName} 
                                    onChange={(e) => setPelulusName(e.target.value.toUpperCase())}
                                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[8px] uppercase focus:outline-none"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">JAWATAN:</span>
                                <input 
                                  type="text" 
                                  value={pelulusPosition} 
                                  onChange={(e) => setPelulusPosition(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] focus:outline-none"
                                />
                              </div>
                              <div>UNIT: <span className="font-semibold">Farmasi Logistik</span></div>
                              <div>TARIKH: <span>{request.approved_date ? new Date(request.approved_date).toLocaleDateString('en-GB') : reqDateStr}</span></div>
                            </div>
                          </div>
                          <div className="text-center pt-2">
                            <div className="border-b border-dotted border-black w-4/5 mx-auto mb-1"></div>
                            <span className="font-bold text-slate-500">TANDATANGAN & COP</span>
                          </div>
                        </div>
                      </td>

                      {/* Direkod Oleh */}
                      <td className="w-1/4 p-2.5 vertical-align-top h-[120px]">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <div className="font-extrabold text-slate-800 underline uppercase mb-1.5">4. Direkod Oleh</div>
                            <div className="space-y-1 text-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">NAMA:</span>
                                <select 
                                  value={direkodName}
                                  onChange={(e) => {
                                    setDirekodName(e.target.value);
                                    const match = users.find(u => u.full_name === e.target.value);
                                    if (match?.jawatan) setDirekodPosition(match.jawatan);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] font-bold text-slate-900 focus:outline-none"
                                >
                                  <option value="">Manual Entry...</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.full_name}>{u.full_name}</option>
                                  ))}
                                </select>
                              </div>
                              {(!direkodName || !users.some(u => u.full_name === direkodName)) && (
                                <div className="flex items-center gap-1 pl-13">
                                  <input 
                                    type="text" 
                                    placeholder="Taip nama manual..."
                                    value={direkodName} 
                                    onChange={(e) => setDirekodName(e.target.value.toUpperCase())}
                                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[8px] uppercase focus:outline-none"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="w-12 shrink-0">JAWATAN:</span>
                                <input 
                                  type="text" 
                                  value={direkodPosition} 
                                  onChange={(e) => setDirekodPosition(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[8px] focus:outline-none"
                                />
                              </div>
                              <div>UNIT: <span className="font-semibold">Farmasi Logistik</span></div>
                              <div>TARIKH: <span>{request.issued_date ? new Date(request.issued_date).toLocaleDateString('en-GB') : reqDateStr}</span></div>
                            </div>
                          </div>
                          <div className="text-center pt-2">
                            <div className="border-b border-dotted border-black w-4/5 mx-auto mb-1"></div>
                            <span className="font-bold text-slate-500">TANDATANGAN & COP</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer details */}
              <div className="flex justify-between items-end text-[7.5px] text-slate-500 mt-6 border-t pt-3 relative z-10">
                <div>
                  <div className="font-bold">PRINTED BY: {direkodName || 'AMRI AMIT'}</div>
                  <div className="mt-0.5">DATE: {new Date().toLocaleDateString('en-GB')} TIME: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="font-bold uppercase tracking-wider">
                  THIS DOCUMENT GENERATED BY HOSPITAL OPERATION AND MANAGEMENT ECOSYSTEM (HOME)
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all focus:outline-none"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            disabled={!request}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all focus:outline-none"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen
          </button>
        </div>

      </div>
    </div>
  );
};
