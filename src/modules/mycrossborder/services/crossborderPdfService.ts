// src/modules/mycrossborder/services/crossborderPdfService.ts
// PDF Generation Service for MyCrossBorder using jsPDF

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64';
import type { CrossborderTransfer } from '@/shared/types/mycrossborder';
import { formatDate } from '@/lib/utils';

// Helper to convert date
const getFormattedDate = (dateStr: string) => {
  try {
    return formatDate(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
};

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

/**
 * Generates the official Malaysia-Brunei Cross Border Patient Transfer Form PDF
 */
export async function generateTransferFormPDF(transfer: CrossborderTransfer): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  let y = 10;

  // Draw watermark Jata Negara at the center of the page
  try {
    doc.saveGraphicsState();
    const GState = (doc as any).GState || (jsPDF as any).GState;
    if (GState) {
      doc.setGState(new GState({ opacity: 0.055 }));
    }
    const watermarkWidth = 85;
    const watermarkHeight = 70;
    doc.addImage(
      JATA_NEGARA_BASE64,
      'PNG',
      (pageWidth - watermarkWidth) / 2,
      (pageHeight - watermarkHeight) / 2,
      watermarkWidth,
      watermarkHeight
    );
    doc.restoreGraphicsState();
  } catch (err) {
    console.error('Error drawing watermark:', err);
  }

  // Load Brunei emblem base64
  const bruneiLogoBase64 = await getBase64ImageFromUrl('/512px-Emblem_of_Brunei.svg.png');

  // 1. Header with Logos
  // Malaysian Coat of Arms (Jata Negara)
  try {
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', margin, y, 22, 18);
  } catch (e) {
    // Fallback if image failed
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text('KERAJAAN', margin, y + 5);
    doc.text('MALAYSIA', margin, y + 9);
  }

  // Brunei Crest/Logo or Text Fallback
  let hasBruneiLogo = false;
  if (bruneiLogoBase64) {
    try {
      doc.addImage(bruneiLogoBase64, 'PNG', pageWidth - margin - 21, y, 21, 18);
      hasBruneiLogo = true;
    } catch (e) {
      console.error('Failed to add Brunei logo to PDF:', e);
    }
  }

  if (!hasBruneiLogo) {
    doc.setFont('times', 'bold');
    doc.setFontSize(7);
    doc.text('MINISTRY OF HEALTH', pageWidth - margin - 25, y + 5, { align: 'center' });
    doc.text('NEGARA BRUNEI', pageWidth - margin - 25, y + 9, { align: 'center' });
    doc.text('DARUSSALAM', pageWidth - margin - 25, y + 13, { align: 'center' });
  }

  y += 22;

  // Form Title Box
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 11);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('MALAYSIA - BRUNEI CROSS BORDER PATIENT TRANSFER FORM', pageWidth / 2, y + 7, { align: 'center' });
  
  y += 13;

  // Trip details table
  const tripData = [
    ['Referring Hospital:', transfer.referring_hospital || 'Hospital Lawas'],
    ['Date of Travel:', getFormattedDate(transfer.tarikh_perjalanan)],
    ['Time of Departure:', transfer.masa_berlepas],
    ['Place of Departure:', transfer.tempat_berlepas || 'Hospital Lawas']
  ];

  autoTable(doc, {
    startY: y,
    body: tripData,
    theme: 'plain',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // 2. Patient Details Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. PATIENTS DETAILS', margin, y);
  y += 3.5;

  const patients = transfer.patients || [];
  const p1 = patients.find(p => p.urutan === 1);
  const p2 = patients.find(p => p.urutan === 2);
  const p3 = patients.find(p => p.urutan === 3);

  const showP2 = !!p2;
  const showP3 = !!p3;

  const headers = ['FIELD', 'PATIENT 1'];
  if (showP2) headers.push('PATIENT 2');
  if (showP3) headers.push('PATIENT 3');

  const getDocNoWithExpiry = (p: any) => {
    if (!p) return '';
    if (p.jenis_dokumen === 'PASSPORT' && p.passport_expiry) {
      return `${p.no_dokumen} (EXP: ${getFormattedDate(p.passport_expiry)})`;
    }
    return p.no_dokumen || '';
  };

  const patientTableBody = [
    ['NAME:', p1?.nama || ''],
    ['GENDER:', p1?.jantina || ''],
    ['DOB:', p1 ? getFormattedDate(p1.tarikh_lahir) : ''],
    ['NATIONALITY:', p1?.warganegara || ''],
    ['TYPE OF TRAVEL DOCUMENTS:', p1?.jenis_dokumen || ''],
    ['NO:', getDocNoWithExpiry(p1)]
  ];

  if (showP2) {
    patientTableBody[0].push(p2?.nama || '');
    patientTableBody[1].push(p2?.jantina || '');
    patientTableBody[2].push(p2 ? getFormattedDate(p2.tarikh_lahir) : '');
    patientTableBody[3].push(p2?.warganegara || '');
    patientTableBody[4].push(p2?.jenis_dokumen || '');
    patientTableBody[5].push(getDocNoWithExpiry(p2));
  }

  if (showP3) {
    patientTableBody[0].push(p3?.nama || '');
    patientTableBody[1].push(p3?.jantina || '');
    patientTableBody[2].push(p3 ? getFormattedDate(p3.tarikh_lahir) : '');
    patientTableBody[3].push(p3?.warganegara || '');
    patientTableBody[4].push(p3?.jenis_dokumen || '');
    patientTableBody[5].push(getDocNoWithExpiry(p3));
  }

  const numPatientCols = 1 + (showP2 ? 1 : 0) + (showP3 ? 1 : 0);
  const patientColWidth = 150 / numPatientCols;

  const colStyles: any = {
    0: { cellWidth: 40, fontStyle: 'bold', fillColor: [248, 248, 248] }
  };
  for (let i = 1; i <= numPatientCols; i++) {
    colStyles[i] = { cellWidth: patientColWidth };
  }

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: patientTableBody,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 1.7, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 8.5, halign: 'center' },
    columnStyles: colStyles,
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // 3. Ambulance Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('2. AMBULANCE / GOVERNMENT VEHICLE', margin, y);
  y += 2.0;

  const vehicleBody = [
    ['REGISTRATION NO:', transfer.no_pendaftaran || 'BNN7608'],
    ['ANY OTHER EQUIPMENT:', transfer.peralatan_lain || 'N/A']
  ];

  autoTable(doc, {
    startY: y,
    body: vehicleBody,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 1.7, lineColor: [0, 0, 0], lineWidth: 0.15 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', fillColor: [248, 248, 248] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // 3. Driver Details Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('3. DRIVER DETAILS', margin, y);
  y += 2.0;

  const getDriverPassportWithExpiry = () => {
    const passport = (transfer as any).pemandu_passport;
    const expiry = (transfer as any).pemandu_passport_expiry;
    if (!passport) return 'N/A';
    if (expiry) return `${passport} (EXP: ${getFormattedDate(expiry)})`;
    return passport;
  };

  const driverBody = [
    ['DRIVER NAME:', (transfer as any).pemandu_nama || 'N/A'],
    ['PASSPORT NO:', getDriverPassportWithExpiry()]
  ];

  autoTable(doc, {
    startY: y,
    body: driverBody,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 1.7, lineColor: [0, 0, 0], lineWidth: 0.15 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', fillColor: [248, 248, 248] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // 4. Patient's Escort Details
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text("4. PATIENT'S ESCORT DETAILS (WARIS)", margin, y);
  y += 2.0;

  const patientEscorts = (transfer.escorts || []).filter(e => e.jenis_pengiring === 'patient_escort');
  const getEscortNoWithExpiry = (e: any) => {
    if (e.jenis_dokumen === 'PASSPORT' && e.passport_expiry) {
      return `${e.no_dokumen} (EXP: ${getFormattedDate(e.passport_expiry)})`;
    }
    return e.no_dokumen;
  };
  const escortTableData = patientEscorts.length > 0 
    ? patientEscorts.map((e, idx) => [idx + 1, e.nama, e.jenis_dokumen, getEscortNoWithExpiry(e), e.hubungan || ''])
    : [['-', 'TIADA PENGIRING WARIS / NO PATIENT ESCORT RECORDED', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    head: [['NO', 'NAME', 'TYPE OF TRAVEL DOCUMENT', 'NO:', 'RELATIONSHIP']],
    body: escortTableData,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 1.7, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 8.5, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // 5. Medical Escort Details
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('5. MEDICAL ESCORT DETAILS (KKM)', margin, y);
  y += 2.0;

  const medicalEscorts = (transfer.escorts || []).filter(e => e.jenis_pengiring === 'medical_escort');
  const medicalTableData = medicalEscorts.length > 0
    ? medicalEscorts.map((e, idx) => [idx + 1, e.nama, e.jenis_dokumen, getEscortNoWithExpiry(e), e.jawatan || ''])
    : [['-', 'TIADA PENGIRING PERUBATAN / NO MEDICAL ESCORT RECORDED', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    head: [['NO', 'NAME', 'TYPE OF TRAVEL DOCUMENT', 'NO:', 'DESIGNATION']],
    body: medicalTableData,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 1.7, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 8.5, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // 6. Signatures and Stamps
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('Referring Doctor:', margin, y);
  doc.text('Official Stamp of referring hospital:', pageWidth - margin - 70, y);
  
  y += 14;

  doc.line(margin, y, margin + 60, y);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${transfer.doktor_perujuk_nama || 'Dr. Jason Ling'}`, margin, y + 3.5);
  doc.text('Signature: _______________________', margin, y + 7.5);

  doc.setLineWidth(0.2);
  doc.setDrawColor(156, 163, 175);
  doc.rect(pageWidth - margin - 70, y - 10, 60, 18);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text('[ Official Stamp Box ]', pageWidth - margin - 40, y - 1, { align: 'center' });

  // Footer notice
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('In the event of cancellation of travel, please notify all relevant authorities', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc.output('blob');
}

/**
 * Generates the official Permission Letter to Border Control Post PDF
 */
export async function generatePermissionLetterPDF(transfer: CrossborderTransfer): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // Formal letter has wider margins
  const contentWidth = pageWidth - (margin * 2);
  let y = 15;

  // Draw watermark Jata Negara at the center of the page
  try {
    doc.saveGraphicsState();
    const GState = (doc as any).GState || (jsPDF as any).GState;
    if (GState) {
      doc.setGState(new GState({ opacity: 0.055 }));
    }
    const watermarkWidth = 85;
    const watermarkHeight = 70;
    doc.addImage(
      JATA_NEGARA_BASE64,
      'PNG',
      (pageWidth - watermarkWidth) / 2,
      (pageHeight - watermarkHeight) / 2,
      watermarkWidth,
      watermarkHeight
    );
    doc.restoreGraphicsState();
  } catch (err) {
    console.error('Error drawing watermark:', err);
  }

  // 1. Government Letterhead Logo (Jata Negara) on the left
  try {
    doc.addImage(JATA_NEGARA_BASE64, 'PNG', margin, y, 22, 18);
  } catch (e) {
    console.error('Failed to load Jata Negara logo in letterhead:', e);
  }

  // Letterhead Address Info - Left-aligned to the right of Jata Negara
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KESIHATAN MALAYSIA', margin + 26, y + 4);
  doc.setFontSize(12.5);
  doc.text('HOSPITAL LAWAS', margin + 26, y + 9);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Jalan Hospital, 98850 Lawas, Sarawak, Malaysia', margin + 26, y + 13.5);
  doc.text('Tel: 085 283 781  E-mel: hosp_lawas@moh.gov.my', margin + 26, y + 17.5);

  y += 22;

  // Government Standard Letterhead double lines (thick and thin)
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  
  y += 12;

  // Metadata block (Date and Ref) right-aligned (Official government style)
  const refNo = transfer.surat_kebenaran_ref || `TF/HL/MW(32)${new Date().getFullYear()}`;
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text(`Rujukan Kami : ${refNo}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Tarikh : ${getFormattedDate(transfer.tarikh_perjalanan)}`, pageWidth - margin, y + 6, { align: 'right' });
  
  y += 18;

  // Addressed to
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('Border Control Post', margin, y);
  doc.text('MALAYSIA/BRUNEI', margin, y + 5.5);

  y += 18;

  doc.text('Dear Sir/Madam,', margin, y);
  
  y += 10;

  // Subject line (All uppercase, bold, underlined)
  doc.setFont('times', 'bold');
  doc.text('PERMISSION TO CROSS THE BORDER USING AMBULANCE', margin, y);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1.5, margin + 115, y + 1.5); // Underline subject

  y += 12;

  // Letter Body
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const bodyText = `With reference to the above, I would like to request permission for the following patient to cross the border. This patient is to be referred to ${transfer.destination_hospital || 'HOSPITAL LIMBANG'} for further management.`;
  const splitBody = doc.splitTextToSize(bodyText, contentWidth);
  doc.text(splitBody, margin, y);

  y += 16;

  // Patient Table
  const patients = transfer.patients || [];
  const patientRows = patients.map(p => [
    p.nama,
    p.no_dokumen,
    p.no_pengenalan || p.no_dokumen
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Patient Name', 'Passport No.', 'Identification No.']],
    body: patientRows.length > 0 ? patientRows : [['N/A', 'N/A', 'N/A']],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10, cellPadding: 3.5, lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', font: 'times', fontSize: 10, halign: 'center' },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 16;

  // Sign-off block
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('Yours Sincerely,', margin, y);
  
  y += 24;

  doc.line(margin, y, margin + 60, y);
  doc.setFont('times', 'bold');
  const directorName = transfer.pengarah_nama ? transfer.pengarah_nama.split('(')[0].trim() : 'DR. DOUGLAS CHU KIN SOON';
  doc.text(directorName, margin, y + 5.5);
  doc.setFont('times', 'normal');
  doc.text('Pengarah', margin, y + 11);
  doc.text('Hospital Lawas', margin, y + 16.5);
  doc.text('Sarawak, Malaysia', margin, y + 22);

  // Footer text
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text("(Sila catatkan rujukan Jabatan ini apabila berhubung)", margin, pageHeight - 22);
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('"KEPUASAN PELANGGAN KEUTAMAAN KAMI"', margin, pageHeight - 16);

  return doc.output('blob');
}
