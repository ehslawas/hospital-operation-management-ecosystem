import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, FileText } from 'lucide-react';
import { getReturnDocumentById } from '@/services/pharmacy/oxygenService';
import type { OxygenReturnDocumentWithRelations } from '@/types/pharmacy';
import { supabase } from '@/services/supabase';

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
            <tr style="border-bottom: 1px solid black; background-color: rgba(241, 245, 249, 0.5); font-weight: bold; height: 19px;">
              <td style="border-right: 1px solid black; padding: 3px 6px; text-align: left;" colspan="1">
                SIZE: ${sizeLabel}
              </td>
              <td style="border-right: 1px solid black;" colspan="4"></td>
              <td style="border-right: 1px solid black; padding: 3px 6px; text-align: center; font-size: 10px; font-weight: bold;" colspan="1">
                QTY: ${list.length}
              </td>
              <td style="padding: 3px 6px;" colspan="1"></td>
            </tr>
          `;
          renderedRowsCount++;

          chunks.forEach((chunk) => {
            rowsHtml += `
              <tr style="border-bottom: 1px solid black; text-align: center; font-family: monospace; height: 19px;">
                <td style="border-right: 1px solid black;"></td>
                <td style="border-right: 1px solid black; padding: 2px 4px; font-size: 9px; font-weight: 600;">${chunk[0] ? (chunk[0].qr_code || chunk[0].serial_number) : ''}</td>
                <td style="border-right: 1px solid black; padding: 2px 4px; font-size: 9px; font-weight: 600;">${chunk[1] ? (chunk[1].qr_code || chunk[1].serial_number) : ''}</td>
                <td style="border-right: 1px solid black; padding: 2px 4px; font-size: 9px; font-weight: 600;">${chunk[2] ? (chunk[2].qr_code || chunk[2].serial_number) : ''}</td>
                <td style="border-right: 1px solid black; padding: 2px 4px; font-size: 9px; font-weight: 600;">${chunk[3] ? (chunk[3].qr_code || chunk[3].serial_number) : ''}</td>
                <td style="border-right: 1px solid black;"></td>
                <td></td>
              </tr>
            `;
            renderedRowsCount++;
          });
        });
      }

      // Pad with empty rows to fill the table up to 21 rows
      const targetRowCount = 21;
      while (renderedRowsCount < targetRowCount) {
        rowsHtml += `
          <tr style="border-bottom: 1px solid black; text-align: center; height: 19px;">
            <td style="border-right: 1px solid black;"></td>
            <td style="border-right: 1px solid black; padding: 2px 4px;"></td>
            <td style="border-right: 1px solid black; padding: 2px 4px;"></td>
            <td style="border-right: 1px solid black; padding: 2px 4px;"></td>
            <td style="border-right: 1px solid black; padding: 2px 4px;"></td>
            <td style="border-right: 1px solid black;"></td>
            <td></td>
          </tr>
        `;
        renderedRowsCount++;
      }

      const totalQty = cylindersList.length;
      const todayDateStr = new Date(doc.created_at).toLocaleDateString('en-MY');
      const todayTimeStr = new Date(doc.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      return `
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
              BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
            </h1>
            <h2 style="font-size: 11px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase;">
              ${titleTag}
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
              NO. PEMESANAN: <span class="font-mono" style="font-size: 11px; font-weight: 900;">${doc.document_number}</span>
            </div>
            <div class="p-2">
              NO. PESANAN KERAJAAN: -
            </div>
          </div>

          <table class="w-full border-collapse border" style="font-weight: bold; font-size: 10px;">
            <thead>
              <tr style="border-bottom: 1px solid black; text-align: center; text-transform: uppercase;">
                <th class="border-r" style="padding: 8px 4px; width: 20%;">PERIHAL BARANG</th>
                <th class="border-r" style="padding: 8px 4px; width: 60%;" colspan="4">NO. PENDAFTARAN SILINDER</th>
                <th class="border-r" style="padding: 8px 4px; width: 10%;">KUANTITI DIHANTAR</th>
                <th style="padding: 8px 4px; width: 10%;">KUANTITI DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="font-weight: 900; text-transform: uppercase; font-size: 11px;">
                <td class="border-r" style="padding: 8px; text-align: right;" colspan="5">JUMLAH</td>
                <td class="border-r" style="padding: 8px; text-align: center;">${totalQty}</td>
                <td style="padding: 8px; text-align: center;">0</td>
              </tr>
            </tbody>
          </table>

          <div style="position: absolute; bottom: 25px; left: 10px; right: 10px;">
            <div class="grid grid-cols-3 border" style="font-weight: bold; font-size: 9px;">
              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 120px; padding: 6px;">
                <div class="text-center" style="border-bottom: 1px solid black; padding-bottom: 4px; text-transform: uppercase; font-weight: 900;">
                  AKUAN PENGELUARAN SILINDER & PEMESANAN
                </div>
                <div style="border-bottom: 1px dashed #666; width: 75%; margin: 20px auto 5px auto;"></div>
                <div style="font-size: 8px; line-height: 1.3;">
                  <div>NAMA: ${doc.creator?.full_name || 'AMRI AMIT'}</div>
                  <div>JAWATAN: PENOLONG PEGAWAI FARMASI</div>
                  <div>TARIKH: ${new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 120px; padding: 6px; border-left: 1px solid black;">
                <div class="text-center" style="border-bottom: 1px solid black; padding-bottom: 4px; text-transform: uppercase; font-weight: 900;">
                  AKUAN TERIMA PEMBEKAL / PENGANGKUT
                </div>
                <div style="border-bottom: 1px dashed #666; width: 75%; margin: 20px auto 5px auto;"></div>
                <div style="font-size: 8px; line-height: 1.3;">
                  <div>NAMA: _______________________________</div>
                  <div>TARIKH: _____________________________</div>
                  <div>COP JABATAN: _________________________</div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; justify-content: space-between; height: 120px; padding: 6px; border-left: 1px solid black;">
                <div class="text-center" style="border-bottom: 1px solid black; padding-bottom: 4px; text-transform: uppercase; font-weight: 900; line-height: 1.2;">
                  AKUAN TERIMA PENERIMA<br/>(DILENGKAPKAN SETELAH STOK DITERIMA)
                </div>
                <div style="border-bottom: 1px dashed #666; width: 75%; margin: 20px auto 5px auto;"></div>
                <div style="font-size: 8px; line-height: 1.3;">
                  <div>NAMA: _______________________________</div>
                  <div>JAWATAN: ____________________________</div>
                  <div>TARIKH: _____________________________</div>
                </div>
              </div>
            </div>

            <div class="text-center" style="margin-top: 15px; font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">
              BORANG INI HENDAKLAH DIISI DALAM TIGA (3) SALINAN
            </div>
          </div>

          <div style="position: absolute; bottom: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #666; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; font-family: sans-serif;">
            <div>Generated by HOME Ecosystem | ${todayDateStr}, ${todayTimeStr}</div>
            <div>Page ${pageNum} of ${totalPages}</div>
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
            .border-b-2 { border-bottom: 2px solid black; }
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
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .w-full { width: 100%; }
            .border-collapse { border-collapse: collapse; }
            .mt-4 { margin-top: 12px; }
            .mt-6 { margin-top: 20px; }
            .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
            .divide-x > * + * { border-left: 1px solid black; }
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
              BORANG PESANAN GAS PERUBATAN DAN PENGELUARAN SILINDER
            </h1>
            <h2 className="text-xs font-bold uppercase tracking-wide">
              {titleTag}
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
              NO. PEMESANAN: <span className="font-extrabold font-mono text-[11px]">{doc?.document_number}</span>
            </div>
            <div className="p-2">
              NO. PESANAN KERAJAAN: -
            </div>
          </div>

          {/* Main Catalogue Table */}
          <table className="w-full border-collapse border border-black text-[10px] font-bold">
            <thead>
              <tr className="border-b border-black bg-slate-50/20 text-center uppercase">
                <th className="border-r border-black py-2 px-1 text-center w-[20%]">PERIHAL BARANG</th>
                <th className="border-r border-black py-2 px-1 text-center w-[60%]" colSpan={4}>NO. PENDAFTARAN SILINDER</th>
                <th className="border-r border-black py-2 px-1 text-center w-[10%]">KUANTITI DIHANTAR</th>
                <th className="py-2 px-1 text-center w-[10%]">KUANTITI DITERIMA</th>
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
                        <tr className="border-b border-black bg-slate-50/10 font-black h-[19px]">
                          <td className="border-r border-black py-0.5 px-2 text-left">
                            SIZE: {sizeLabel}
                          </td>
                          <td className="border-r border-black" colSpan={4}></td>
                          <td className="border-r border-black py-0.5 px-2 text-center text-[10px] font-extrabold">
                            QTY: {cylinders.length}
                          </td>
                          <td className="py-0.5 px-2"></td>
                        </tr>

                        {/* Cylinder Rows */}
                        {chunks.map((chunk, chunkIdx) => (
                          <tr key={chunkIdx} className="border-b border-black text-center font-mono h-[19px]">
                            <td className="border-r border-black"></td>
                            {chunk.map((cyl, cylIdx) => (
                              <td key={cylIdx} className="border-r border-black py-0.5 px-1 text-[9px] font-semibold">
                                {cyl ? cyl.qr_code || cyl.serial_number : ''}
                              </td>
                            ))}
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                    renderedRowsCount += 1 + chunks.length;
                  });
                }

                // Pad with empty rows
                const targetRowCount = 21;
                while (renderedRowsCount < targetRowCount) {
                  rows.push(
                    <tr key={`empty-${renderedRowsCount}`} className="border-b border-black text-center h-[19px]">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black py-0.5 px-1"></td>
                      <td className="border-r border-black py-0.5 px-1"></td>
                      <td className="border-r border-black py-0.5 px-1"></td>
                      <td className="border-r border-black py-0.5 px-1"></td>
                      <td className="border-r border-black"></td>
                      <td></td>
                    </tr>
                  );
                  renderedRowsCount++;
                }

                return rows;
              })()}

              {/* Summary Footer Row */}
              <tr className="font-extrabold uppercase border-b border-black text-[10px] h-[19px]">
                <td className="border-r border-black py-0.5 px-2 text-right" colSpan={5}>
                  JUMLAH
                </td>
                <td className="border-r border-black py-0.5 px-2 text-center font-black">
                  {totalQty}
                </td>
                <td className="py-0.5 px-2 text-center">
                  0
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* Bottom Section containing signatures, disclaimer, and footer to keep them at the bottom */}
        <div className="mt-auto">
          {/* Signatures Section */}
          <div className="grid grid-cols-3 border border-black text-[9px] font-bold divide-x divide-black bg-white">
            <div className="flex flex-col justify-between h-32 p-1.5 text-left">
              <div className="text-center font-black border-b border-black pb-1 uppercase tracking-wide">
                AKUAN PENGELUARAN SILINDER & PEMESANAN
              </div>
              <div className="h-8 border-b border-dashed border-black/30 w-3/4 mx-auto mb-1" />
              <div className="space-y-0.5 text-[8px]">
                <div>NAMA: {doc?.creator?.full_name || 'AMRI AMIT'}</div>
                <div>JAWATAN: PENOLONG PEGAWAI FARMASI</div>
                <div>TARIKH: {doc ? new Date(doc.returned_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-32 p-1.5 text-left">
              <div className="text-center font-black border-b border-black pb-1 uppercase tracking-wide">
                AKUAN TERIMA PEMBEKAL / PENGANGKUT
              </div>
              <div className="h-8 border-b border-dashed border-black/30 w-3/4 mx-auto mb-1" />
              <div className="space-y-0.5 text-[8px]">
                <div>NAMA: _______________________________</div>
                <div>TARIKH: _____________________________</div>
                <div>COP JABATAN: _________________________</div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-32 p-1.5 text-left">
              <div className="text-center font-black border-b border-black pb-1 uppercase tracking-wide text-[8px] leading-tight">
                AKUAN TERIMA PENERIMA<br/>(DILENGKAPKAN SETELAH STOK DITERIMA)
              </div>
              <div className="h-8 border-b border-dashed border-black/30 w-3/4 mx-auto mb-1" />
              <div className="space-y-0.5 text-[8px]">
                <div>NAMA: _______________________________</div>
                <div>JAWATAN: ____________________________</div>
                <div>TARIKH: _____________________________</div>
              </div>
            </div>
          </div>

          {/* Document Disclaimer */}
          <div className="text-center mt-3 font-black italic uppercase tracking-wider text-[9px] mb-4">
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
