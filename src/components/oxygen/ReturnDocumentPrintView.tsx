// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, FileText } from 'lucide-react';
import { getReturnDocumentById } from '@/services/pharmacy/oxygenService';
import type { OxygenReturnDocumentWithRelations } from '@/types/pharmacy';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

interface ReturnDocumentPrintViewProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReturnDocumentPrintView: React.FC<ReturnDocumentPrintViewProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const { user: currentUser } = useAuthStore();
  const [doc, setDoc] = useState<OxygenReturnDocumentWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocumentDetails();
    }
  }, [isOpen, documentId]);

  const loadDocumentDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getReturnDocumentById(documentId);
      if (res.error) throw new Error(res.error);
      setDoc(res.data);

      const { data: sizesData } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('*');
      const { data: typesData } = await supabase.from('pharmacy_oxygen_cylinder_types').select('*');
      if (sizesData) setSizes(sizesData);
      if (typesData) setTypes(typesData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load document details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeLabel = (sizeId: string, typeId: string) => {
    const size = sizes.find(s => s.id === sizeId);
    const type = types.find(t => t.id === typeId);
    if (!size || !type) return 'Unknown Size';
    const typeCode = type.code || '';
    const capacity = parseFloat(size.capacity).toFixed(1).replace(/\.0$/, '');
    const unit = size.unit || 'm3';
    return `${typeCode} ${capacity}${unit}`;
  };

  // Group and split doc.items into loan and personal cylinders
  const loanCyls: any[] = [];
  const personalCyls: any[] = [];
  
  if (doc) {
    doc.items?.forEach(item => {
      if (item.cylinder) {
        const size = sizes.find(s => s.id === item.cylinder?.cylinder_size_id);
        const isLoan = size ? size.is_loan : false;
        if (isLoan) {
          loanCyls.push(item.cylinder);
        } else {
          personalCyls.push(item.cylinder);
        }
      }
    });
  }

  const handlePrint = () => {
    if (!doc) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing.');
      return;
    }

    const docCreatedDate = new Date(doc.created_at).toLocaleDateString('en-MY').replace(/\//g, '-');
    const docCreatedTime = new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '-');
    try {
      printWindow.history.replaceState(null, '', `/print/return-document/${doc.document_number}/created-at/${docCreatedDate}_${docCreatedTime}`);
    } catch (e) {
      console.error(e);
    }

    const logoUrl = window.location.origin + '/512px-Jata_MalaysiaV2.svg.png';

    const generatePageHtml = (titleTag: string, cylindersList: any[], pageNum: number, totalPages: number) => {
      // Group cylindersList by size label
      const grouped: { [sizeLabel: string]: any[] } = {};
      cylindersList.forEach(cyl => {
        const label = getSizeLabel(cyl.cylinder_size_id, cyl.cylinder_type_id);
        if (!grouped[label]) {
          grouped[label] = [];
        }
        grouped[label].push(cyl);
      });

      let rowsHtml = '';
      let renderedRowsCount = 0;
      if (cylindersList.length > 0) {
        Object.keys(grouped).forEach((sizeLabel) => {
          const list = grouped[sizeLabel];
          const chunks: any[][] = [];
          for (let i = 0; i < list.length; i += 4) {
            const chunk = list.slice(i, i + 4);
            while (chunk.length < 4) {
              chunk.push(null);
            }
            chunks.push(chunk);
          }

          rowsHtml += `
            <tr style="border-bottom: 1.5px solid #000; background-color: #f8fafc; font-weight: bold; height: 28px;">
              <td style="border-right: 1.5px solid #000; padding: 4px 10px; text-align: left; font-size: 10px;" colspan="1">
                SIZE: ${sizeLabel}
              </td>
              <td style="border-right: 1.5px solid #000;" colspan="4"></td>
              <td style="border-right: 1.5px solid #000; padding: 4px 10px; text-align: center; font-size: 10px; font-weight: 800;" colspan="1">
                QTY: ${list.length}
              </td>
              <td style="padding: 4px 10px;" colspan="1"></td>
            </tr>
          `;
          renderedRowsCount++;

          chunks.forEach((chunk) => {
            const c0 = chunk[0] ? `<span style="display: inline-block; padding: 1px 5px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 8.5px; font-weight: 600; color: #1e293b; letter-spacing: 0.3px;">${chunk[0].qr_code || chunk[0].serial_number}</span>` : '';
            const c1 = chunk[1] ? `<span style="display: inline-block; padding: 1px 5px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 8.5px; font-weight: 600; color: #1e293b; letter-spacing: 0.3px;">${chunk[1].qr_code || chunk[1].serial_number}</span>` : '';
            const c2 = chunk[2] ? `<span style="display: inline-block; padding: 1px 5px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 8.5px; font-weight: 600; color: #1e293b; letter-spacing: 0.3px;">${chunk[2].qr_code || chunk[2].serial_number}</span>` : '';
            const c3 = chunk[3] ? `<span style="display: inline-block; padding: 1px 5px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 8.5px; font-weight: 600; color: #1e293b; letter-spacing: 0.3px;">${chunk[3].qr_code || chunk[3].serial_number}</span>` : '';

            rowsHtml += `
              <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 24px;">
                <td style="border-right: 1.5px solid #000;"></td>
                <td style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">${c0}</td>
                <td style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">${c1}</td>
                <td style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">${c2}</td>
                <td style="border-right: 1.5px solid #000; padding: 4px 6px;">${c3}</td>
                <td style="border-right: 1.5px solid #000;"></td>
                <td></td>
              </tr>
            `;
            renderedRowsCount++;
          });
        });
      }

      // Pad with empty rows to fill the table up to 6 rows
      const targetRowCount = 6;
      while (renderedRowsCount < targetRowCount) {
        rowsHtml += `
          <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 26px;">
            <td style="border-right: 1.5px solid #000;"></td>
            <td style="border-right: 1.5px solid #000;" colspan="4"></td>
            <td style="border-right: 1.5px solid #000;"></td>
            <td></td>
          </tr>
        `;
        renderedRowsCount++;
      }

      const totalQty = cylindersList.length;
      const todayDateStr = new Date(doc.created_at).toLocaleDateString('en-MY');
      const todayTimeStr = new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const supplierName = doc.supplier?.company_name || 'LINDE EOX SDN BHD (CAW. MIRI)';
      const supplierAddressLines = (doc.supplier?.address || 'LOT 1525, PIASAU IND. ESTATE\n98000 MIRI, SARAWAK.')
        .split('\n')
        .map(line => `<div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">${line.trim()}</div>`)
        .join('');

      return `
        <div class="print-page">
          <div style="flex: 1; width: 100%;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; font-family: 'Inter', Arial, sans-serif; margin-bottom: 8px;">
              <div style="display: flex; align-items: flex-start; gap: 16px;">
                <img src="${logoUrl}" style="height: 52px; width: auto; flex-shrink: 0; margin-top: 2px;" alt="Jata Negara" />
                <div style="text-align: left; line-height: 1.3;">
                  <div style="font-size: 14px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;">HOSPITAL LAWAS</div>
                  <div style="font-size: 10px; font-weight: 500; color: #475569;">Jalan Hospital,</div>
                  <div style="font-size: 10px; font-weight: 500; color: #475569;">98850 Lawas,</div>
                  <div style="font-size: 10px; font-weight: 500; color: #475569;">Sarawak,</div>
                  <div style="font-size: 10px; font-weight: 500; color: #475569;">Malaysia.</div>
                </div>
              </div>
              <div style="text-align: left; font-size: 10px; color: #475569; line-height: 1.4; font-family: 'Inter', Arial, sans-serif; min-width: 170px;">
                <div><strong style="color: #334155; font-weight: 700;">Telefon:</strong> 085-283781</div>
                <div><strong style="color: #334155; font-weight: 700;">Faks:</strong> 085-285993</div>
                <div><strong style="color: #334155; font-weight: 700;">Email:</strong> hosp_lawas@moh.gov.my</div>
              </div>
            </div>
            <div style="border-bottom: 1px solid #cbd5e1; margin-bottom: 14px; margin-top: 4px;"></div>

            <div class="text-center mb-4">
              <h1 style="font-size: 13px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
                BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
              </h1>
              <h2 style="font-size: 10px; font-weight: 700; margin: 4px 0 0 0; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">
                ${titleTag}
              </h2>
            </div>

            <div class="grid grid-cols-2 border" style="font-size: 10px; border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background-color: #fff;">
              <div class="border-r p-3 space-y-1.5" style="border-right: 1.5px solid #000;">
                <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">DARIPADA (FROM)</div>
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">HOSPITAL LAWAS</div>
                <div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
                <div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">TEL: 085-283781 &bull; FAKS: 085-285993</div>
              </div>
              <div class="p-3 space-y-1.5">
                <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">KEPADA (TO)</div>
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${supplierName}</div>
                ${supplierAddressLines}
              </div>
            </div>

            <div class="grid grid-cols-2 border-x border-b" style="font-weight: bold; margin-bottom: 16px; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000;">
              <div class="border-r p-2 bg-slate-50/30" style="border-right: 1.5px solid #000; font-size: 10px; color: #334155;">
                NO. PEMESANAN: <span class="font-mono" style="font-size: 11px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${doc.document_number}</span>
              </div>
              <div class="p-2 bg-slate-50/30" style="font-size: 10px; color: #334155;">
                NO. PESANAN KERAJAAN: -
              </div>
            </div>

            <table class="w-full border-collapse border" style="font-size: 10px; border: 1.5px solid #000;">
              <thead>
                <tr style="border-bottom: 1.5px solid #000; text-align: center; text-transform: uppercase; background-color: #f1f5f9; height: 32px;">
                  <th class="border-r" style="padding: 6px 4px; width: 20%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">PERIHAL BARANG</th>
                  <th class="border-r" style="padding: 6px 4px; width: 60%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;" colspan="4">NO. PENDAFTARAN SILINDER</th>
                  <th class="border-r" style="padding: 6px 4px; width: 10%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">KUANTITI DIHANTAR</th>
                  <th style="padding: 6px 4px; width: 10%; font-size: 9px; font-weight: 800; color: #0f172a;">KUANTITI DITERIMA</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="font-weight: 900; text-transform: uppercase; font-size: 10px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; height: 28px; background-color: #f8fafc;">
                  <td class="border-r" style="padding: 4px 10px; text-align: right; border-right: 1.5px solid #000;" colspan="5">JUMLAH</td>
                  <td class="border-r font-mono" style="padding: 4px; text-align: center; border-right: 1.5px solid #000; font-size: 11px; font-weight: 900; font-variant-numeric: tabular-nums;">${totalQty}</td>
                  <td class="font-mono" style="padding: 4px; text-align: center; font-size: 11px; font-weight: 900; font-variant-numeric: tabular-nums;">0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: auto; padding-top: 15px; page-break-inside: avoid; break-inside: avoid; width: 100%;">
            <div class="grid grid-cols-3 border" style="font-size: 9px; border: 1.5px solid #000; border-collapse: collapse; border-radius: 4px; overflow: hidden; background-color: #fff;">
              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 135px; padding: 0; background-color: #fff;">
                <div class="text-center" style="border-bottom: 1.5px solid #000; padding: 6px 4px; text-transform: uppercase; font-weight: 800; font-size: 8.5px; background-color: #f8fafc; color: #0f172a; height: 28px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; line-height: 1.2;">
                  AKUAN PENGELUARAN SILINDER & PEMESANAN
                </div>
                <div style="padding: 6px 8px; flex-1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 25px auto 5px auto;"></div>
                  <div style="font-size: 8px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: ${currentUser?.full_name || doc.creator?.full_name || 'AMRI AMIT'}</div>
                    <div style="margin-top: 1px;">JAWATAN: ${currentUser?.jawatan || doc.creator?.jawatan || 'PENOLONG PEGAWAI FARMASI'}</div>
                    <div style="margin-top: 1px;">TARIKH: ${new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 135px; padding: 0; border-left: 1.5px solid #000; background-color: #fff;">
                <div class="text-center" style="border-bottom: 1.5px solid #000; padding: 6px 4px; text-transform: uppercase; font-weight: 800; font-size: 8.5px; background-color: #f8fafc; color: #0f172a; height: 28px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; line-height: 1.2;">
                  AKUAN TERIMA PEMBEKAL / PENGANGKUT
                </div>
                <div style="padding: 6px 8px; flex-1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 25px auto 5px auto;"></div>
                  <div style="font-size: 8px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: _______________________________</div>
                    <div style="margin-top: 2px;">TARIKH: _____________________________</div>
                    <div style="margin-top: 2px;">COP JABATAN: _________________________</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 135px; padding: 0; border-left: 1.5px solid #000; background-color: #fff;">
                <div class="text-center" style="border-bottom: 1.5px solid #000; padding: 6px 4px; text-transform: uppercase; font-weight: 800; font-size: 8.5px; background-color: #f8fafc; color: #0f172a; height: 28px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; line-height: 1.2;">
                  AKUAN TERIMA PENERIMA (SELEPAS STOK DITERIMA)
                </div>
                <div style="padding: 6px 8px; flex-1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 25px auto 5px auto;"></div>
                  <div style="font-size: 8px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: _______________________________</div>
                    <div style="margin-top: 2px;">JAWATAN: ____________________________</div>
                    <div style="margin-top: 2px;">TARIKH: _____________________________</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-center" style="margin-top: 15px; font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; color: #334155; margin-bottom: 10px;">
              BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 5px; font-family: sans-serif; margin-top: 5px;">
              <div>Generated by HOME Ecosystem | ${todayDateStr}, ${todayTimeStr}</div>
              <div>Page ${pageNum} of ${totalPages}</div>
            </div>
          </div>
        </div>
      `;
    };

    const page1Html = generatePageHtml('(SILINDER SEWAAN)', loanCyls, 1, 2);
    const page2Html = generatePageHtml('(SILINDER H.D.L (MILIK SENDIRI))', personalCyls, 2, 2);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Return Document - ${doc.document_number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: portrait;
              margin: 0;
            }
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: black; 
              font-size: 10px;
              line-height: 1.4;
            }
            .print-page {
              position: relative;
              height: 297mm;
              box-sizing: border-box;
              padding: 10mm 15mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: always;
              break-after: page;
            }
            .print-page:last-of-type {
              page-break-after: avoid;
              break-after: avoid;
            }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 12px; }
            .pb-2 { padding-bottom: 6px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .border { border: 1.5px solid #000; }
            .border-x { border-left: 1.5px solid #000; border-right: 1.5px solid #000; }
            .border-b { border-bottom: 1.5px solid #000; }
            .border-r { border-right: 1.5px solid #000; }
            .p-2 { padding: 6px; }
            .p-3 { padding: 10px; }
            .space-y-1 > * { margin-bottom: 3px; }
            .space-y-1.5 > * { margin-bottom: 5px; }
            .pl-6 { padding-left: 20px; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .w-full { width: 100%; }
            .border-collapse { border-collapse: collapse; }
            .mt-4 { margin-top: 12px; }
            .mt-6 { margin-top: 20px; }
            .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
            .divide-x > * + * { border-left: 1.5px solid #000; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
          </style>
        </head>
        <body>
          ${page1Html}
          ${page2Html}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const renderPreviewPage = (titleTag: string, cylindersList: any[], pageNum: number, totalPages: number) => {
    const grouped: { [sizeLabel: string]: any[] } = {};
    cylindersList.forEach(cyl => {
      const label = getSizeLabel(cyl.cylinder_size_id, cyl.cylinder_type_id);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(cyl);
    });

    const totalQty = cylindersList.length;
    const generatedDate = doc ? new Date(doc.created_at).toLocaleDateString('en-MY') : '';
    const generatedTime = doc ? new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';

    return (
      <div className="bg-white text-black p-8 border border-slate-300 shadow-lg max-w-[210mm] min-h-[297mm] mx-auto my-6 relative flex flex-col justify-between font-sans text-xs select-none">
        <div>
          {/* Header Title */}
          <div className="flex items-start justify-between gap-5 mb-2 font-sans">
            <div className="flex items-start gap-4">
              <img src="/512px-Jata_MalaysiaV2.svg.png" className="h-[52px] w-auto flex-shrink-0 mt-0.5" alt="Jata Negara" />
              <div className="text-left leading-tight">
                <div className="text-[14px] font-extrabold tracking-wide text-slate-900 uppercase mb-0.5">HOSPITAL LAWAS</div>
                <div className="text-[10px] font-medium text-slate-600">Jalan Hospital,</div>
                <div className="text-[10px] font-medium text-slate-600">98850 Lawas,</div>
                <div className="text-[10px] font-medium text-slate-600">Sarawak,</div>
                <div className="text-[10px] font-medium text-slate-600">Malaysia.</div>
              </div>
            </div>
            <div className="text-left text-[10px] text-slate-600 leading-snug min-w-[170px]">
              <div><strong className="text-slate-700 font-bold">Telefon:</strong> 085-283781</div>
              <div><strong className="text-slate-700 font-bold">Faks:</strong> 085-285993</div>
              <div><strong className="text-slate-700 font-bold">Email:</strong> hosp_lawas@moh.gov.my</div>
            </div>
          </div>
          <div className="border-b border-slate-300 mt-1 mb-3.5" />

          <div className="text-center mb-4">
            <h1 className="text-[13px] font-black tracking-wide uppercase text-black">
              BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
            </h1>
            <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-700 mt-1">
              {titleTag}
            </h2>
          </div>

          {/* Daripada / Kepada Info Box */}
          <div className="grid grid-cols-2 border-[1.5px] border-black text-[10px] bg-white rounded overflow-hidden">
            <div className="border-r-[1.5px] border-black p-3 space-y-1.5 text-left">
              <div className="text-[8.5px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">DARIPADA (FROM)</div>
              <div className="text-[11px] font-black text-slate-900 uppercase">HOSPITAL LAWAS</div>
              <div className="text-[9px] text-slate-800 font-medium leading-relaxed">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
              <div className="text-[9px] text-slate-800 font-medium leading-relaxed">TEL: 085-283781 &bull; FAKS: 085-285993</div>
            </div>
            <div className="p-3 space-y-1.5 text-left">
              <div className="text-[8.5px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">KEPADA (TO)</div>
              <div className="text-[11px] font-black text-slate-900 uppercase">{doc?.supplier?.company_name || 'LINDE EOX SDN BHD (CAW. MIRI)'}</div>
              {(doc?.supplier?.address || 'LOT 1525, PIASAU IND. ESTATE\n98000 MIRI, SARAWAK.').split('\n').map((line, idx) => (
                <div key={idx} className="text-[9px] text-slate-800 font-medium leading-relaxed">{line.trim()}</div>
              ))}
            </div>
          </div>

          {/* Document and PO Reference Numbers */}
          <div className="grid grid-cols-2 border-x-[1.5px] border-b-[1.5px] border-black text-[10px] font-bold mb-4 bg-slate-50/30">
            <div className="border-r-[1.5px] border-black p-2 text-left text-slate-700">
              NO. PEMESANAN: <span className="font-extrabold font-mono text-[11px] text-black tracking-wide">{doc?.document_number}</span>
            </div>
            <div className="p-2 text-left text-slate-700">
              NO. PESANAN KERAJAAN: -
            </div>
          </div>

          {/* Main Catalogue Table */}
          <table className="w-full border-collapse border-[1.5px] border-black text-[10px] font-bold bg-white">
            <thead>
              <tr className="border-b-[1.5px] border-black bg-slate-50 text-center uppercase h-8">
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[20%] text-[9px] font-black text-slate-900">PERIHAL BARANG</th>
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[60%] text-[9px] font-black text-slate-900" colSpan={4}>NO. PENDAFTARAN SILINDER</th>
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[10%] text-[9px] font-black text-slate-900">KUANTITI DIHANTAR</th>
                <th className="py-1 px-2 text-center w-[10%] text-[9px] font-black text-slate-900">KUANTITI DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: React.ReactNode[] = [];
                let renderedRowsCount = 0;

                if (cylindersList.length > 0) {
                  Object.keys(grouped).forEach((sizeLabel) => {
                    const cylinders = grouped[sizeLabel];
                    const chunks: any[][] = [];
                    for (let i = 0; i < cylinders.length; i += 4) {
                      const chunk = cylinders.slice(i, i + 4);
                      while (chunk.length < 4) {
                        chunk.push(null);
                      }
                      chunks.push(chunk);
                    }

                    const firstCyl = cylinders[0];
                    const isLoanSize = firstCyl && sizes.find(s => s.id === firstCyl.cylinder_size_id)?.is_loan;

                    rows.push(
                      <React.Fragment key={sizeLabel}>
                        {/* Group Sub-Header Row */}
                        <tr className="border-b-[1.5px] border-black bg-slate-50/50 font-black h-7">
                          <td className="border-r-[1.5px] border-black py-1 px-3.5 text-left text-slate-900">
                            SIZE: {sizeLabel}
                          </td>
                          <td className="border-r-[1.5px] border-black" colSpan={4}></td>
                          <td className="border-r-[1.5px] border-black py-1 px-2 text-center text-[10px] font-black text-slate-900">
                            QTY: {cylinders.length}
                          </td>
                          <td className="py-1 px-2"></td>
                        </tr>

                        {/* Cylinder Rows */}
                        {chunks.map((chunk, chunkIdx) => (
                          <tr key={chunkIdx} className="border-b border-slate-200 text-center font-mono h-6">
                            <td className="border-r-[1.5px] border-black"></td>
                            {chunk.map((cyl, cylIdx) => (
                              <td 
                                key={cylIdx} 
                                className={`py-1 px-1.5 ${
                                  cylIdx === 3 ? 'border-r-[1.5px] border-black' : 'border-r border-slate-200'
                                }`}
                              >
                                {cyl ? (
                                  <span className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[8.5px] font-semibold text-slate-700 tracking-wide">
                                    {cyl.qr_code || cyl.serial_number}
                                  </span>
                                ) : ''}
                              </td>
                            ))}
                            <td className="border-r-[1.5px] border-black"></td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                    renderedRowsCount += 1 + chunks.length;
                  });
                }

                // Pad with empty rows
                const targetRowCount = 6;
                while (renderedRowsCount < targetRowCount) {
                  rows.push(
                    <tr key={`empty-${renderedRowsCount}`} className="border-b border-slate-200 text-center h-[26px]">
                      <td className="border-r-[1.5px] border-black"></td>
                      <td className="border-r-[1.5px] border-black" colSpan={4}></td>
                      <td className="border-r-[1.5px] border-black"></td>
                      <td></td>
                    </tr>
                  );
                  renderedRowsCount++;
                }

                return rows;
              })()}

              {/* Summary Footer Row */}
              <tr className="font-extrabold uppercase border-b-[1.5px] border-black text-[10px] h-[28px] bg-slate-50/50">
                <td className="border-r-[1.5px] border-black py-1 px-3.5 text-right text-slate-900" colSpan={5}>
                  JUMLAH
                </td>
                <td className="border-r-[1.5px] border-black py-1 px-2 text-center font-black font-mono text-[11px] text-slate-900">
                  {totalQty}
                </td>
                <td className="py-1 px-2 text-center font-black font-mono text-[11px] text-slate-900">
                  0
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* Bottom Section containing signatures, disclaimer, and footer to keep them at the bottom */}
        <div className="mt-auto">
          {/* Signatures Section */}
          <div className="grid grid-cols-3 border-[1.5px] border-black text-[9px] font-bold bg-white divide-x-[1.5px] divide-black rounded overflow-hidden">
            <div className="flex flex-col justify-between h-[135px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1.5 uppercase tracking-wide bg-slate-50 text-[8.5px] text-slate-900 h-7 flex items-center justify-center">
                AKUAN PENGELUARAN SILINDER & PEMESANAN
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-8 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-4" />
                <div className="space-y-0.5 text-[8px] text-slate-700 font-semibold">
                  <div>NAMA: {currentUser?.full_name || doc?.creator?.full_name || 'AMRI AMIT'}</div>
                  <div>JAWATAN: {currentUser?.jawatan || doc?.creator?.jawatan || 'PENOLONG PEGAWAI FARMASI'}</div>
                  <div>TARIKH: {doc ? new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-[135px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1.5 uppercase tracking-wide bg-slate-50 text-[8.5px] text-slate-900 h-7 flex items-center justify-center">
                AKUAN TERIMA PEMBEKAL / PENGANGKUT
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-8 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-4" />
                <div className="space-y-0.5 text-[8px] text-slate-700 font-semibold">
                  <div>NAMA: _______________________________</div>
                  <div>TARIKH: _____________________________</div>
                  <div>COP JABATAN: _________________________</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-[135px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1.5 uppercase tracking-wide bg-slate-50 text-[8.5px] text-slate-900 h-7 flex items-center justify-center leading-tight">
                AKUAN TERIMA PENERIMA (SELEPAS DITERIMA)
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-8 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-4" />
                <div className="space-y-0.5 text-[8px] text-slate-700 font-semibold">
                  <div>NAMA: _______________________________</div>
                  <div>JAWATAN: ____________________________</div>
                  <div>TARIKH: _____________________________</div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Disclaimer */}
          <div className="text-center mt-3 font-black italic uppercase tracking-wider text-[9px] mb-4 text-slate-700">
            BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN
          </div>

          {/* Footer info generated from system */}
          <div className="flex justify-between text-[8px] text-slate-500 font-bold border-t border-slate-200 pt-1">
            <div>Generated by HOME Ecosystem | {generatedDate}, {generatedTime}</div>
            <div>Page {pageNum} of {totalPages}</div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto print:hidden">
      <div className="relative w-full max-w-5xl bg-slate-100 border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Controls */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white rounded-t-3xl shadow-sm">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-slate-800">Return Document Viewer</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-200 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preview Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
              <span className="text-slate-500 font-semibold text-sm">Loading document layout...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-600 font-bold">
              {error}
            </div>
          ) : doc ? (
            <div className="space-y-8">
              {/* Page 1: Loan Cylinders */}
              <div>
                <div className="max-w-[210mm] mx-auto text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Page 1: Silinder Sewaan</div>
                {renderPreviewPage('(SILINDER SEWAAN)', loanCyls, 1, 2)}
              </div>

              {/* Page separator */}
              <div className="max-w-[210mm] mx-auto border-t-2 border-dashed border-slate-300 my-8 relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-100 px-4 text-xs font-bold text-slate-400">
                  PAGE BREAK
                </div>
              </div>

              {/* Page 2: Personal Cylinders */}
              <div>
                <div className="max-w-[210mm] mx-auto text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Page 2: Silinder Milik Sendiri</div>
                {renderPreviewPage('(SILINDER H.D.L (MILIK SENDIRI))', personalCyls, 2, 2)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
