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
          <tr style="border-bottom: 1px solid black; text-align: center; height: 26px;">
            <td style="border-right: 1px solid black; padding: 4px;">${index + 1}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold; font-family: monospace;">${displayCode}</td>
            <td style="border-right: 1px solid black; padding: 4px; text-align: left; font-weight: bold;">${sizeDesc}</td>
            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold; font-size: 11px;">${item.quantity}</td>
            <td style="padding: 4px; text-align: left; font-weight: bold; font-style: italic; font-size: 9px; color: #333;">${item.usage_notes || '-'}</td>
          </tr>
        `;
        renderedRowsCount++;
      });
    }

    // Pad with empty rows to make the table look full
    const targetRowCount = 10;
    while (renderedRowsCount < targetRowCount) {
      rowsHtml += `
        <tr style="border-bottom: 1px solid black; text-align: center; height: 26px;">
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
          <title>Request Document - ${doc.document_number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: portrait;
              margin: 10mm;
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
              height: 275mm;
              box-sizing: border-box;
              padding: 5mm;
            }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 12px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .border { border: 1px solid black; }
            .border-x { border-left: 1px solid black; border-right: 1px solid black; }
            .border-b { border-bottom: 1px solid black; }
            .border-r { border-right: 1px solid black; }
            .p-2 { padding: 6px; }
            .space-y-1 > * { margin-bottom: 3px; }
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
            <div style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; margin-bottom: 12px;">
              <img src="${logoUrl}" style="height: 55px; width: auto; flex-shrink: 0;" />
              <div style="text-align: left; font-family: 'Inter', Arial, sans-serif;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: #111; text-transform: uppercase; line-height: 1.2;">KEMENTERIAN KESIHATAN MALAYSIA</div>
                <div style="font-size: 13px; font-weight: 900; color: #000; margin-top: 2px; text-transform: uppercase; line-height: 1.2;">HOSPITAL DAERAH LAWAS</div>
                <div style="font-size: 8px; font-weight: 500; color: #555; margin-top: 2px; line-height: 1.2;">98850 LAWAS, SARAWAK &bull; TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
              </div>
            </div>
            <hr style="border: none; border-top: 2px solid black; border-bottom: 0.5px solid black; height: 3px; margin: 0 0 12px 0;" />

            <div class="text-center mb-4">
              <h1 style="font-size: 13px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                BORANG PESANAN / PERMINTAAN BEKALAN SILINDER GAS PERUBATAN
              </h1>
              <h2 style="font-size: 11px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase;">
                (SILINDER SEWAAN / LOAN CYLINDER)
              </h2>
            </div>

            <div class="grid grid-cols-2 border" style="font-weight: bold; font-size: 10px;">
              <div class="border-r p-2 space-y-1">
                <div>DARIPADA: HOSPITAL DAERAH LAWAS</div>
                <div class="pl-6" style="font-size: 9px; font-weight: normal; color: #333;">98850, LAWAS, SARAWAK.</div>
                <div class="pl-6" style="font-size: 9px; font-weight: normal; color: #333;">TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
              </div>
              <div class="p-2 space-y-1">
                <div>KEPADA: LINDE EOX SDN BHD (CAW. MIRI)</div>
                <div class="pl-6" style="font-size: 9px; font-weight: normal; color: #333;">LOT 1525, PIASAU IND. ESTATE</div>
                <div class="pl-6" style="font-size: 9px; font-weight: normal; color: #333;">98000 MIRI, SARAWAK.</div>
              </div>
            </div>

            <div class="grid grid-cols-2 border-x border-b" style="font-weight: bold; margin-bottom: 16px;">
              <div class="border-r p-2">
                NO. RUJUKAN PESANAN: <span class="font-mono" style="font-size: 11px; font-weight: 900;">${doc.document_number}</span>
              </div>
              <div class="p-2">
                NO. PESANAN KERAJAAN: -
              </div>
            </div>

            <table class="w-full border-collapse border" style="font-weight: bold; font-size: 10px;">
              <thead>
                <tr style="border-bottom: 1px solid black; text-align: center; text-transform: uppercase;">
                  <th class="border-r" style="padding: 8px 4px; width: 8%;">BIL</th>
                  <th class="border-r" style="padding: 8px 4px; width: 15%;">KOD SAIZ</th>
                  <th class="border-r" style="padding: 8px 4px; width: 45%;">SPESIFIKASI BARANG</th>
                  <th class="border-r" style="padding: 8px 4px; width: 12%;">KUANTITI DIPOHON</th>
                  <th style="padding: 8px 4px; width: 20%;">JUSTIFIKASI / KEGUNAAN</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="font-weight: 900; text-transform: uppercase; font-size: 11px;">
                  <td class="border-r" style="padding: 8px; text-align: right;" colspan="3">JUMLAH BESAR</td>
                  <td class="border-r" style="padding: 8px; text-align: center;">${totalQty}</td>
                  <td style="padding: 8px; text-align: center;">-</td>
                </tr>
              </tbody>
            </table>

            <div style="position: absolute; bottom: 35px; left: 10px; right: 10px;">
              <div style="text-align: center; border: 1px solid black; padding: 16px 8px; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                TIDAK MEMERLUKAN TANDATANGAN KERANA DOKUMEN INI DIJANA SECARA ELEKTRONIK OLEH SISTEM (HOME)
              </div>
            </div>

            <div style="position: absolute; bottom: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #666; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; font-family: sans-serif;">
              <div>Generated by HOME Ecosystem | ${todayDateStr}, ${todayTimeStr}</div>
              <div>Page 1 of 1</div>
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
                <div className="flex items-center justify-start gap-4 mb-3 font-sans">
                  <img src="/512px-Jata_MalaysiaV2.svg.png" className="h-[55px] w-auto flex-shrink-0" alt="Jata Negara" />
                  <div className="text-left">
                    <div className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase leading-tight">KEMENTERIAN KESIHATAN MALAYSIA</div>
                    <div className="text-[13px] font-black text-black mt-0.5 uppercase leading-tight">HOSPITAL DAERAH LAWAS</div>
                    <div className="text-[8px] font-medium text-slate-600 mt-0.5 leading-tight">98850 LAWAS, SARAWAK &bull; TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
                  </div>
                </div>
                <hr className="border-none border-t-2 border-b-[0.5px] border-black h-[3px] mt-2 mb-3" />

                <div className="text-center mb-4">
                  <h1 className="text-[13px] font-black tracking-wide uppercase">
                    BORANG PESANAN / PERMINTAAN BEKALAN SILINDER GAS PERUBATAN
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-wide">
                    (SILINDER SEWAAN / LOAN CYLINDER)
                  </h2>
                </div>

                {/* Daripada / Kepada Info Box */}
                <div className="grid grid-cols-2 border border-black text-[10px] font-bold">
                  <div className="border-r border-black p-2 space-y-1">
                    <div>DARIPADA: HOSPITAL DAERAH LAWAS</div>
                    <div className="pl-6 text-[9px] text-slate-800 font-medium">98850, LAWAS, SARAWAK.</div>
                    <div className="pl-6 text-[9px] text-slate-800 font-medium">TEL: 085 283 781 (ext-206) &bull; EMEL: hosplws@gmail.com</div>
                  </div>
                  <div className="p-2 space-y-1">
                    <div>KEPADA: LINDE EOX SDN BHD (CAW. MIRI)</div>
                    <div className="pl-6 text-[9px] text-slate-800 font-medium">LOT 1525, PIASAU IND. ESTATE</div>
                    <div className="pl-6 text-[9px] text-slate-800 font-medium">98000 MIRI, SARAWAK.</div>
                  </div>
                </div>

                {/* Document and PO Reference Numbers */}
                <div className="grid grid-cols-2 border-x border-b border-black text-[10px] font-bold mb-4">
                  <div className="border-r border-black p-2">
                    NO. RUJUKAN PESANAN: <span className="font-extrabold font-mono text-[11px]">{doc?.document_number}</span>
                  </div>
                  <div className="p-2">
                    NO. PESANAN KERAJAAN: -
                  </div>
                </div>

                {/* Main Catalogue Table */}
                <table className="w-full border-collapse border border-black text-[10px] font-bold">
                  <thead>
                    <tr className="border-b border-black bg-slate-50/20 text-center uppercase">
                      <th className="border-r border-black py-2 px-1 text-center w-[8%]">BIL</th>
                      <th className="border-r border-black py-2 px-1 text-center w-[15%]">KOD SAIZ</th>
                      <th className="border-r border-black py-2 px-1 text-center w-[45%]">SPESIFIKASI BARANG</th>
                      <th className="border-r border-black py-2 px-1 text-center w-[12%]">KUANTITI DIPOHON</th>
                      <th className="py-2 px-1 text-center w-[20%]">JUSTIFIKASI / KEGUNAAN</th>
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
                            <tr key={item.id} className="border-b border-black text-center h-[26px]">
                              <td className="border-r border-black py-1 px-1">{index + 1}</td>
                              <td className="border-r border-black py-1 px-1 font-mono font-bold">{displayCode}</td>
                              <td className="border-r border-black py-1 px-2 text-left">{sizeDesc}</td>
                              <td className="border-r border-black py-1 px-1 text-[11px] font-extrabold">{item.quantity}</td>
                              <td className="py-1 px-2 text-left text-[9px] font-medium italic text-slate-800">{item.usage_notes || '-'}</td>
                            </tr>
                          );
                          renderedRowsCount++;
                        });
                      }

                      // Pad with empty rows
                      const targetRowCount = 10;
                      while (renderedRowsCount < targetRowCount) {
                        rows.push(
                          <tr key={`empty-${renderedRowsCount}`} className="border-b border-black text-center h-[26px]">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        );
                        renderedRowsCount++;
                      }

                      return rows;
                    })()}

                    {/* Summary Footer Row */}
                    <tr className="font-extrabold uppercase border-b border-black text-[10px] h-[26px]">
                      <td className="border-r border-black py-1 px-2 text-right" colSpan={3}>
                        JUMLAH BESAR
                      </td>
                      <td className="border-r border-black py-1 px-1 text-center font-black">
                        {doc.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </td>
                      <td className="py-1 px-2 text-center">
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Section containing signatures, disclaimer, and footer */}
              <div className="mt-auto">
                {/* Signatures Section */}
                <div className="text-center border border-black py-4 px-2 font-black text-[10px] uppercase tracking-wide bg-white">
                  TIDAK MEMERLUKAN TANDATANGAN KERANA DOKUMEN INI DIJANA SECARA ELEKTRONIK OLEH SISTEM (HOME)
                </div>


                {/* Footer info generated from system */}
                <div className="flex justify-between text-[8px] text-slate-500 font-bold border-t border-slate-200 pt-1">
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
