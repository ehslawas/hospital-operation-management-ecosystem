// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, FileText } from 'lucide-react';
import { getRequestDocumentById } from '@/services/pharmacy/oxygenService';
import type { OxygenRequestDocumentWithRelations } from '@/types/pharmacy';

interface RequestDocumentPrintViewProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestDocumentPrintView: React.FC<RequestDocumentPrintViewProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const [doc, setDoc] = useState<OxygenRequestDocumentWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatedDate = doc ? new Date(doc.created_at).toLocaleDateString('en-MY') : '';
  const generatedTime = doc ? new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocumentDetails();
    }
  }, [isOpen, documentId]);

  const loadDocumentDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRequestDocumentById(documentId);
      if (res.error) throw new Error(res.error);
      setDoc(res.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuatkan butiran dokumen pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!doc) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Sila benarkan tetingkap timbul (popups) untuk mencetak dokumen.');
      return;
    }

    const docCreatedDate = new Date(doc.created_at).toLocaleDateString('en-MY').replace(/\//g, '-');
    const docCreatedTime = new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '-');
    try {
      printWindow.history.replaceState(null, '', `/print/request-document/${doc.document_number}/created-at/${docCreatedDate}_${docCreatedTime}`);
    } catch (e) {
      console.error(e);
    }

    const logoUrl = window.location.origin + '/512px-Jata_MalaysiaV2.svg.png';
    const totalQty = doc.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const todayDateStr = new Date(doc.created_at).toLocaleDateString('en-MY');
    const todayTimeStr = new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    // Generate table rows
    let rowsHtml = '';
    let renderedRowsCount = 0;

    if (doc.items && doc.items.length > 0) {
      doc.items.forEach((item, index) => {
        let sizeDesc = '';
        if (item.size_code === '101-N') {
          sizeDesc = 'Silinder Sewaan Gas Oksigen BN (8.0m³)';
        } else if (item.size_code === 'P101-F' || item.size_code === '101-F') {
          sizeDesc = 'Silinder Sewaan Gas Oksigen PI (1.4m³)';
        } else {
          sizeDesc = `Silinder Oksigen ${item.size_code}`;
        }

        const displayCode = item.size_code === 'P101-F' ? '101-F' : item.size_code;
        rowsHtml += `
          <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 28px;">
            <td style="border-right: 1.5px solid #000; padding: 4px; font-size: 9px;">${index + 1}</td>
            <td style="border-right: 1.5px solid #000; padding: 4px; font-weight: 700; font-family: monospace; font-size: 10px;">${displayCode}</td>
            <td style="border-right: 1.5px solid #000; padding: 6px 10px; text-align: left; font-size: 9.5px; font-weight: 600;">${sizeDesc}</td>
            <td style="border-right: 1.5px solid #000; padding: 4px; font-weight: 800; font-size: 11px; font-variant-numeric: tabular-nums;">${item.quantity}</td>
            <td style="padding: 6px 10px; text-align: left; font-style: italic; font-size: 9px; color: #334155; font-weight: 500;">${item.usage_notes || '-'}</td>
          </tr>
        `;
        renderedRowsCount++;
      });
    }

    // Pad with empty rows to make the table look full
    const targetRowCount = 5;
    while (renderedRowsCount < targetRowCount) {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #ccc; text-align: center; height: 26px;">
          <td style="border-right: 1.5px solid #000;"></td>
          <td style="border-right: 1.5px solid #000;"></td>
          <td style="border-right: 1.5px solid #000;"></td>
          <td style="border-right: 1.5px solid #000;"></td>
          <td></td>
        </tr>
      `;
      renderedRowsCount++;
    }

    const supplierName = doc.supplier?.company_name || 'LINDE EOX SDN BHD (CAW. MIRI)';
    const supplierAddressLines = (doc.supplier?.address || 'LOT 1525, PIASAU IND. ESTATE\n98000 MIRI, SARAWAK.')
      .split('\n')
      .map(line => `<div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">${line.trim()}</div>`)
      .join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Request Document - ${doc.document_number}</title>
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
            }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 12px; }
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
            .w-full { width: 100%; }
            .border-collapse { border-collapse: collapse; }
            .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
          </style>
        </head>
        <body>
          <div class="print-page">
            <div style="flex: 1; width: 100%;">
              <div style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; margin-bottom: 8px;">
              <img src="${logoUrl}" style="height: 55px; width: auto; flex-shrink: 0;" />
              <div style="text-align: left; font-family: 'Inter', Arial, sans-serif;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase; line-height: 1.2;">KEMENTERIAN KESIHATAN MALAYSIA</div>
                <div style="font-size: 13px; font-weight: 900; color: #000; margin-top: 2px; text-transform: uppercase; line-height: 1.2;">HOSPITAL DAERAH LAWAS</div>
                <div style="font-size: 8px; font-weight: 500; color: #475569; margin-top: 2px; line-height: 1.2;">98850 LAWAS, SARAWAK &bull; TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
              </div>
            </div>
            <div style="border-bottom: 2.5px solid #000; border-top: 0.5px solid #000; height: 3px; margin: 2px 0 12px 0;"></div>

            <div class="text-center mb-4">
              <h1 style="font-size: 13px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
                BORANG PESANAN / PERMINTAAN BEKALAN SILINDER GAS PERUBATAN
              </h1>
              <h2 style="font-size: 10px; font-weight: 700; margin: 4px 0 0 0; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">
                (SILINDER SEWAAN / LOAN CYLINDER)
              </h2>
            </div>

            <div class="grid grid-cols-2 border" style="font-size: 10px; border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background-color: #fff;">
              <div class="border-r p-3 space-y-1.5" style="border-right: 1.5px solid #000;">
                <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">DARIPADA (FROM)</div>
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">HOSPITAL DAERAH LAWAS</div>
                <div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">98850, LAWAS, SARAWAK.</div>
                <div style="font-size: 9px; font-weight: 500; color: #334155; line-height: 1.3;">TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
              </div>
              <div class="p-3 space-y-1.5">
                <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">KEPADA (TO)</div>
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${supplierName}</div>
                ${supplierAddressLines}
              </div>
            </div>

            <div class="grid grid-cols-2 border-x border-b" style="font-weight: bold; margin-bottom: 16px; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000;">
              <div class="border-r p-2 bg-slate-50/30" style="border-right: 1.5px solid #000; font-size: 10px; color: #334155;">
                NO. RUJUKAN PESANAN: <span class="font-mono" style="font-size: 11px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${doc.document_number}</span>
              </div>
              <div class="p-2 bg-slate-50/30" style="font-size: 10px; color: #334155;">
                NO. PESANAN KERAJAAN: -
              </div>
            </div>

            <table class="w-full border-collapse border" style="font-size: 10px; border: 1.5px solid #000;">
              <thead>
                <tr style="border-bottom: 1.5px solid #000; text-align: center; text-transform: uppercase; background-color: #f1f5f9; height: 32px;">
                  <th class="border-r" style="padding: 6px 4px; width: 8%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">BIL</th>
                  <th class="border-r" style="padding: 6px 4px; width: 15%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">KOD SAIZ</th>
                  <th class="border-r" style="padding: 6px 4px; width: 45%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">SPESIFIKASI BARANG</th>
                  <th class="border-r" style="padding: 6px 4px; width: 12%; border-right: 1.5px solid #000; font-size: 9px; font-weight: 800; color: #0f172a;">KUANTITI DIPOHON</th>
                  <th style="padding: 6px 4px; width: 20%; font-size: 9px; font-weight: 800; color: #0f172a;">JUSTIFIKASI / KEGUNAAN</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="font-weight: 900; text-transform: uppercase; font-size: 10px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; height: 28px; background-color: #f8fafc;">
                  <td class="border-r" style="padding: 4px 10px; text-align: right; border-right: 1.5px solid #000;" colspan="3">JUMLAH BESAR</td>
                  <td class="border-r font-mono" style="padding: 4px; text-align: center; border-right: 1.5px solid #000; font-size: 11px; font-weight: 900; font-variant-numeric: tabular-nums;">${totalQty}</td>
                  <td style="padding: 4px; text-align: center;">-</td>
                </tr>
              </tbody>
            </table>
          </div>

            <div style="margin-top: auto; padding-top: 15px; page-break-inside: avoid; break-inside: avoid; width: 100%;">
              <div style="text-align: center; border: 1.5px solid #000; padding: 16px 8px; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background-color: #fff; border-radius: 4px;">
                TIDAK MEMERLUKAN TANDATANGAN KERANA DOKUMEN INI DIJANA SECARA ELEKTRONIK OLEH SISTEM (HOME)
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 5px; font-family: sans-serif; margin-top: 10px;">
                <div>Generated by HOME Ecosystem | ${todayDateStr}, ${todayTimeStr}</div>
                <div>Page 1 of 1</div>
              </div>
            </div>
          </div>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-100 border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Controls */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white rounded-t-3xl shadow-sm">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">Request Document Viewer</span>
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
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <span className="text-slate-500 font-semibold text-sm">Loading document layout...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-600 font-bold">
              {error}
            </div>
          ) : doc ? (
            <div className="bg-white text-black p-8 border border-slate-300 shadow-lg max-w-[210mm] min-h-[297mm] mx-auto my-6 relative flex flex-col justify-between font-sans text-xs select-none">
              <div>
                {/* Header Title */}
                <div className="flex items-center justify-start gap-4 mb-2 font-sans">
                  <img src="/512px-Jata_MalaysiaV2.svg.png" className="h-[55px] w-auto flex-shrink-0" alt="Jata Negara" />
                  <div className="text-left">
                    <div className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase leading-tight">KEMENTERIAN KESIHATAN MALAYSIA</div>
                    <div className="text-[13px] font-black text-black mt-0.5 uppercase leading-tight">HOSPITAL DAERAH LAWAS</div>
                    <div className="text-[8px] font-medium text-slate-600 mt-0.5 leading-tight">98850 LAWAS, SARAWAK &bull; TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
                  </div>
                </div>
                <div className="border-b-[2.5px] border-t-[0.5px] border-black h-[3px] mt-1 mb-3" />

                <div className="text-center mb-4">
                  <h1 className="text-[13px] font-black tracking-wide uppercase text-black">
                    BORANG PESANAN / PERMINTAAN BEKALAN SILINDER GAS PERUBATAN
                  </h1>
                  <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-700 mt-1">
                    (SILINDER SEWAAN / LOAN CYLINDER)
                  </h2>
                </div>

                {/* Daripada / Kepada Info Box */}
                <div className="grid grid-cols-2 border-[1.5px] border-black text-[10px] bg-white rounded overflow-hidden">
                  <div className="border-r-[1.5px] border-black p-3 space-y-1.5 text-left bg-white">
                    <div className="text-[8.5px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">DARIPADA (FROM)</div>
                    <div className="text-[11px] font-black text-slate-900 uppercase">HOSPITAL DAERAH LAWAS</div>
                    <div className="text-[9px] text-slate-800 font-medium leading-relaxed">98850, LAWAS, SARAWAK.</div>
                    <div className="text-[9px] text-slate-800 font-medium leading-relaxed">TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
                  </div>
                  <div className="p-3 space-y-1.5 text-left bg-white">
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
                    NO. RUJUKAN PESANAN: <span className="font-extrabold font-mono text-[11px] text-black tracking-wide">{doc?.document_number}</span>
                  </div>
                  <div className="p-2 text-left text-slate-700">
                    NO. PESANAN KERAJAAN: -
                  </div>
                </div>

                {/* Main Catalogue Table */}
                <table className="w-full border-collapse border-[1.5px] border-black text-[10px] font-bold bg-white">
                  <thead>
                    <tr className="border-b-[1.5px] border-black bg-slate-50 text-center uppercase h-8">
                      <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[8%] text-[9px] font-black text-slate-900">BIL</th>
                      <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[15%] text-[9px] font-black text-slate-900">KOD SAIZ</th>
                      <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[45%] text-[9px] font-black text-slate-900">SPESIFIKASI BARANG</th>
                      <th className="border-r-[1.5px] border-black py-1 px-2 text-center w-[12%] text-[9px] font-black text-slate-900">KUANTITI DIPOHON</th>
                      <th className="py-1 px-2 text-center w-[20%] text-[9px] font-black text-slate-900">JUSTIFIKASI / KEGUNAAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let renderedRowsCount = 0;

                      if (doc.items && doc.items.length > 0) {
                        doc.items.forEach((item, index) => {
                          let sizeDesc = '';
                          if (item.size_code === '101-N') {
                            sizeDesc = 'Silinder Sewaan Gas Oksigen BN (8.0m³)';
                          } else if (item.size_code === 'P101-F' || item.size_code === '101-F') {
                            sizeDesc = 'Silinder Sewaan Gas Oksigen PI (1.4m³)';
                          } else {
                            sizeDesc = `Silinder Oksigen ${item.size_code}`;
                          }

                          const displayCode = item.size_code === 'P101-F' ? '101-F' : item.size_code;
                          rows.push(
                            <tr key={item.id} className="border-b border-slate-200 text-center h-[28px]">
                              <td className="border-r-[1.5px] border-black py-1 px-1">{index + 1}</td>
                              <td className="border-r-[1.5px] border-black py-1 px-1 font-mono font-bold text-slate-800">{displayCode}</td>
                              <td className="border-r-[1.5px] border-black py-1 px-2 text-left text-slate-800 font-semibold">{sizeDesc}</td>
                              <td className="border-r-[1.5px] border-black py-1 px-1 text-[11px] font-black font-mono text-slate-900">{item.quantity}</td>
                              <td className="py-1 px-2 text-left text-[9px] font-medium italic text-slate-700">{item.usage_notes || '-'}</td>
                            </tr>
                          );
                          renderedRowsCount++;
                        });
                      }

                      // Pad with empty rows
                      const targetRowCount = 5;
                      while (renderedRowsCount < targetRowCount) {
                        rows.push(
                          <tr key={`empty-${renderedRowsCount}`} className="border-b border-slate-200 text-center h-[26px]">
                            <td className="border-r-[1.5px] border-black"></td>
                            <td className="border-r-[1.5px] border-black"></td>
                            <td className="border-r-[1.5px] border-black"></td>
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
                      <td className="border-r-[1.5px] border-black py-1 px-2 text-right text-slate-900" colSpan={3}>
                        JUMLAH BESAR
                      </td>
                      <td className="border-r-[1.5px] border-black py-1 px-1 text-center font-black font-mono text-[11px] text-slate-900">
                        {doc.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </td>
                      <td className="py-1 px-2 text-center text-slate-700">
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Section containing signatures, disclaimer, and footer */}
              <div className="mt-auto">
                {/* Signatures Section */}
                <div className="text-center border-[1.5px] border-black py-3 px-2 font-black text-[10px] uppercase tracking-wide bg-white rounded shadow-sm text-slate-900">
                  TIDAK MEMERLUKAN TANDATANGAN KERANA DOKUMEN INI DIJANA SECARA ELEKTRONIK OLEH SISTEM (HOME)
                </div>


                {/* Footer info generated from system */}
                <div className="flex justify-between text-[8px] text-slate-500 font-bold border-t border-slate-200 pt-1 mt-4">
                  <div>Generated by HOME Ecosystem | {generatedDate}, {generatedTime}</div>
                  <div>Page 1 of 1</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
