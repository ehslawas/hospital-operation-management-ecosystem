import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CylinderDispatchRequestWithRelations } from '@/types/pharmacy';

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
};

const getCylinderVolume = (sizeCode: string): string => {
  const code = sizeCode.toUpperCase();
  if (code.includes('HS')) return '6.4m³';
  if (code.includes('D')) return '0.5m³';
  if (code.includes('E')) return '0.7m³';
  if (code.includes('F')) return '1.4m³';
  if (code.includes('N')) return '8.0m³';
  return '-';
};

const getCylinderSpecification = (sizeCode: string): string => {
  const code = sizeCode.toUpperCase();
  let sizeLabel = sizeCode;
  if (code.includes('N')) sizeLabel = 'BN';
  if (code.includes('F')) sizeLabel = 'PI / F';
  if (code.includes('E')) sizeLabel = 'E';
  if (code.includes('D')) sizeLabel = 'D';
  if (code.includes('HS')) sizeLabel = 'HS';
  
  return `Silinder Gas Oksigen Perubatan ${sizeLabel} (${getCylinderVolume(sizeCode)})`;
};

export async function generateCylinderDispatchPdf(
  request: CylinderDispatchRequestWithRelations,
  hospitalName: string = 'HOSPITAL DAERAH LAWAS'
): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const logoBase64 = await getBase64ImageFromUrl('/512px-Jata_MalaysiaV2.svg.png');

  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Render solid border frame and watermark
  const renderFrame = () => {
    if (logoBase64) {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState || (jsPDF as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }));
        }
        doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90);
        doc.restoreGraphicsState();
      } catch (err) {
        console.error('Error drawing crest watermark:', err);
      }
    }
    // Solid border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, 277);
  };

  renderFrame();

  // 1. Header (Malaysian crest, Kementerian Kesihatan, Hospital)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin + 5, 15, 20, 16);
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 19, { align: 'center' });
  doc.setFontSize(11);
  doc.text(hospitalName, pageWidth / 2, 24, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Peti Surat 70, 98850 Lawas, Sarawak', pageWidth / 2, 28, { align: 'center' });

  // Double line separator below header
  doc.setLineWidth(0.8);
  doc.line(margin + 5, 32, pageWidth - margin - 5, 32);
  doc.setLineWidth(0.2);
  doc.line(margin + 5, 33, pageWidth - margin - 5, 33);

  // 2. Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('BORANG PENGELUARAN / PERMINTAAN SILINDER GAS PERUBATAN', pageWidth / 2, 40, { align: 'center' });
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.text('Medical Oxygen Cylinder Request and Dispatch Document', pageWidth / 2, 44, { align: 'center' });

  // 3. Info Box Grid
  const gridY = 48;
  const boxHeight = 22;
  const colWidth = (contentWidth - 10) / 2;

  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  // Left Box
  doc.rect(margin + 5, gridY, colWidth, boxHeight);
  // Right Box
  doc.rect(margin + 5 + colWidth, gridY, colWidth, boxHeight);

  // Contents - Left Box
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('DARIPADA (FROM):', margin + 8, gridY + 4);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const deptName = request.department?.department_name || 'Unit Pemohon';
  doc.text(deptName.toUpperCase(), margin + 8, gridY + 9);
  doc.text('HOSPITAL DAERAH LAWAS', margin + 8, gridY + 14);

  // Contents - Right Box
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('KEPADA (TO):', margin + 8 + colWidth, gridY + 4);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('UNIT FARMASI LOGISTIK', margin + 8 + colWidth, gridY + 9);
  doc.text('HOSPITAL DAERAH LAWAS', margin + 8 + colWidth, gridY + 14);

  // Reference Numbers Grid
  const refY = gridY + boxHeight + 4;
  doc.rect(margin + 5, refY, contentWidth - 10, 10);
  doc.line(pageWidth / 2, refY, pageWidth / 2, refY + 10);

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('NO. RUJUKAN (REF NO):', margin + 8, refY + 3.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(request.request_number, margin + 8, refY + 8);

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('TARIKH & MASA (DATE & TIME):', pageWidth / 2 + 3, refY + 3.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const reqDateFormatted = new Date(request.request_date).toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  doc.text(reqDateFormatted, pageWidth / 2 + 3, refY + 8);

  // 4. Items Table
  const tableY = refY + 14;
  const tableData = (request.items || []).map((item, index) => [
    index + 1,
    item.size_code,
    getCylinderSpecification(item.size_code),
    item.quantity_requested,
    request.status === 'pending' || request.status === 'rejected' ? '-' : item.quantity_issued,
    item.usage_notes || '—'
  ]);

  // Totals
  const totalRequested = (request.items || []).reduce((sum, item) => sum + item.quantity_requested, 0);
  const totalIssued = (request.items || []).reduce((sum, item) => sum + item.quantity_issued, 0);
  
  tableData.push([
    '',
    '',
    'JUMLAH KESELURUHAN / TOTAL QUANTITY',
    totalRequested,
    request.status === 'pending' || request.status === 'rejected' ? '-' : totalIssued,
    ''
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [['BIL', 'KOD SAIZ', 'SPESIFIKASI BARANG', 'KUANTITI POHON', 'KUANTITI KELUAR', 'CATATAN']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      font: 'times',
      fontSize: 8.5,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { cellWidth: 30 }
    },
    margin: { left: margin + 5, right: margin + 5 },
    didParseCell: (data) => {
      // Bold the last row (Totals row)
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // 5. Signatures Grid (Pemohon, Pelulus, Pengeluar)
  // Get final Y after table
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Let's draw 3 columns for signatures if they fit, or go to next page
  const sigBoxHeight = 35;
  const sigColWidth = (contentWidth - 10) / 3;

  doc.setLineWidth(0.2);
  // Column 1 Box (Requester)
  doc.rect(margin + 5, finalY, sigColWidth, sigBoxHeight);
  // Column 2 Box (Approver)
  doc.rect(margin + 5 + sigColWidth, finalY, sigColWidth, sigBoxHeight);
  // Column 3 Box (Issuer)
  doc.rect(margin + 5 + sigColWidth * 2, finalY, sigColWidth, sigBoxHeight);

  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.text('1. PEMOHON / REQUESTER', margin + 7, finalY + 4);
  doc.text('2. PELULUS / APPROVER', margin + 7 + sigColWidth, finalY + 4);
  doc.text('3. PENGELUAR / ISSUER', margin + 7 + sigColWidth * 2, finalY + 4);

  // Signature contents
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);

  // Requester Info
  if (request.request_type === 'manual_issue') {
    doc.text('Nama: (MANUAL ISSUE)', margin + 7, finalY + 18);
    doc.text('Jawatan: -', margin + 7, finalY + 23);
    doc.text('Tarikh: -', margin + 7, finalY + 28);
  } else if (request.requester) {
    doc.text(`Nama: ${request.requester.full_name}`, margin + 7, finalY + 18, { maxWidth: sigColWidth - 4 });
    doc.text(`Jawatan: ${request.requester.jawatan || 'Pegawai'}`, margin + 7, finalY + 25, { maxWidth: sigColWidth - 4 });
    doc.text(`Tarikh: ${new Date(request.request_date).toLocaleDateString('ms-MY')}`, margin + 7, finalY + 32);
  } else {
    doc.text('Nama: ______________', margin + 7, finalY + 18);
    doc.text('Jawatan: ____________', margin + 7, finalY + 23);
    doc.text('Tarikh: _____________', margin + 7, finalY + 28);
  }

  // Approver Info
  if (request.approver && request.status !== 'pending' && request.status !== 'cancelled') {
    const appDateStr = request.approved_date ? new Date(request.approved_date).toLocaleDateString('ms-MY') : '—';
    const statusLabel = request.status === 'rejected' ? 'REJECTED' : 'APPROVED';
    doc.setFont('times', 'bold');
    doc.text(`STATUS: ${statusLabel}`, margin + 7 + sigColWidth, finalY + 10);
    doc.setFont('times', 'normal');
    doc.text(`Nama: ${request.approver.full_name}`, margin + 7 + sigColWidth, finalY + 18, { maxWidth: sigColWidth - 4 });
    doc.text(`Jawatan: ${request.approver.jawatan || 'Pegawai'}`, margin + 7 + sigColWidth, finalY + 25, { maxWidth: sigColWidth - 4 });
    doc.text(`Tarikh: ${appDateStr}`, margin + 7 + sigColWidth, finalY + 32);
  } else {
    doc.text('Nama: ______________', margin + 7 + sigColWidth, finalY + 18);
    doc.text('Jawatan: ____________', margin + 7 + sigColWidth, finalY + 23);
    doc.text('Tarikh: _____________', margin + 7 + sigColWidth, finalY + 28);
  }

  // Issuer Info (Pharmacy)
  if (request.issuer && (request.status === 'issued' || request.status === 'completed')) {
    const issueDateStr = request.issued_date ? new Date(request.issued_date).toLocaleDateString('ms-MY') : '—';
    doc.text(`Nama: ${request.issuer.full_name}`, margin + 7 + sigColWidth * 2, finalY + 18, { maxWidth: sigColWidth - 4 });
    doc.text(`Jawatan: ${request.issuer.jawatan || 'Pegawai Farmasi'}`, margin + 7 + sigColWidth * 2, finalY + 25, { maxWidth: sigColWidth - 4 });
    doc.text(`Tarikh: ${issueDateStr}`, margin + 7 + sigColWidth * 2, finalY + 32);
  } else {
    doc.text('Nama: ______________', margin + 7 + sigColWidth * 2, finalY + 18);
    doc.text('Jawatan: ____________', margin + 7 + sigColWidth * 2, finalY + 23);
    doc.text('Tarikh: _____________', margin + 7 + sigColWidth * 2, finalY + 28);
  }

  // 6. Electronic Disclaimer
  const disY = finalY + sigBoxHeight + 5;
  doc.setLineWidth(0.3);
  doc.rect(margin + 5, disY, contentWidth - 10, 10);
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.text('TIDAK MEMERLUKAN TANDATANGAN KERANA DOKUMEN INI DIJANA SECARA ELEKTRONIK OLEH SISTEM (HOME)', pageWidth / 2, disY + 6, { align: 'center' });

  // 7. Footer
  const footerY = 282;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia', pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(7);
  const nowFormatted = new Date().toLocaleString('ms-MY');
  doc.text(`Generated by HOME Ecosystem | ${nowFormatted}`, pageWidth / 2, footerY + 4, { align: 'center' });

  return doc.output('blob');
}
