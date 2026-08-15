// src/modules/mysuhu/services/suhuReportService.ts
// MySuhu PDF and CSV exporting service

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { UnitPemantauanWithRelations, BacaanSuhuWithRelations } from '@/types/mysuhu';
import { drawHospitalHeader } from '@/lib/pdfHeader';

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
  hospitalName = 'Hospital Operation And Management Ecosystem (HOME)'
}: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const textColor = [51, 65, 85]; // slate-700
  
  // Load Jata Negara logo
  const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png');

  // Calculate summary stats
  const totalLogs = readings.length;
  const breachLogs = readings.filter(r => r.status_bacaan === 'breach').length;
  const warningLogs = readings.filter(r => r.status_bacaan === 'warning').length;
  const temps = readings.map(r => r.suhu);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
  const avgTemp = temps.length > 0 ? Number((temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(1)) : 0;

  // Draw standard Hospital Lawas Header
  const headerEndY = await drawHospitalHeader(doc, { margin: 10, startY: 10, logoBase64 });
  let currentY = headerEndY;

  // Document Title
  doc.setTextColor(51, 65, 85);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KKM TEMPERATURE MONITORING AUDIT REPORT', 10, currentY);

  // Date printed
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Printed Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 145, currentY);

  // Divider
  currentY += 3;
  doc.setDrawColor(226, 232, 240);
  doc.line(10, currentY, 200, currentY);

  // Metadata block (Location & Unit info)
  currentY += 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Monitoring Unit Information', 10, currentY);

  const minLimit = unit.active_threshold?.min_suhu !== undefined ? `${unit.active_threshold.min_suhu}°C` : '-';
  const maxLimit = unit.active_threshold?.max_suhu !== undefined ? `${unit.active_threshold.max_suhu}°C` : '-';
  const startStr = startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Earliest';
  const endStr = endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Present';

  doc.setFont('Helvetica', 'normal');
  currentY += 5;
  doc.text(`Unit Name: ${unit.nama_unit} (${unit.unit_id})`, 10, currentY);
  doc.text(`Safe Range Threshold: ${minLimit} to ${maxLimit}`, 110, currentY);

  currentY += 4;
  doc.text(`Unit Type: ${getJenisUnitLabel(unit.jenis_unit)}`, 10, currentY);
  doc.text(`Report Period: ${startStr} - ${endStr}`, 110, currentY);

  currentY += 4;
  doc.text(`Location: ${unit.lokasi?.nama_lokasi || '-'} (${unit.lokasi?.kod_lokasi || '-'})`, 10, currentY);

  currentY += 4;
  doc.text(`Department: ${unit.lokasi?.jabatan || '-'}`, 10, currentY);

  // Divider
  currentY += 4;
  doc.line(10, currentY, 200, currentY);

  // Summary Metrics Table
  const monthYearSummaryStr = startDate 
    ? format(new Date(startDate), 'MMMM yyyy') 
    : readings.length > 0 
      ? format(new Date(readings[0].tarikh_masa), 'MMMM yyyy') 
      : format(new Date(), 'MMMM yyyy');

  currentY += 6;
  doc.setFont('Helvetica', 'bold');
  doc.text(`Audit Compliance Summary - ${monthYearSummaryStr.toUpperCase()}`, 10, currentY);

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
    startY: currentY + 3,
    head: metricsHeaders,
    body: metricsRows,
    theme: 'grid',
    headStyles: { fillColor: [190, 24, 74] },
    styles: { fontSize: 9, font: 'Helvetica' },
    margin: { left: 10, right: 10 }
  });

  // Inject Chart Image if exists
  currentY = (doc as any).lastAutoTable.finalY + 8;
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

  // Determine if we need to add a page break before the Detailed Log Table
  if (chartImageBase64) {
    // If chart is present, it fills Page 1. Start table on Page 2.
    doc.addPage();
    currentY = 15;
  } else {
    // If no chart is present, start the table immediately on Page 1 to avoid empty spaces
    currentY = (doc as any).lastAutoTable.finalY + 10;
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
    r.is_corrected 
      ? `(Correction: ${r.correction_note}) ${r.nota && r.nota !== 'Auto-plotted compliance reading' ? r.nota : ''}` 
      : (r.nota && r.nota !== 'Auto-plotted compliance reading' ? r.nota : '-'),
    r.dicatat_oleh_user?.full_name || 'Staff'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: tableHeaders,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] }, // slate-600
    styles: { 
      fontSize: 6.2, 
      font: 'Helvetica',
      cellPadding: 0.7 // tight padding to fit 60 rows on 1 page
    },
    columnStyles: {
      2: { fontStyle: 'bold' },
      4: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight weekends and public holidays with a soft cool blue background row color
      if (data.row.section === 'body') {
        const dateStr = (data.row.raw as any)[1]; // Date & Time string
        if (typeof dateStr === 'string') {
          const parts = dateStr.split(' ');
          if (parts[0]) {
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
              const d = parseInt(dateParts[0], 10);
              const m = parseInt(dateParts[1], 10) - 1;
              const y = parseInt(dateParts[2], 10);
              const rowDate = new Date(y, m, d);
              if (isWeekendOrPublicHoliday(rowDate)) {
                data.cell.styles.fillColor = [239, 246, 255]; // blue-50 (#eff6ff)
              }
            }
          }
        }
      }

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
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY > 260) {
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

  // =========================================================================
  // PAGE 3: LANDSCAPE TEMPERATURE MONITORING CHART (KKM FORMAT)
  // =========================================================================
  doc.addPage('a4', 'l');

  // 1. Grid Settings (Calculated first to allow scope sharing)
  const gridXStart = 25;
  const gridXEnd = 287;
  const gridWidth = gridXEnd - gridXStart; // 262
  const colW = gridWidth / 62; // 4.2258 mm

  const gridYStart = 48; // Below day header boxes
  const rowH = colW; // 4.2258 mm (makes it EXACTLY square!)

  // Y axis range definition based on active threshold values (self-correcting range)
  const minLimitVal = unit.active_threshold?.min_suhu ?? 2;
  const maxLimitVal = unit.active_threshold?.max_suhu ?? 8;
  
  let startTemp = -5;
  let endTemp = 25;
  if (minLimitVal < 0) {
    // Freezer range (expanded to 30 range)
    startTemp = -35;
    endTemp = -5;
  } else if (minLimitVal >= 30) {
    // Incubator range (expanded to 30 range)
    startTemp = 20;
    endTemp = 50;
  } else if (minLimitVal >= 12) {
    // Ambient range (expanded to 30 range)
    startTemp = 5;
    endTemp = 35;
  } else {
    // Refrigerator range (default, expanded to 30 range)
    startTemp = -5;
    endTemp = 25;
  }
  const tempRange = endTemp - startTemp;
  const gridHeight = tempRange * rowH; // 30 * 4.2258 = 126.77 mm
  const gridYEnd = gridYStart + gridHeight;

  // Helper to draw lines with gap support (breaks line when points are missing)
  const drawLineWithGaps = (
    pts: { x: number; y: number | null }[],
    color: [number, number, number],
    lineWidth: number,
    dashPattern: number[] | null = null
  ) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(lineWidth);
    if (dashPattern && typeof (doc as any).setLineDash === 'function') {
      (doc as any).setLineDash(dashPattern, 0);
    } else if (dashPattern && typeof (doc as any).setLineDashPattern === 'function') {
      (doc as any).setLineDashPattern(dashPattern, 0);
    }

    let prevPoint: { x: number; y: number } | null = null;
    pts.forEach(p => {
      if (p.y !== null) {
        // Clamp Y to grid boundaries to prevent lines spilling outside
        const yClamped = Math.max(gridYStart, Math.min(gridYEnd, p.y));
        if (prevPoint !== null) {
          doc.line(prevPoint.x, prevPoint.y, p.x, yClamped);
        }
        prevPoint = { x: p.x, y: yClamped };
      } else {
        prevPoint = null; // Gap! Break the line
      }
    });

    // Reset dash pattern
    if (dashPattern && typeof (doc as any).setLineDash === 'function') {
      (doc as any).setLineDash([], 0);
    } else if (dashPattern && typeof (doc as any).setLineDashPattern === 'function') {
      (doc as any).setLineDashPattern([], 0);
    }
  };

  // 2. Header Block (Enlarged)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Draw Jata Negara (Enlarged)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 12, 10, 16, 12);
    } catch (e) {
      console.error('Failed to draw logo on page 3', e);
    }
  }

  // Header Titles (Enlarged)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 31, 14.5);
  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(hospitalName.toUpperCase(), 31, 19.5);

  // Box on the right (Enlarged)
  doc.rect(200, 10, 87, 10);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REKOD PEMANTAUAN SUHU PETI SEJUK FARMASI', 203, 16.5);

  // 3. Metadata Block (Expanded height, no vertical dividers)
  doc.rect(10, 22, 277, 12);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('LOKASI:', 12, 26.5);
  doc.text('BULAN/TAHUN:', 12, 31.5);

  doc.setFont('Helvetica', 'normal');
  doc.text(unit.lokasi?.nama_lokasi || '-', 25, 26.5);
  const formattedMonthStr = startDate 
    ? format(new Date(startDate), 'MMMM yyyy').toUpperCase() 
    : format(new Date(), 'MMMM yyyy').toUpperCase();
  doc.text(formattedMonthStr, 35, 31.5);

  // Center column
  doc.setFont('Helvetica', 'bold');
  doc.text(unit.nama_unit.toUpperCase(), 120, 26.5);
  doc.setFont('Helvetica', 'normal');
  doc.text('JULAT SUHU:', 120, 31.5);
  
  const minLimitText = unit.active_threshold?.min_suhu !== undefined ? `${unit.active_threshold.min_suhu}°C` : '-';
  const maxLimitText = unit.active_threshold?.max_suhu !== undefined ? `${unit.active_threshold.max_suhu}°C` : '-';
  doc.setFont('Helvetica', 'bold');
  doc.text(`${minLimitText} - ${maxLimitText}`, 142, 31.5);

  // Right column
  doc.setFont('Helvetica', 'normal');
  doc.text('NO. SIRI PETI SEJUK:', 185, 26.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(unit.unit_id, 220, 26.5);
  
  doc.setFont('Helvetica', 'normal');
  doc.text('--------------------------------------------------------------', 185, 31.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${minLimitText} - ${maxLimitText}`, 265, 31.5);

  // Draw Horizontal Grid Lines and Y labels (Enhanced grid line color)
  for (let r = 0; r <= tempRange; r++) {
    const y = gridYStart + r * rowH;
    const tempLabel = endTemp - r;

    // Y Axis Label (Muted Slate 500, clean Helvetica normal, horizontally centered in column)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Smart vertical adjustment to avoid crossing grid border lines
    let yOffset = y + 0.9; // Centered on line
    if (tempLabel === endTemp) {
      yOffset = y + 2.2; // Shift top label down
    } else if (tempLabel === startTemp) {
      yOffset = y - 0.3; // Shift bottom label up
    }
    doc.text(String(tempLabel), 18.5, yOffset, { align: 'center' });

    // Grid Horizontal Line
    if (tempLabel === minLimitVal || tempLabel === maxLimitVal) {
      doc.setDrawColor(239, 68, 68); // Red for limits
      doc.setLineWidth(0.4);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([2, 2], 0);
      } else if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([2, 2], 0);
      }
      doc.line(gridXStart, y, gridXEnd, y);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([], 0);
      } else if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([], 0);
      }
    } else {
      doc.setDrawColor(170, 185, 205); // High visibility Slate 350 grid line (clearly visible)
      doc.setLineWidth(0.2); // clearly visible width
      doc.line(gridXStart, y, gridXEnd, y);
    }
  }

  // Draw Vertical Lines and X Headers (Day number boxes & AM/PM boxes)
  doc.setDrawColor(71, 85, 105); // Clean Slate 600 for main header rows
  doc.setLineWidth(0.35);
  doc.line(12, 38, gridXEnd, 38); // Top header line
  doc.line(12, 43, gridXEnd, 43); // Mid header line
  doc.line(12, 48, gridXEnd, 48); // Bot header line

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42); // slate-900
  // Centered horizontally inside the Y-label column (X=12 to X=25, center=18.5)
  doc.text('SUHU', 18.5, 42.0, { align: 'center' });
  doc.text('(°C)', 18.5, 46.2, { align: 'center' });

  // Grid vertical border on left
  doc.line(12, 38, 12, gridYEnd);

  // Month date range calculations
  const currentYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
  const currentMonth = startDate ? new Date(startDate).getMonth() : new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let c = 0; c <= 62; c++) {
    const x = gridXStart + c * colW;
    
    // Draw vertical divider
    if (c === 0 || c === 62) {
      doc.setDrawColor(71, 85, 105); // Slate 600 border outer grid
      doc.setLineWidth(0.35);
      doc.line(x, 38, x, gridYEnd);
    } else if (c % 2 === 0) {
      doc.setDrawColor(100, 116, 139); // Slate 500 divider separating day boxes (solid, clearly visible)
      doc.setLineWidth(0.25);
      doc.line(x, 38, x, gridYEnd);
    } else {
      doc.setDrawColor(170, 185, 205); // Slate 350 for AM/PM separators
      doc.setLineWidth(0.2);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([1, 1], 0);
      } else if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([1, 1], 0);
      }
      doc.line(x, 43, x, gridYEnd);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([], 0);
      } else if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([], 0);
      }
    }

    // X Axis Labels
    if (c < 62) {
      if (c % 2 === 0) {
        const day = (c / 2) + 1;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(String(day), x + colW, 41.5, { align: 'center' });
      }
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(c % 2 === 0 ? 'AM' : 'PM', x + colW / 2, 46.5, { align: 'center' });
    }
  }

  // 4. Plot Readings
  const readingsMap: { [key: string]: BacaanSuhuWithRelations } = {};
  readings.forEach(r => {
    const d = new Date(r.tarikh_masa);
    const day = d.getDate();
    const isMorning = d.getHours() < 12;
    const key = `${day}_${isMorning ? 0 : 1}`;
    readingsMap[key] = r;
  });

  const pointsTemp: { x: number; y: number | null }[] = [];
  const pointsMin: { x: number; y: number | null }[] = [];
  const pointsMax: { x: number; y: number | null }[] = [];

  for (let d = 1; d <= 31; d++) {
    if (d > daysInMonth) continue;
    for (let shift = 0; shift < 2; shift++) {
      const colIndex = (d - 1) * 2 + shift;
      const x = gridXStart + colW * (colIndex + 0.5);
      const key = `${d}_${shift}`;
      const log = readingsMap[key];

      if (log) {
        const yTemp = gridYEnd - ((log.suhu - startTemp) / tempRange) * gridHeight;
        pointsTemp.push({ x, y: yTemp });

        if (log.suhu_min !== undefined && log.suhu_min !== null) {
          const yMin = gridYEnd - ((log.suhu_min - startTemp) / tempRange) * gridHeight;
          pointsMin.push({ x, y: yMin });
        } else {
          pointsMin.push({ x, y: null });
        }

        if (log.suhu_max !== undefined && log.suhu_max !== null) {
          const yMax = gridYEnd - ((log.suhu_max - startTemp) / tempRange) * gridHeight;
          pointsMax.push({ x, y: yMax });
        } else {
          pointsMax.push({ x, y: null });
        }
      } else {
        pointsTemp.push({ x, y: null });
        pointsMin.push({ x, y: null });
        pointsMax.push({ x, y: null });
      }
    }
  }

  // Draw Connecting Lines
  // Semasa (Current) - Solid Blue Line
  drawLineWithGaps(pointsTemp, [59, 130, 246], 0.4, null);

  // Minima - Dashed Green Line
  drawLineWithGaps(pointsMin, [34, 197, 94], 0.35, [1.5, 1.5]);

  // Maksima - Dashed Red Line
  drawLineWithGaps(pointsMax, [239, 68, 68], 0.35, [1.5, 1.5]);

  // Draw Data Point Markers (clamped to grid coordinates)
  for (let d = 1; d <= 31; d++) {
    if (d > daysInMonth) continue;
    for (let shift = 0; shift < 2; shift++) {
      const colIndex = (d - 1) * 2 + shift;
      const x = gridXStart + colW * (colIndex + 0.5);
      const key = `${d}_${shift}`;
      const log = readingsMap[key];

      if (log) {
        const yTemp = Math.max(gridYStart, Math.min(gridYEnd, gridYEnd - ((log.suhu - startTemp) / tempRange) * gridHeight));

        // Semasa - Filled Blue Circle
        doc.setFillColor(59, 130, 246);
        doc.circle(x, yTemp, 0.7, 'F');

        if (log.suhu_min !== undefined && log.suhu_min !== null) {
          const yMin = Math.max(gridYStart, Math.min(gridYEnd, gridYEnd - ((log.suhu_min - startTemp) / tempRange) * gridHeight));
          // Minima - Filled Green Circle
          doc.setFillColor(34, 197, 94);
          doc.circle(x, yMin, 0.7, 'F');
        }

        if (log.suhu_max !== undefined && log.suhu_max !== null) {
          const yMax = Math.max(gridYStart, Math.min(gridYEnd, gridYEnd - ((log.suhu_max - startTemp) / tempRange) * gridHeight));
          // Maksima - Red X Cross
          doc.setDrawColor(239, 68, 68);
          doc.setLineWidth(0.4);
          doc.line(x - 0.7, yMax - 0.7, x + 0.7, yMax + 0.7);
          doc.line(x + 0.7, yMax - 0.7, x - 0.7, yMax + 0.7);
        }
      }
    }
  }

  // 5. Legend and Footer Block (Shifted down to bottom, Matches layout, no vertical divider lines)
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.rect(10, 178, 277, 26);

  // Column 1: Petunjuk
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Petunjuk:', 12, 182.5);
  
  // Legend circles
  doc.setFillColor(239, 68, 68);
  doc.circle(15, 186.5, 1.2, 'F');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Maksima (Merah)', 19, 187.5);

  doc.setFillColor(34, 197, 94);
  doc.circle(15, 191.5, 1.2, 'F');
  doc.text('Minima (Hijau)', 19, 192.5);

  doc.setFillColor(59, 130, 246);
  doc.circle(15, 196.5, 1.2, 'F');
  doc.text('Semasa (Biru)', 19, 197.5);

  // Column 2: Arahan & Jadual (Side-by-side format)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Arahan & Jadual:', 95, 182.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Isnin - Jumaat:', 95, 187.5);
  doc.setFont('Helvetica', 'normal');
  doc.text('08:00 AM & 05:00 PM', 95, 191.5);
  
  doc.setFont('Helvetica', 'bold');
  doc.text('Hujung Minggu:', 160, 187.5);
  doc.setFont('Helvetica', 'normal');
  doc.text('08:00 AM & 12:00 PM', 160, 191.5);

  // Column 3: Warning Message aligned bottom-right
  doc.setTextColor(220, 38, 38); // Red 600
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8);
  doc.text('*Sila lapor segera kepada Ketua Unit jika suhu di luar julat standard.', 200, 197.5);

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
    r.is_corrected ? `(Correction Note: ${r.correction_note}) ${r.nota && r.nota !== 'Auto-plotted compliance reading' ? r.nota : ''}` : (r.nota && r.nota !== 'Auto-plotted compliance reading' ? r.nota : '-')
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

/**
 * Helper to check if a date is a weekend or a Malaysian public holiday
 */
function isWeekendOrPublicHoliday(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true; // Sunday or Saturday
  
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();

  // Support 2026 Malaysia national public holidays
  if (y === 2026) {
    // New Year's Day: Jan 1
    if (m === 0 && d === 1) return true;
    
    // Thaipusam: Feb 1, observed Feb 2 (Monday)
    if (m === 1 && (d === 1 || d === 2)) return true;
    
    // Chinese New Year: Feb 17 & Feb 18
    if (m === 1 && (d === 17 || d === 18)) return true;
    
    // Hari Raya Aidilfitri: March 21 & March 22, observed March 23 (Monday)
    if (m === 2 && (d === 21 || d === 22 || d === 23)) return true;
    
    // Labour Day: May 1
    if (m === 4 && d === 1) return true;
    
    // Hari Raya Haji: May 27
    if (m === 4 && d === 27) return true;
    
    // Wesak Day: May 31, observed June 1 (Monday)
    if (m === 4 && d === 31) return true;
    
    // Agong's Birthday: June 1, observed June 2 (Monday) due to Wesak
    if (m === 5 && (d === 1 || d === 2)) return true;
    
    // Awal Muharram: June 17
    if (m === 5 && d === 17) return true;
    
    // Prophet Muhammad's Birthday (Maulidur Rasul): August 25
    if (m === 7 && d === 25) return true;
    
    // National Day: August 31
    if (m === 7 && d === 31) return true;
    
    // Malaysia Day: September 16
    if (m === 8 && d === 16) return true;
    
    // Deepavali: November 8, observed November 9 (Monday)
    if (m === 10 && (d === 8 || d === 9)) return true;
    
    // Christmas Day: December 25
    if (m === 11 && d === 25) return true;
  } else {
    // Basic fixed date holiday check for other years
    if (m === 0 && d === 1) return true; // New Year
    if (m === 4 && d === 1) return true; // Labour Day
    if (m === 7 && d === 31) return true; // National Day
    if (m === 8 && d === 16) return true; // Malaysia Day
    if (m === 11 && d === 25) return true; // Christmas
  }
  return false;
}
