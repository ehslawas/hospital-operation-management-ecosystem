import { PDFDocument } from 'pdf-lib'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

console.error('!!! PO_PDF_SERVICE_LOADED !!!');

export interface VectorPDFOptions {
  order: any
  items: any[]
  signatures: any
  balance: number | null
  accountDocumentUrl?: string | null
  mofCertificateUrl?: string | null
  bumiputeraCertificateUrl?: string | null
  invitedSuppliers?: string[]
}

export interface MergePDFResult {
  success: boolean
  pdfBlob?: Blob
  pdfUrl?: string
  error?: string
}

// Helper to convert image URL to base64
const getBase64ImageFromUrlLocal = async (imageUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => {
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

/**
 * Compiles the Purchase Order PDF using Vector commands
 */
async function compileVectorPO(options: VectorPDFOptions): Promise<ArrayBuffer> {
  const { order, items, signatures, balance, invitedSuppliers = [] } = options;
  const doc = new jsPDF('p', 'mm', 'a4');
  const sigs = signatures || {};
  
  const totalAmount = items.reduce((sum, item) => {
    const qty = item.quantity_ordered || 0;
    const price = item.unit_price || 0;
    return sum + (qty * price);
  }, 0);
  
  const balanceAfter = balance !== null ? balance - totalAmount : null;

  // Helper: Format Currency
  const fmt = (val: number | null | undefined) => (val !== null && val !== undefined && !isNaN(val)) ? `RM ${Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—';

  // --- PDF Configuration ---
  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Load Logo
  const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png');

  // --- Helper: Draw Watermark ---
  const drawWatermark = () => {
    if (logoBase64) {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState || (jsPDF as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }));
        }
        // Center of page (90x90mm)
        doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (297 - 90) / 2, 90, 90);
        doc.restoreGraphicsState();
      } catch (err) {
        console.error('Error drawing watermark:', err);
      }
    }
  };

  // --- Helper: Draw Page Frame/Border ---
  const renderPageFrame = (_data: any) => {
    // Background Watermark (draw first so it is underneath)
    drawWatermark();

    // Draw thin solid border around A4 printable area
    doc.setDrawColor(31, 41, 55); // dark gray border
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, 268); // A4 height is 297, border starts at 10, ends at 278
  };

  const hospitalName = order.hospital?.name || 'Hospital Daerah Lawas';

  // --- Page 1 Header Manual Compilation ---
  const drawFirstPageHeader = () => {
    const col1 = margin + 5;
    const col2 = pageWidth / 2 + 5;

    // 1. Logo on the left (widen to 22.5 to restore natural Malaysian Crest aspect ratio)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin + 5, 15, 22.5, 18);
    }

    // 2. Thick vertical bar next to logo (shifted right to accommodate wider logo)
    doc.setFillColor(31, 41, 55);
    doc.rect(margin + 30.5, 15, 0.8, 18, 'F');

    // 3. Centered Title text (Ministry header) - Times Bold
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('KEMENTERIAN KESIHATAN', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(12);
    doc.text('MINISTRY OF HEALTH', pageWidth / 2, 24, { align: 'center' });
    doc.text('MALAYSIA', pageWidth / 2, 29, { align: 'center' });
    doc.setFontSize(10.5);
    doc.text(hospitalName, pageWidth / 2, 35, { align: 'center' });

    // 4. Thick vertical bar on the far right
    doc.setFillColor(31, 41, 55);
    doc.rect(pageWidth - margin - 7, 15, 0.8, 18, 'F');

    // 5. Horizontal divider line under main header
    doc.setLineWidth(0.8);
    doc.setDrawColor(31, 41, 55);
    doc.line(margin + 5, 39, pageWidth - margin - 5, 39);

    // 6. Document main title & translation
    const docTitle = order?.po_type === 'sq' ? 'PELAWAAN SEBUT HARGA' : 'BORANG PERMOHONAN UNTUK PENGELUARAN PESANAN KERAJAAN';
    const docSubtitle = order?.po_type === 'sq' ? 'Invite Quotation' : 'Application Form for Government Purchase Order';

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(docTitle, pageWidth / 2, 45, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(docSubtitle, pageWidth / 2, 49, { align: 'center' });

    // 7. Horizontal line below document title
    doc.setLineWidth(0.3);
    doc.setDrawColor(31, 41, 55);
    doc.line(margin + 5, 52, pageWidth - margin - 5, 52);

    // 8. Info Grid layout with thin horizontal lines
    let gridY = 53;
    const rowHeight = 9.5;
    const orderDateStr = order.order_date ? new Date(order.order_date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—';
    const poLabel = 'NO. PESANAN / PO NUMBER';

    const drawGridRow = (y: number, label1: string, val1: string, label2?: string, val2?: string) => {
      // Draw grid bottom divider
      doc.setLineWidth(0.15);
      doc.setDrawColor(209, 213, 219); // border-gray-300
      doc.line(margin + 5, y + rowHeight, pageWidth - margin - 5, y + rowHeight);

      // Column 1 Label (Times Roman normal, clean gray, small)
      doc.setFont('times', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text(String(label1).toUpperCase(), col1, y + 3.0);

      // Column 1 Value (Times Roman bold, dark, perfectly centered vertically)
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text(String(val1), col1, y + 7.2);

      if (label2 && val2) {
        // Column 2 Label
        doc.setFont('times', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text(String(label2).toUpperCase(), col2, y + 3.0);

        // Column 2 Value
        doc.setFont('times', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(17, 24, 39);
        doc.text(String(val2), col2, y + 7.2);
      }
    };

    // Row 1: PO / SQ No. & Department
    const deptVal = order.department === 'other' ? (order.manual_department || '—') : (order.department || '—');
    const poVal = order?.po_type === 'sq' ? '—' : (order.po_number || '—');
    drawGridRow(gridY, poLabel, poVal, 'JABATAN / DEPARTMENT', deptVal.toUpperCase());
    gridY += rowHeight;

    // Row 2: Vote Code & Order Date
    const voteCodeVal = order.vote_code === 'other' ? (order.manual_vote_code || '—') : (order.vote_code || '—');
    drawGridRow(gridY, 'KOD UNDI / VOTE CODE', voteCodeVal, 'TARIKH PESANAN / ORDER DATE', orderDateStr);
    gridY += rowHeight;

    // Row 3: Vote Activity & Category
    const voteActVal = order.vote_activity === 'other' ? (order.manual_vote_activity || '—') : (order.vote_activity || '—');
    const catVal = order.category === 'other' ? (order.manual_category || '—') : (order.category?.replace('_', ' ') || '—');
    drawGridRow(gridY, 'AKTIVITI UNDI / VOTE ACTIVITY', voteActVal, 'KATEGORI / CATEGORY', catVal.toUpperCase());
    gridY += rowHeight;

    // Row 4: Contract No. / INV SQ No.
    const contractLabel = order.po_type === 'sq' ? 'INV SQ NO.' : 'NO. KONTRAK / CONTRACT NO.';
    const contractDisplay = order.po_type === 'sq' 
      ? (order.inv_sq_number || '—') 
      : ((order.vote_code === '990102' || order.po_type === 'manual') ? '—' : (order.kkm_contract_number || order.supplier?.contract_number || '—'));
    drawGridRow(gridY, contractLabel, contractDisplay);
    gridY += rowHeight;

    // Row 4.5 (Optional): Inv / SQ Number (when po_type !== 'sq' but inv_sq_number is present)
    if (order.inv_sq_number && order.po_type !== 'sq') {
      drawGridRow(gridY, 'INV / SQ NUMBER', order.inv_sq_number.toUpperCase());
      gridY += rowHeight;
    }

    // Row 5 (Optional): Program
    if (order.program_name) {
      drawGridRow(gridY, 'PROGRAM', order.program_name.toUpperCase());
      gridY += rowHeight;
    }

    gridY += 5; // Spacing before Supplier Section

    // 9. Supplier Info Headers and Boxes
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text('MAKLUMAT PEMBEKAL / SUPPLIER INFORMATION', col1, gridY);
    gridY += 3.5;

    doc.setLineWidth(0.25);
    doc.setDrawColor(107, 114, 128); // gray-500 border

    if (order.po_type === 'sq') {
      // Invite Quotation box
      const boxHeight = Math.max(16, invitedSuppliers.length * 5 + 7);
      doc.rect(margin + 5, gridY, contentWidth - 10, boxHeight);

      doc.setFont('times', 'bolditalic');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text('SENARAI PEMBEKAL YANG DIPELAWA / LIST OF INVITED SUPPLIERS', margin + 7, gridY + 3.5);

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      let sqY = gridY + 8;
      invitedSuppliers.forEach((name: string, idx: number) => {
        doc.text(String(`${idx + 1}. ${name.toUpperCase()}`), margin + 7, sqY);
        sqY += 5;
      });
      gridY += boxHeight;
    } else {
      const companyName = order.manual_supplier_name || order.supplier?.company_name || '—';
      const address = order.manual_supplier_address || order.supplier?.address || '—';

      // Box 1: Company Name Container
      doc.rect(margin + 5, gridY, contentWidth - 10, 11);
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text('NAMA SYARIKAT / COMPANY NAME', margin + 7, gridY + 3.5);

      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(String(companyName).toUpperCase(), margin + 7, gridY + 8.5);

      gridY += 13.5;

      // Box 2: Supplier Address Container
      doc.rect(margin + 5, gridY, contentWidth - 10, 15);
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text('ALAMAT / ADDRESS', margin + 7, gridY + 3.5);

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(String(address), margin + 7, gridY + 7.5, { maxWidth: contentWidth - 14 });

      gridY += 17;
    }

    // Set firstPageTableY where table should start
    (doc as any).firstPageTableY = gridY + 5;
  };

  // --- Subsequent Pages Continuation Header ---
  const renderHeader = (isFirstPage: boolean, pageNum: number) => {
    if (!isFirstPage) {
      // Mini Header for continuation (NO Jata Negara, NO Kementerian Kesihatan)
      doc.setFont('times', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`No. Pesanan: ${order.po_number || '—'}`, pageWidth - margin - 5, 17, { align: 'right' });
      doc.setFont('times', 'italic');
      doc.text(`Halaman ${pageNum}`, pageWidth - margin - 5, 22, { align: 'right' });
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, 24, pageWidth - margin - 5, 24);
    }
  };

  // Prepare table data with proper contract info
  const tableData = items.map((item, idx) => {
    const qty = item.quantity_ordered || 0;
    const price = item.unit_price || 0;
    
    let itemNameText = item.item_name || 'Unknown Item';
    let contractInfo = '';

    if (order.vote_code !== '990102' && order.po_type !== 'manual' && order.po_type !== 'sq') {
         const contractNo = item.contract_number || order.kkm_contract_number || order.supplier?.contract_number;
         if (contractNo) {
             const deliveryPeriod = item.delivery_period || order.supplier?.delivery_period || 'Tidak melebihi 30 hari...';
             const contractEndDate = item.contract_end_date || order.supplier?.contract_end_date;
             const contractEnd = contractEndDate ? new Date(contractEndDate).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
             contractInfo = `\nNo. Kontrak: ${contractNo}\nTempoh Serahan: ${deliveryPeriod}\nTamat Kontrak: ${contractEnd}`;
         }
    }

    return [
      idx + 1,
      { content: `${itemNameText}${contractInfo}`, styles: { fontStyle: contractInfo ? 'normal' : 'bold' } },
      item.item_code || '—',
      qty,
      `RM ${price.toFixed(2)}`,
      `RM ${(qty * price).toFixed(2)}`,
      item.packaging_description || '—'
    ];
  });

  // Draw Page 1 manual header elements
  drawFirstPageHeader();
  const tableStartY = (doc as any).firstPageTableY || 135;

  // --- Render Items Table ---
  autoTable(doc, {
    startY: tableStartY,
    head: [['BIL', 'NAMA ITEM / ITEM NAME', 'KOD ITEM / ITEM CODE', 'KUANTITI / QTY', 'HARGA UNIT / PRICE', 'JUMLAH / TOTAL', 'PEMBUNGKUSAN / PKG']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 2.2, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 7.5, halign: 'center' },
    margin: { left: margin + 5, right: margin + 5, bottom: 42 },
    columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'center', cellWidth: 25 }
    },
    didDrawPage: (data) => {
      renderPageFrame(data);
      // Header for pages > 1 is drawn dynamically
      if (data.pageNumber > 1) {
        renderHeader(false, data.pageNumber);
      }
    }
  });

  // --- Final Section: Totals & Signatures ---
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY > 215) {
    doc.addPage();
    renderPageFrame({ pageNumber: (doc as any).internal.getNumberOfPages() });
    renderHeader(false, (doc as any).internal.getNumberOfPages());
  }
  // Symmetrically anchor the entire totals and signature block to the bottom of the last page
  finalY = 243;

  // Totals Box
  const boxWidth = 90;
  const boxX = pageWidth - margin - 5 - boxWidth;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(boxX, finalY, boxWidth, 24);
  doc.line(boxX, finalY + 8, boxX + boxWidth, finalY + 8);
  doc.line(boxX, finalY + 16, boxX + boxWidth, finalY + 16);
  doc.line(boxX + 50, finalY, boxX + 50, finalY + 24);

  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  doc.text('BAKI SEBELUM / BALANCE BEFORE:', boxX + 2, finalY + 5.2);
  doc.text('JUMLAH / TOTAL AMOUNT:', boxX + 2, finalY + 13.2);
  doc.text('BAKI SELEPAS / BALANCE AFTER:', boxX + 2, finalY + 21.2);

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(fmt(balance), boxX + boxWidth - 2, finalY + 5.2, { align: 'right' });
  doc.text(fmt(totalAmount), boxX + boxWidth - 2, finalY + 13.2, { align: 'right' });
  doc.text(fmt(balanceAfter), boxX + boxWidth - 2, finalY + 21.2, { align: 'right' });

  // Single Signature for First Page (Pegawai Yang Mengesahkan Peruntukan)
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.line(margin + 10, finalY + 16, margin + 70, finalY + 16);
  doc.text('(Tandatangan)', margin + 40, finalY + 19, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('Pegawai Yang Mengesahkan Peruntukan', margin + 40, finalY + 23.5, { align: 'center' });
  doc.text('Pengarah Hospital Lawas', margin + 40, finalY + 27.5, { align: 'center' });


  // =========================================================================
  // INTERNAL ROUTING PAGE (Sections 3 - 6)
  // =========================================================================
  doc.addPage();
  renderPageFrame({ pageNumber: (doc as any).internal.getNumberOfPages() });
  
  // Mini Header for Routing Page (NO Jata Negara, NO Kementerian Kesihatan)
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`No. Pesanan: ${order.po_number || '—'}`, pageWidth - margin - 5, 17, { align: 'right' });
  doc.setFont('times', 'italic');
  doc.text(`Halaman ${(doc as any).internal.getNumberOfPages()}`, pageWidth - margin - 5, 22, { align: 'right' });
  doc.setDrawColor(31, 41, 55);
  doc.setLineWidth(0.3);
  doc.line(margin + 5, 24, pageWidth - margin - 5, 24);

  let ry = 32;

  // Section 3: MAKLUMAT PEMBEKAL
  doc.setFontSize(10.5);
  doc.setFont('times', 'bold');
  doc.setTextColor(0);
  doc.text('MAKLUMAT PEMBEKAL (SAMBUNGAN)', pageWidth / 2, ry, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  doc.line(pageWidth / 2 - 35, ry + 1.2, pageWidth / 2 + 35, ry + 1.2);
  ry += 5;

  let supplierBoxHeight = 15;
  if (order.po_type === 'sq') {
      supplierBoxHeight = Math.max(15, invitedSuppliers.length * 5 + 6);
  } else {
      const address = order.manual_supplier_address || order.supplier?.address || 'Alamat';
      const textLines = doc.splitTextToSize(address, contentWidth - 80).length;
      supplierBoxHeight = Math.max(15, 6 + textLines * 3.5 + 4);
  }

  // Draw two-row table box with gray background on the left label column
  doc.setFillColor(243, 244, 246); // bg-gray-100
  doc.rect(margin + 5, ry, 40, supplierBoxHeight, 'F');
  
  doc.setLineWidth(0.35);
  doc.setDrawColor(0);
  doc.rect(margin + 5, ry, contentWidth - 10, supplierBoxHeight); // outer border
  doc.line(margin + 45, ry, margin + 45, ry + supplierBoxHeight); // vertical separator
  doc.line(margin + 5, ry + supplierBoxHeight - 6, pageWidth - margin - 5, ry + supplierBoxHeight - 6); // horizontal separator
  
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0);
  doc.text('Nama Pembekal :', margin + 8, ry + 5);
  
  if (order.po_type === 'sq') {
      let sqY = ry + 4.5;
      invitedSuppliers.forEach((name: string, idx: number) => {
          doc.text(String(`${idx + 1}. ${name.toUpperCase()}`), margin + 48, sqY);
          sqY += 4.5;
      });
  } else {
      const companyName = order.manual_supplier_name || order.supplier?.company_name || 'SYARIKAT PEMBEKAL';
      doc.text(String(companyName).toUpperCase(), margin + 48, ry + 4.5);
      doc.setFontSize(7.5);
      doc.setFont('times', 'normal');
      doc.text(String(order.manual_supplier_address || order.supplier?.address || 'Alamat'), margin + 48, ry + 8, { maxWidth: contentWidth - 80 });
  }

  doc.setFontSize(9.5);
  doc.setFont('times', 'bold');
  doc.text('No. Telefon :', margin + 8, ry + supplierBoxHeight - 2);
  doc.text(String(order.supplier?.phone || '—'), margin + 48, ry + supplierBoxHeight - 2);

  // Set precise vertical coordinates dynamically based on supplierBoxHeight to prevent overlaps
  ry = 37 + supplierBoxHeight + 9; // Federal Treasury Registration

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )', margin + 5, ry);
  ry += 6;
  doc.text('No. Rujukan Pendaftaran :', margin + 5, ry);
  doc.line(margin + 55, ry + 0.5, margin + 120, ry + 0.5);

  ry += 12; // Section 4: Bersama-sama ini dinyatakan

  doc.setFont('times', 'bold');
  doc.text('Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).', margin + 5, ry);
  doc.setFont('times', 'normal');
  ry += 6;
  doc.text('(i)   No. rujukan surat mampu :', margin + 10, ry);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(margin + 55, ry + 0.5, margin + 120, ry + 0.5);
  ry += 6;
  doc.text('(ii)  No. rujukan kontrak :', margin + 10, ry);
  doc.line(margin + 48, ry + 0.5, margin + 120, ry + 0.5);
  doc.setFont('times', 'bold');
  const contractNo = order.kkm_contract_number || order.supplier?.contract_number || '';
  doc.text(String(contractNo), margin + 50, ry - 0.5);
  doc.setFont('times', 'normal');
  ry += 6;
  doc.text('(iii) Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:', margin + 10, ry);
  doc.line(margin + 98, ry + 0.5, pageWidth - margin - 5, ry + 0.5);
  doc.setLineDashPattern([], 0); // Reset dash

  ry += 12;

  // Signature 4 (Applicant)
  doc.setFont('times', 'bold');
  doc.text('Tarikh :', margin + 10, ry);
  const orderDateStr2 = order.order_date ? new Date(order.order_date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—';
  doc.text(orderDateStr2, margin + 23, ry);
  
  doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry);
  doc.setFont('times', 'bold');
  doc.text('(Tandatangan Pegawai yang Memohon)', pageWidth - margin - 40, ry + 3, { align: 'center' });
  doc.setFont('times', 'normal');
  
  // Wrap to prevent horizontal overflow and truncation
  const nameLines = doc.splitTextToSize(`Nama : ${sigs.applicantName || ''}`, 68);
  const posLines = doc.splitTextToSize(`Jawatan : ${sigs.applicantPosition || ''}`, 68);
  
  let currentY = ry + 7;
  nameLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, currentY);
      currentY += 4;
  });
  posLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 75, currentY);
      currentY += 4;
  });

  ry = currentY + 10; // Section 5: Akaun Ketua Bahagian

  doc.setFont('times', 'bold');
  doc.text('5. Akaun Ketua Bahagian.', margin + 5, ry);
  doc.setFont('times', 'normal');
  ry += 6;
  doc.text('(i)   Adalah disahkan pembelian ini telah dimasukkan dalam cadangan anggaran Belanjawan tahunan.', margin + 15, ry);
  ry += 6;
  doc.text('(ii)  Pembelian ini adalah diperlukan.', margin + 15, ry);

  ry += 12;

  // Signature 5 (Head)
  doc.setFont('times', 'bold');
  doc.text('Tarikh :', margin + 10, ry);
  doc.text(orderDateStr2, margin + 23, ry);
  
  doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry);
  doc.text('(Tandatangan Ketua Bahagian)', pageWidth - margin - 40, ry + 3, { align: 'center' });
  doc.setFont('times', 'normal');
  
  // Wrap to prevent horizontal overflow and truncation
  const headNameLines = doc.splitTextToSize(sigs.headName || '', 68);
  const headPosLines = doc.splitTextToSize(sigs.headPosition || '', 68);
  
  let headY = ry + 7;
  headNameLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 40, headY, { align: 'center' });
      headY += 4;
  });
  headPosLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 40, headY, { align: 'center' });
      headY += 4;
  });

  ry = headY + 10;
  doc.setFont('times', 'bold');
  doc.text('Permohonan diluluskan/tidak diluluskan', pageWidth / 2, ry, { align: 'center' });

  ry += 12;

  // Signature 6 (Director)
  doc.text('Tarikh :', margin + 10, ry);
  doc.line(margin + 22, ry + 0.5, margin + 70, ry + 0.5);
  
  doc.line(pageWidth - margin - 75, ry, pageWidth - margin - 5, ry);
  doc.text('(Tandatangan Pegawai Yang Meluluskan)', pageWidth - margin - 40, ry + 3, { align: 'center' });
  doc.setFont('times', 'normal');
  
  // Wrap to prevent horizontal overflow and truncation
  const dirLines = doc.splitTextToSize('Pengarah Hospital Daerah, Lawas.', 68);
  let dirY = ry + 7;
  dirLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 40, dirY, { align: 'center' });
      dirY += 4;
  });

  ry = dirY + 12; // Section 6: Financial Department Use

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('UNTUK KEGUNAAN BAHAGIAN KEWANGAN', pageWidth / 2, ry, { align: 'center' });
  
  ry += 8;
  doc.setFontSize(9.5);
  doc.text('6. Kerani Kewangan', margin + 5, ry);
  doc.setFont('times', 'normal');
  ry += 6;
  doc.text('(iii) Sila Keluarkan Pesanan Kerajaan', margin + 15, ry);
  ry += 6;
  doc.text('(iv) Sila dapatkan Sebut harga', margin + 15, ry);

  // Financial Department signature block (aligned with iv row)
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(pageWidth - margin - 65, ry - 4, pageWidth - margin - 5, ry - 4);
  doc.setLineDashPattern([], 0);
  doc.setFont('times', 'bold');
  doc.text('(Bahagian Kewangan)', pageWidth - margin - 35, ry, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text('B.P. Pengarah Hospital Daerah, Lawas.', pageWidth - margin - 35, ry + 4, { align: 'center' });

  ry += 13; // Catatan Section
  doc.setFont('times', 'bold');
  doc.text('Catatan :', margin + 5, ry);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(margin + 20, ry + 0.5, margin + 110, ry + 0.5);
  
  ry += 7;
  doc.text('No. Rujukan Pesanan Kerajaan :', margin + 5, ry);
  doc.line(margin + 55, ry + 0.5, margin + 110, ry + 0.5);
  
  ry += 7;
  doc.text('Tarikh :', margin + 5, ry);
  doc.line(margin + 18, ry + 0.5, margin + 80, ry + 0.5);
  doc.setLineDashPattern([], 0);


  // =========================================================================
  // SECOND PASS: FOOTERS & PAGE NUMBERS
  // =========================================================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer Text
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia', pageWidth / 2, 284, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text('Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System', pageWidth / 2, 288, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`Halaman ${i} daripada ${totalPages}`, pageWidth - margin - 5, 288, { align: 'right' });
    
    // Bersambung (if not routing page and not last items page)
    if (i < totalPages - 1) { // totalPages is routing, totalPages - 1 is last items page
         doc.setFontSize(8);
         doc.setFont('times', 'italic');
         doc.setTextColor(75, 85, 99);
         doc.text('*** Bersambung ke halaman sebelah / Continued on next page ***', pageWidth / 2, 273, { align: 'center' });
    }
  }

  return doc.output('arraybuffer');
}

/**
 * Main Entry Point for Vector Generation + PDF Merging
 */
export async function generatePurchaseOrderPdf(options: VectorPDFOptions): Promise<MergePDFResult> {
  const { accountDocumentUrl, mofCertificateUrl, bumiputeraCertificateUrl, order } = options;
  try {
    console.error(`[PO_PDF_SERVICE] Generating Vector PDF for ${order.po_number}`);
    
    // 1. Compile the PO itself into a Vector PDF
    const poPdfBytes = await compileVectorPO(options);
    const finalPdf = await PDFDocument.load(poPdfBytes);

    // 2. Merge External Docs
    const docs = [
      { name: 'Account', url: accountDocumentUrl },
      { name: 'MOF', url: mofCertificateUrl },
      { name: 'Bumi', url: bumiputeraCertificateUrl }
    ];

    for (const doc of docs) {
      if (doc.url) {
        try {
          console.error(`[PO_PDF_SERVICE] Merging ${doc.name}: ${doc.url}`);
          const resp = await fetch(doc.url);
          const bytes = await resp.arrayBuffer();
          const extPdf = await PDFDocument.load(bytes);
          
          // If merging the LPO (Account document), slice to first 2 pages if it contains 3 or more pages.
          // This strips Page 3 ("Surat Akuan Penerimaan dan Akuan Pematuhan").
          let pageIndices = extPdf.getPageIndices();
          if (doc.name === 'Account' && pageIndices.length >= 3) {
            console.error(`[PO_PDF_SERVICE] Account document has ${pageIndices.length} pages. Slicing to first 2 pages to remove Page 3 (Surat Akuan Penerimaan).`);
            pageIndices = [0, 1];
          }
          
          const extPages = await finalPdf.copyPages(extPdf, pageIndices);
          extPages.forEach(p => finalPdf.addPage(p));
        } catch (e) {
          console.warn(`[PO_PDF_SERVICE] Failed to merge ${doc.name}:`, e);
        }
      }
    }

    const mergedBytes = await finalPdf.save();
    const pdfBlob = new Blob([mergedBytes as any], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return { success: true, pdfBlob, pdfUrl };
  } catch (error) {
    console.error('[PO_PDF_SERVICE] Fatal Error:', error);
    return { success: false, error: String(error) };
  }
}

export function openPdfForPrint(pdfUrl: string): void {
  window.open(pdfUrl, '_blank')
  // We don't automatically trigger print anymore, the user can use the browser's PDF viewer to print
  // which is much more reliable.
}

export function cleanupPdfUrl(pdfUrl: string): void {
  URL.revokeObjectURL(pdfUrl)
}
