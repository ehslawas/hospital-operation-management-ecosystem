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

  // Determine pages to display / print
  const pagesToRender: { title: string; titleTag: string; cyls: any[] }[] = [];
  if (loanCyls.length > 0 && personalCyls.length > 0) {
    pagesToRender.push({
      title: 'Silinder Sewaan',
      titleTag: '(SILINDER SEWAAN)',
      cyls: loanCyls,
    });
    pagesToRender.push({
      title: 'Silinder Milik Sendiri',
      titleTag: '(SILINDER H.D.L (MILIK SENDIRI))',
      cyls: personalCyls,
    });
  } else if (personalCyls.length > 0) {
    pagesToRender.push({
      title: 'Silinder Milik Sendiri',
      titleTag: '(SILINDER H.D.L (MILIK SENDIRI))',
      cyls: personalCyls,
    });
  } else {
    pagesToRender.push({
      title: 'Silinder Sewaan',
      titleTag: '(SILINDER SEWAAN)',
      cyls: loanCyls,
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
            <tr style="border-bottom: 1.5px solid #000; background-color: #f8fafc; font-weight: bold; height: 26px;">
              <td style="border-right: 1.5px solid #000; padding: 3px 8px; text-align: left; font-size: 9.5px;" colspan="1">
                SIZE: ${sizeLabel}
              </td>
              <td style="border-right: 1.5px solid #000;" colspan="4"></td>
              <td style="border-right: 1.5px solid #000; padding: 3px 8px; text-align: center; font-size: 9.5px; font-weight: 800;" colspan="1">
                QTY: ${list.length}
              </td>
              <td style="padding: 3px 8px;" colspan="1"></td>
            </tr>
          `;
          renderedRowsCount++;

          chunks.forEach((chunk) => {
            const c0 = chunk[0] ? `<span style="display: inline-block; padding: 1px 4px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; font-family: monospace; font-size: 8px; font-weight: 600; color: #1e293b;">${chunk[0].qr_code || chunk[0].serial_number}</span>` : '';
            const c1 = chunk[1] ? `<span style="display: inline-block; padding: 1px 4px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; font-family: monospace; font-size: 8px; font-weight: 600; color: #1e293b;">${chunk[1].qr_code || chunk[1].serial_number}</span>` : '';
            const c2 = chunk[2] ? `<span style="display: inline-block; padding: 1px 4px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; font-family: monospace; font-size: 8px; font-weight: 600; color: #1e293b;">${chunk[2].qr_code || chunk[2].serial_number}</span>` : '';
            const c3 = chunk[3] ? `<span style="display: inline-block; padding: 1px 4px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; font-family: monospace; font-size: 8px; font-weight: 600; color: #1e293b;">${chunk[3].qr_code || chunk[3].serial_number}</span>` : '';

            rowsHtml += `
              <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 22px;">
                <td style="border-right: 1.5px solid #000;"></td>
                <td style="border-right: 1px solid #e2e8f0; padding: 2px 4px;">${c0}</td>
                <td style="border-right: 1px solid #e2e8f0; padding: 2px 4px;">${c1}</td>
                <td style="border-right: 1px solid #e2e8f0; padding: 2px 4px;">${c2}</td>
                <td style="border-right: 1.5px solid #000; padding: 2px 4px;">${c3}</td>
                <td style="border-right: 1.5px solid #000;"></td>
                <td></td>
              </tr>
            `;
            renderedRowsCount++;
          });
        });
      }

      // Pad with empty rows to fill up cleanly (minimum 5 rows)
      const targetRowCount = 5;
      while (renderedRowsCount < targetRowCount) {
        rowsHtml += `
          <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 24px;">
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
        .map(line => `<div style="font-size: 8.5px; font-weight: 500; color: #334155; line-height: 1.25;">${line.trim()}</div>`)
        .join('');

      return `
        <div class="print-page">
          <!-- Official Hospital Header -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; font-family: 'Inter', Arial, sans-serif; margin-bottom: 6px;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <img src="${logoUrl}" style="height: 48px; width: auto; flex-shrink: 0;" alt="Jata Negara" />
              <div style="text-align: left; line-height: 1.25;">
                <div style="font-size: 13px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 1px;">HOSPITAL LAWAS</div>
                <div style="font-size: 9.5px; font-weight: 500; color: #475569;">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 9.5px; color: #475569; line-height: 1.35; font-family: 'Inter', Arial, sans-serif; min-width: 170px;">
              <div><strong style="color: #334155; font-weight: 700;">Telefon:</strong> 085-283781</div>
              <div><strong style="color: #334155; font-weight: 700;">Faks:</strong> 085-285993</div>
              <div><strong style="color: #334155; font-weight: 700;">Email:</strong> hosp_lawas@moh.gov.my</div>
            </div>
          </div>
          <div style="border-bottom: 1.5px solid #cbd5e1; margin-bottom: 10px; margin-top: 2px;"></div>

          <!-- Document Titles -->
          <div class="text-center" style="margin-bottom: 10px;">
            <h1 style="font-size: 12.5px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
              BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
            </h1>
            <h2 style="font-size: 10px; font-weight: 800; margin: 3px 0 0 0; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">
              ${titleTag}
            </h2>
          </div>

          <!-- DARIPADA & KEPADA Box -->
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; background-color: #fff; margin-bottom: 0;">
            <tr>
              <td style="width: 50%; padding: 8px 10px; border-right: 1.5px solid #000; vertical-align: top;">
                <div style="font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;">DARIPADA (FROM)</div>
                <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">HOSPITAL LAWAS</div>
                <div style="font-size: 8.5px; font-weight: 500; color: #334155; line-height: 1.25;">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
                <div style="font-size: 8.5px; font-weight: 500; color: #334155; line-height: 1.25;">TEL: 085-283781 &bull; FAKS: 085-285993</div>
              </td>
              <td style="width: 50%; padding: 8px 10px; vertical-align: top;">
                <div style="font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;">KEPADA (TO)</div>
                <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${supplierName}</div>
                ${supplierAddressLines}
              </td>
            </tr>
          </table>

          <!-- Reference Numbers Bar -->
          <table style="width: 100%; border-collapse: collapse; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000; margin-bottom: 10px; background-color: #f8fafc;">
            <tr>
              <td style="width: 50%; padding: 4px 8px; border-right: 1.5px solid #000; font-size: 9.5px; font-weight: bold; color: #334155;">
                NO. PEMESANAN: <span style="font-family: monospace; font-size: 10.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${doc.document_number}</span>
              </td>
              <td style="width: 50%; padding: 4px 8px; font-size: 9.5px; font-weight: bold; color: #334155;">
                NO. PESANAN KERAJAAN: -
              </td>
            </tr>
          </table>

          <!-- Main Catalogue Table -->
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 9.5px; background-color: #fff;">
            <thead>
              <tr style="border-bottom: 1.5px solid #000; text-align: center; text-transform: uppercase; background-color: #f1f5f9; height: 28px;">
                <th style="padding: 4px 6px; width: 20%; border-right: 1.5px solid #000; font-size: 8.5px; font-weight: 800; color: #0f172a;">PERIHAL BARANG</th>
                <th style="padding: 4px 6px; width: 60%; border-right: 1.5px solid #000; font-size: 8.5px; font-weight: 800; color: #0f172a;" colspan="4">NO. PENDAFTARAN SILINDER</th>
                <th style="padding: 4px 6px; width: 10%; border-right: 1.5px solid #000; font-size: 8.5px; font-weight: 800; color: #0f172a;">KUANTITI DIHANTAR</th>
                <th style="padding: 4px 6px; width: 10%; font-size: 8.5px; font-weight: 800; color: #0f172a;">KUANTITI DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="font-weight: 900; text-transform: uppercase; font-size: 9.5px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; height: 26px; background-color: #f8fafc;">
                <td style="padding: 3px 8px; text-align: right; border-right: 1.5px solid #000;" colspan="5">JUMLAH</td>
                <td style="padding: 3px; text-align: center; border-right: 1.5px solid #000; font-family: monospace; font-size: 10.5px; font-weight: 900;">${totalQty}</td>
                <td style="padding: 3px; text-align: center; font-family: monospace; font-size: 10.5px; font-weight: 900;">0</td>
              </tr>
            </tbody>
          </table>

          <!-- Signatures Section -->
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-top: 12px; page-break-inside: avoid; break-inside: avoid; background-color: #fff;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 1.5px solid #000; height: 24px; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #0f172a; text-align: center;">
                <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 3px 4px;">AKUAN PENGELUARAN SILINDER & PEMESANAN</th>
                <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 3px 4px;">AKUAN TERIMA PEMBEKAL / PENGANGKUT</th>
                <th style="width: 33.33%; padding: 3px 4px;">AKUAN TERIMA PENERIMA (SELEPAS STOK DITERIMA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 33.33%; border-right: 1.5px solid #000; padding: 6px 8px; vertical-align: bottom; height: 85px;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 0 auto 8px auto;"></div>
                  <div style="font-size: 7.5px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: ${currentUser?.full_name || doc.creator?.full_name || 'AMRI AMIT'}</div>
                    <div>JAWATAN: ${currentUser?.jawatan || doc.creator?.jawatan || 'PENOLONG PEGAWAI FARMASI'}</div>
                    <div>TARIKH: ${new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </td>
                <td style="width: 33.33%; border-right: 1.5px solid #000; padding: 6px 8px; vertical-align: bottom; height: 85px;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 0 auto 8px auto;"></div>
                  <div style="font-size: 7.5px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: _______________________________</div>
                    <div>TARIKH: _____________________________</div>
                    <div>COP JABATAN: _________________________</div>
                  </div>
                </td>
                <td style="width: 33.33%; padding: 6px 8px; vertical-align: bottom; height: 85px;">
                  <div style="border-bottom: 1px dashed #94a3b8; width: 85%; margin: 0 auto 8px auto;"></div>
                  <div style="font-size: 7.5px; line-height: 1.4; color: #334155; font-weight: 600;">
                    <div>NAMA: _______________________________</div>
                    <div>JAWATAN: ____________________________</div>
                    <div>TARIKH: _____________________________</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Document Disclaimer -->
          <div style="text-align: center; margin-top: 8px; font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px; color: #334155; page-break-inside: avoid; break-inside: avoid;">
            BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN
          </div>

          <!-- Footer Metadata -->
          <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 4px; font-family: sans-serif; margin-top: 4px; page-break-inside: avoid; break-inside: avoid;">
            <div>Generated by HOME Ecosystem | ${todayDateStr}, ${todayTimeStr}</div>
            <div>Page ${pageNum} of ${totalPages}</div>
          </div>
        </div>
      `;
    };

    const pagesHtml = pagesToRender.map((p, idx) => generatePageHtml(p.titleTag, p.cyls, idx + 1, pagesToRender.length)).join('');

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
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
            }
            html, body { 
              font-family: 'Inter', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: black; 
              font-size: 9.5px;
              line-height: 1.3;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page {
              width: 100%;
              box-sizing: border-box;
              page-break-after: always;
              break-after: page;
            }
            .print-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .text-center { text-align: center; }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-page {
                page-break-after: always;
                break-after: page;
              }
              .print-page:last-child {
                page-break-after: auto;
                break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
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
      <div className="bg-white text-black p-6 sm:p-8 border border-slate-300 shadow-xl max-w-[210mm] min-h-[297mm] mx-auto my-4 flex flex-col justify-between font-sans text-xs select-none">
        <div>
          {/* Header Title */}
          <div className="flex items-start justify-between gap-4 mb-2 font-sans">
            <div className="flex items-start gap-3">
              <img src="/512px-Jata_MalaysiaV2.svg.png" className="h-[48px] w-auto flex-shrink-0 mt-0.5" alt="Jata Negara" />
              <div className="text-left leading-tight">
                <div className="text-[13px] font-extrabold tracking-wide text-slate-900 uppercase mb-0.5">HOSPITAL LAWAS</div>
                <div className="text-[9.5px] font-medium text-slate-600">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
              </div>
            </div>
            <div className="text-right text-[9.5px] text-slate-600 leading-snug min-w-[160px]">
              <div><strong className="text-slate-700 font-bold">Telefon:</strong> 085-283781</div>
              <div><strong className="text-slate-700 font-bold">Faks:</strong> 085-285993</div>
              <div><strong className="text-slate-700 font-bold">Email:</strong> hosp_lawas@moh.gov.my</div>
            </div>
          </div>
          <div className="border-b border-slate-300 mt-1 mb-3" />

          <div className="text-center mb-3">
            <h1 className="text-[12.5px] font-black tracking-wide uppercase text-black">
              BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
            </h1>
            <h2 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-700 mt-0.5">
              {titleTag}
            </h2>
          </div>

          {/* Daripada / Kepada Info Box */}
          <div className="grid grid-cols-2 border-[1.5px] border-black text-[9.5px] bg-white">
            <div className="border-r-[1.5px] border-black p-2.5 space-y-1 text-left">
              <div className="text-[8px] font-extrabold text-slate-500 tracking-wider uppercase">DARIPADA (FROM)</div>
              <div className="text-[10.5px] font-black text-slate-900 uppercase">HOSPITAL LAWAS</div>
              <div className="text-[8.5px] text-slate-800 font-medium leading-tight">Jalan Hospital, 98850 Lawas, Sarawak, Malaysia.</div>
              <div className="text-[8.5px] text-slate-800 font-medium leading-tight">TEL: 085-283781 &bull; FAKS: 085-285993</div>
            </div>
            <div className="p-2.5 space-y-1 text-left">
              <div className="text-[8px] font-extrabold text-slate-500 tracking-wider uppercase">KEPADA (TO)</div>
              <div className="text-[10.5px] font-black text-slate-900 uppercase">{doc?.supplier?.company_name || 'LINDE EOX SDN BHD (CAW. MIRI)'}</div>
              {(doc?.supplier?.address || 'LOT 1525, PIASAU IND. ESTATE\n98000 MIRI, SARAWAK.').split('\n').map((line, idx) => (
                <div key={idx} className="text-[8.5px] text-slate-800 font-medium leading-tight">{line.trim()}</div>
              ))}
            </div>
          </div>

          {/* Document and PO Reference Numbers */}
          <div className="grid grid-cols-2 border-x-[1.5px] border-b-[1.5px] border-black text-[9.5px] font-bold mb-3 bg-slate-50">
            <div className="border-r-[1.5px] border-black p-1.5 text-left text-slate-700">
              NO. PEMESANAN: <span className="font-extrabold font-mono text-[10.5px] text-black tracking-wide">{doc?.document_number}</span>
            </div>
            <div className="p-1.5 text-left text-slate-700">
              NO. PESANAN KERAJAAN: -
            </div>
          </div>

          {/* Main Catalogue Table */}
          <table className="w-full border-collapse border-[1.5px] border-black text-[9.5px] font-bold bg-white">
            <thead>
              <tr className="border-b-[1.5px] border-black bg-slate-100 text-center uppercase h-7">
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[20%] text-[8.5px] font-black text-slate-900">PERIHAL BARANG</th>
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[60%] text-[8.5px] font-black text-slate-900" colSpan={4}>NO. PENDAFTARAN SILINDER</th>
                <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[10%] text-[8.5px] font-black text-slate-900">KUANTITI DIHANTAR</th>
                <th className="py-1 px-2 text-center w-[10%] text-[8.5px] font-black text-slate-900">KUANTITI DITERIMA</th>
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

                    rows.push(
                      <React.Fragment key={sizeLabel}>
                        {/* Group Sub-Header Row */}
                        <tr className="border-b-[1.5px] border-black bg-slate-50 font-black h-6">
                          <td className="border-r-[1.5px] border-black py-1 px-2.5 text-left text-slate-900 text-[9px]">
                            SIZE: {sizeLabel}
                          </td>
                          <td className="border-r-[1.5px] border-black" colSpan={4}></td>
                          <td className="border-r-[1.5px] border-black py-1 px-2 text-center text-[9.5px] font-black text-slate-900">
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
                                className={`py-1 px-1 ${
                                  cylIdx === 3 ? 'border-r-[1.5px] border-black' : 'border-r border-slate-200'
                                }`}
                              >
                                {cyl ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[8px] font-semibold text-slate-700">
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
                const targetRowCount = 5;
                while (renderedRowsCount < targetRowCount) {
                  rows.push(
                    <tr key={`empty-${renderedRowsCount}`} className="border-b border-slate-200 text-center h-[24px]">
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
              <tr className="font-extrabold uppercase border-b-[1.5px] border-black text-[9.5px] h-[26px] bg-slate-50">
                <td className="border-r-[1.5px] border-black py-1 px-3 text-right text-slate-900" colSpan={5}>
                  JUMLAH
                </td>
                <td className="border-r-[1.5px] border-black py-1 px-2 text-center font-black font-mono text-[10.5px] text-slate-900">
                  {totalQty}
                </td>
                <td className="py-1 px-2 text-center font-black font-mono text-[10.5px] text-slate-900">
                  0
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section containing signatures, disclaimer, and footer */}
        <div className="mt-4">
          {/* Signatures Section */}
          <div className="grid grid-cols-3 border-[1.5px] border-black text-[8.5px] font-bold bg-white divide-x-[1.5px] divide-black">
            <div className="flex flex-col justify-between h-[110px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1 uppercase tracking-wide bg-slate-50 text-[8px] text-slate-900 h-6 flex items-center justify-center">
                AKUAN PENGELUARAN SILINDER & PEMESANAN
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-4 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-2" />
                <div className="space-y-0.5 text-[7.5px] text-slate-700 font-semibold">
                  <div>NAMA: {currentUser?.full_name || doc?.creator?.full_name || 'AMRI AMIT'}</div>
                  <div>JAWATAN: {currentUser?.jawatan || doc?.creator?.jawatan || 'PENOLONG PEGAWAI FARMASI'}</div>
                  <div>TARIKH: {doc ? new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-[110px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1 uppercase tracking-wide bg-slate-50 text-[8px] text-slate-900 h-6 flex items-center justify-center">
                AKUAN TERIMA PEMBEKAL / PENGANGKUT
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-4 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-2" />
                <div className="space-y-0.5 text-[7.5px] text-slate-700 font-semibold">
                  <div>NAMA: _______________________________</div>
                  <div>TARIKH: _____________________________</div>
                  <div>COP JABATAN: _________________________</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-[110px] p-0 text-left">
              <div className="text-center font-black border-b-[1.5px] border-black py-1 uppercase tracking-wide bg-slate-50 text-[8px] text-slate-900 h-6 flex items-center justify-center leading-tight">
                AKUAN TERIMA PENERIMA (SELEPAS DITERIMA)
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="h-4 border-b border-dashed border-slate-400 w-[85%] mx-auto mb-1 mt-2" />
                <div className="space-y-0.5 text-[7.5px] text-slate-700 font-semibold">
                  <div>NAMA: _______________________________</div>
                  <div>JAWATAN: ____________________________</div>
                  <div>TARIKH: _____________________________</div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Disclaimer */}
          <div className="text-center mt-2.5 font-black italic uppercase tracking-wider text-[8.5px] mb-2 text-slate-700">
            BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN
          </div>

          {/* Footer info generated from system */}
          <div className="flex justify-between text-[7.5px] text-slate-500 font-bold border-t border-slate-200 pt-1">
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
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
              {pagesToRender.map((p, idx) => (
                <div key={idx}>
                  <div className="max-w-[210mm] mx-auto text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">
                    Page {idx + 1}: {p.title}
                  </div>
                  {renderPreviewPage(p.titleTag, p.cyls, idx + 1, pagesToRender.length)}
                  {idx < pagesToRender.length - 1 && (
                    <div className="max-w-[210mm] mx-auto border-t-2 border-dashed border-slate-300 my-8 relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-100 px-4 text-xs font-bold text-slate-400">
                        PAGE BREAK
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
