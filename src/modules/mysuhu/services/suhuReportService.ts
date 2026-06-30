// src/modules/mysuhu/services/suhuReportService.ts
// MySuhu PDF and CSV exporting service

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { UnitPemantauanWithRelations, BacaanSuhuWithRelations } from '@/types/mysuhu';

export interface GeneratePdfOptions {
  unit: UnitPemantauanWithRelations;
  readings: BacaanSuhuWithRelations[];
  chartImageBase64?: string | null;
  startDate?: string;
  endDate?: string;
  hospitalName?: string;
}

/**
 * Generate and download a PDF audit report for a monitoring unit
 */
export async function downloadPdfReport({
  unit,
  readings,
  chartImageBase64,
  startDate,
  endDate,
  hospitalName = 'Hospital HOME'
}: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const textColor = [51, 65, 85]; // slate-700
  
  // Calculate summary stats
  const totalLogs = readings.length;
  const breachLogs = readings.filter(r => r.status_bacaan === 'breach').length;
  const warningLogs = readings.filter(r => r.status_bacaan === 'warning').length;
  const temps = readings.map(r => r.suhu);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
  const avgTemp = temps.length > 0 ? Number((temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(1)) : 0;

  // Header Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  
  // Header bar background
  doc.setFillColor(190, 24, 74); // Rose 700 (#be184d)
  doc.rect(10, 10, 190, 16, 'F');
  
  doc.text('MINISTRY OF HEALTH MALAYSIA', 15, 20);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(hospitalName.toUpperCase(), 15, 24);

  // Document Title
  doc.setTextColor(51, 65, 85);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KKM TEMPERATURE MONITORING AUDIT REPORT', 10, 36);

  // Date printed
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Printed Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 145, 36);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 39, 200, 39);

  // Metadata block (Location & Unit info)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Monitoring Unit Information', 10, 45);

  doc.setFont('Helvetica', 'normal');
  doc.text(`Unit Name: ${unit.nama_unit} (${unit.unit_id})`, 10, 50);
  doc.text(`Unit Type: ${getJenisUnitLabel(unit.jenis_unit)}`, 10, 54);
  doc.text(`Location: ${unit.lokasi?.nama_lokasi || '-'} (${unit.lokasi?.kod_lokasi || '-'})`, 10, 58);
  doc.text(`Department: ${unit.lokasi?.jabatan || '-'}`, 10, 62);

  const minLimit = unit.active_threshold?.min_suhu !== undefined ? `${unit.active_threshold.min_suhu}°C` : '-';
  const maxLimit = unit.active_threshold?.max_suhu !== undefined ? `${unit.active_threshold.max_suhu}°C` : '-';
  doc.text(`Safe Range Threshold: ${minLimit} to ${maxLimit}`, 110, 50);
  
  const startStr = startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Earliest';
  const endStr = endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Present';
  doc.text(`Report Period: ${startStr} - ${endStr}`, 110, 54);

  // Divider
  doc.line(10, 66, 200, 66);

  // Summary Metrics Table
  doc.setFont('Helvetica', 'bold');
  doc.text('Audit Compliance Summary', 10, 72);

  const metricsHeaders = [['Criteria', 'Log Value', 'Notes / Status']];
  const metricsRows = [
    ['Total Log Entries', `${totalLogs}`, 'Target: 2 times daily'],
    ['Warning Incidents', `${warningLogs}`, 'Approached safe range thresholds'],
    ['Breach Incidents', `${breachLogs}`, breachLogs > 0 ? '🔴 Temperature breach occurred' : '✅ 100% Compliance Met'],
    ['Minimum Temp', `${minTemp.toFixed(1)}°C`, ''],
    ['Maximum Temp', `${maxTemp.toFixed(1)}°C`, ''],
    ['Average Temp', `${avgTemp.toFixed(1)}°C`, '']
  ];

  autoTable(doc, {
    startY: 75,
    head: metricsHeaders,
    body: metricsRows,
    theme: 'grid',
    headStyles: { fillColor: [190, 24, 74] },
    styles: { fontSize: 9, font: 'Helvetica' },
    margin: { left: 10, right: 10 }
  });

  // Inject Chart Image if exists
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  if (chartImageBase64) {
    try {
      doc.setFont('Helvetica', 'bold');
      doc.text('Analytical Timeline Chart', 10, currentY);
      
      // Draw a box for the chart
      doc.addImage(chartImageBase64, 'PNG', 10, currentY + 3, 190, 60);
      currentY += 68;
    } catch (e) {
      console.error('Error rendering chart in PDF:', e);
      currentY += 5;
    }
  }

  // Check if we need to add a page for the readings table
  if (currentY > 200) {
    doc.addPage();
    currentY = 15;
  }

  // Detailed readings table
  doc.setFont('Helvetica', 'bold');
  doc.text('Detailed Log Table', 10, currentY);
  
  const tableHeaders = [['No.', 'Date & Time', 'Recorded Temp', 'Threshold Limit', 'Status', 'Notes', 'Logged By']];
  const tableRows = readings.map((r, i) => [
    i + 1,
    format(new Date(r.tarikh_masa), 'dd/MM/yyyy HH:mm'),
    `${Number(r.suhu).toFixed(1)}°C`,
    `${Number(r.ambang?.min_suhu || 0).toFixed(1)}°C / ${Number(r.ambang?.max_suhu || 0).toFixed(1)}°C`,
    r.status_bacaan.toUpperCase(),
    r.is_corrected ? `(Correction: ${r.correction_note}) ${r.nota || ''}` : r.nota || '-',
    r.dicatat_oleh_user?.full_name || 'Staff'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: tableHeaders,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] }, // slate-600
    styles: { fontSize: 8, font: 'Helvetica' },
    columnStyles: {
      2: { fontStyle: 'bold' },
      4: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight breaches in red, warning in yellow
      if (data.column.index === 4) {
        const val = data.cell.text[0];
        if (val === 'BREACH') {
          data.cell.styles.textColor = [239, 68, 68]; // danger (#ef4444)
        } else if (val === 'WARNING') {
          data.cell.styles.textColor = [245, 158, 11]; // warning (#f59e0b)
        } else {
          data.cell.styles.textColor = [34, 197, 94]; // success (#22c55e)
        }
      }
    },
    margin: { left: 10, right: 10 }
  });

  // Verification area
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  // Drawing signature blocks
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  
  // Prepared by
  doc.line(10, finalY + 20, 80, finalY + 20);
  doc.text('Prepared By:', 10, finalY);
  doc.text('Signature & Stamp', 10, finalY + 24);
  doc.text('Date: .......................................', 10, finalY + 28);

  // Verified by
  doc.line(120, finalY + 20, 190, finalY + 20);
  doc.text('Verified & Audited By:', 120, finalY);
  doc.text('Signature & Stamp (Unit Officer)', 120, finalY + 24);
  doc.text('Date: .......................................', 120, finalY + 28);

  // Save the document
  const fileName = `Temp_Report_${unit.unit_id}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
}

/**
 * Helper to get clean English labels for types
 */
function getJenisUnitLabel(jenis: string): string {
  switch (jenis) {
    case 'freezer': return 'Freezer';
    case 'refrigerator': return 'Refrigerator';
    case 'ambient': return 'Room Temp (Ambient)';
    case 'incubator': return 'Incubator';
    default: return 'Other';
  }
}

/**
 * Export breach events to CSV file
 */
export function exportBreachLogsToCsv(readings: BacaanSuhuWithRelations[]): void {
  const headers = ['No.', 'Unit ID', 'Unit Name', 'Location', 'Recorded Temp', 'Min Threshold', 'Max Threshold', 'Date & Time', 'Logged By', 'Correction Status', 'Notes / Comments'];
  
  const rows = readings.map((r, i) => [
    i + 1,
    r.unit?.unit_id || '-',
    r.unit?.nama_unit || '-',
    r.unit?.lokasi?.nama_lokasi || '-',
    `${r.suhu.toFixed(1)}°C`,
    `${Number(r.ambang?.min_suhu || 0).toFixed(1)}°C`,
    `${Number(r.ambang?.max_suhu || 0).toFixed(1)}°C`,
    format(new Date(r.tarikh_masa), 'yyyy-MM-dd HH:mm:ss'),
    r.dicatat_oleh_user?.full_name || '-',
    r.is_corrected ? 'AMENDED' : 'ORIGINAL',
    r.is_corrected ? `(Correction Note: ${r.correction_note}) ${r.nota || ''}` : r.nota || '-'
  ]);

  // Combine CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      // Escape commas and quotes
      const strVal = String(val).replace(/"/g, '""');
      return strVal.includes(',') || strVal.includes('\n') ? `"${strVal}"` : strVal;
    }).join(','))
  ].join('\n');

  // Download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Temp_Breach_Log_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
