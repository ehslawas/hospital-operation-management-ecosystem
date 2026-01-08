'use client';

import { useEffect, useState } from 'react';
import { IconChart, IconFile, IconDownload, IconFilter, IconSearch, IconClock, IconBox, IconTruck, IconReceipt, IconMoney, IconBeaker, IconCog } from '@/components/ui/Icons';

// Mock data for comprehensive reports
const mockReports = {
  officeAdmin: {
    oxygen: {
      stockLevels: [
        { id: 1, itemName: 'Medical Oxygen Tank 40L', sku: 'O2-40L', currentStock: 8, minLevel: 15, maxLevel: 50, status: 'Critical', location: 'Oxygen Store', lastUpdated: '2025-01-15' },
        { id: 2, itemName: 'PI 1.4 (Private)', sku: 'PI-1.4', currentStock: 50, minLevel: 40, maxLevel: 120, status: 'Good', location: 'Main Store', lastUpdated: '2025-01-15' },
        { id: 3, itemName: 'BN 6.4 (Private)', sku: 'BN-6.4', currentStock: 35, minLevel: 30, maxLevel: 90, status: 'Good', location: 'Main Store', lastUpdated: '2025-01-15' }
      ],
      nearExpiry: [
        { id: 1, itemName: 'Oxygen Regulator Set', sku: 'O2-REG', batchNo: 'REG2025A', quantity: 12, expiryDate: '2025-03-31', daysToExpiry: 84, status: 'Warning' }
      ]
    },
    purchasing: {
      purchaseOrders: [
        { id: 1, poNumber: 'PO-2025-001', supplier: 'Linde Malaysia', orderDate: '2025-01-10', expectedDelivery: '2025-01-18', status: 'In Transit', totalAmount: 18500, items: 3 },
        { id: 2, poNumber: 'PO-2025-002', supplier: 'Air Products', orderDate: '2025-01-08', expectedDelivery: '2025-01-20', status: 'Pending', totalAmount: 22400, items: 4 }
      ],
      supplierPerformance: [
        { id: 1, supplier: 'Linde Malaysia', totalOrders: 42, onTimeDelivery: 39, lateDelivery: 3, qualityIssues: 0, rating: 4.7, totalValue: 820000 },
        { id: 2, supplier: 'Air Products', totalOrders: 31, onTimeDelivery: 27, lateDelivery: 4, qualityIssues: 1, rating: 4.3, totalValue: 605000 }
      ]
    },
    payment: {
      payables: [
        { id: 1, invoiceNo: 'INV-2025-001', supplier: 'Linde Malaysia', amount: 12500, dueDate: '2025-01-25', status: 'Pending', ageDays: 7 },
        { id: 2, invoiceNo: 'INV-2025-002', supplier: 'Air Products', amount: 9800, dueDate: '2025-01-22', status: 'Overdue', ageDays: 10 },
        { id: 3, invoiceNo: 'INV-2025-003', supplier: 'MedSupply Sdn Bhd', amount: 6450, dueDate: '2025-02-02', status: 'Scheduled', ageDays: 0 }
      ],
      summary: { totalDue: 28750, overdue: 9800, scheduled: 6450, pending: 12500 }
    },
    receiving: {
      receipts: [
        { id: 1, doNo: 'DO-2025-010', documentNo: 'DOC-010', supplier: 'Linde Malaysia', date: '2025-01-14', items: 12, cylinders: 20, status: 'Received' },
        { id: 2, doNo: 'DO-2025-011', documentNo: 'DOC-011', supplier: 'Air Products', date: '2025-01-12', items: 9, cylinders: 15, status: 'Pending QA' }
      ]
    }
  },
  inventory: {
    stockLevels: [
      { id: 1, itemName: 'Paracetamol 500mg', sku: 'PAR500', currentStock: 1250, minLevel: 500, maxLevel: 2000, status: 'Good', category: 'Drug', location: 'Main Store', lastUpdated: '2024-01-15' },
      { id: 2, itemName: 'Insulin Glargine 100IU', sku: 'INS100', currentStock: 45, minLevel: 100, maxLevel: 300, status: 'Low', category: 'Drug', location: 'Cold Storage', lastUpdated: '2024-01-15' },
      { id: 3, itemName: 'Surgical Gloves Size M', sku: 'SG-M', currentStock: 5000, minLevel: 2000, maxLevel: 8000, status: 'Good', category: 'Non-Drug', location: 'Main Store', lastUpdated: '2024-01-15' },
      { id: 4, itemName: 'Medical Oxygen Tank 40L', sku: 'O2-40L', currentStock: 8, minLevel: 15, maxLevel: 50, status: 'Critical', category: 'Medical Gas', location: 'Oxygen Store', lastUpdated: '2024-01-15' },
      { id: 5, itemName: 'IV Normal Saline 0.9%', sku: 'IV-NS', currentStock: 200, minLevel: 100, maxLevel: 500, status: 'Good', category: 'Drug', location: 'Main Store', lastUpdated: '2024-01-15' }
    ],
    nearExpiry: [
      { id: 1, itemName: 'Amoxicillin 250mg', sku: 'AMX250', batchNo: 'AMX2024001', quantity: 500, expiryDate: '2024-03-15', daysToExpiry: 59, status: 'Warning', category: 'Drug' },
      { id: 2, itemName: 'Morphine 10mg', sku: 'MOR10', batchNo: 'MOR2024002', quantity: 100, expiryDate: '2024-02-28', daysToExpiry: 44, status: 'Critical', category: 'Controlled Drug' },
      { id: 3, itemName: 'Diazepam 5mg', sku: 'DIA5', batchNo: 'DIA2024003', quantity: 200, expiryDate: '2024-04-10', daysToExpiry: 85, status: 'Warning', category: 'Controlled Drug' }
    ],
    slowMoving: [
      { id: 1, itemName: 'Chloroquine 250mg', sku: 'CHL250', currentStock: 800, lastMovement: '2023-11-15', daysSinceMovement: 61, turnoverRate: 0.1, category: 'Drug' },
      { id: 2, itemName: 'Quinine Sulfate 300mg', sku: 'QUI300', currentStock: 600, lastMovement: '2023-10-20', daysSinceMovement: 87, turnoverRate: 0.05, category: 'Drug' },
      { id: 3, itemName: 'Old Surgical Instruments Set', sku: 'OSI-SET', currentStock: 5, lastMovement: '2023-09-10', daysSinceMovement: 127, turnoverRate: 0.02, category: 'Non-Drug' }
    ]
  },
  financial: {
    budgetUtilization: [
      { id: 1, category: 'Drug Procurement', allocated: 500000, utilized: 425000, remaining: 75000, utilizationRate: 85, status: 'Good' },
      { id: 2, category: 'Non-Drug Procurement', allocated: 200000, utilized: 195000, remaining: 5000, utilizationRate: 97.5, status: 'Warning' },
      { id: 3, category: 'Medical Equipment', allocated: 300000, utilized: 150000, remaining: 150000, utilizationRate: 50, status: 'Underutilized' },
      { id: 4, category: 'Emergency Stock', allocated: 100000, utilized: 95000, remaining: 5000, utilizationRate: 95, status: 'Warning' }
    ],
    costAnalysis: [
      { id: 1, department: 'Emergency Department', totalCost: 125000, drugCost: 85000, nonDrugCost: 40000, percentage: 25.5 },
      { id: 2, department: 'General Ward', totalCost: 98000, drugCost: 65000, nonDrugCost: 33000, percentage: 20.0 },
      { id: 3, department: 'ICU', totalCost: 156000, drugCost: 120000, nonDrugCost: 36000, percentage: 31.8 },
      { id: 4, department: 'Surgery', totalCost: 110000, drugCost: 70000, nonDrugCost: 40000, percentage: 22.4 }
    ]
  },
  procurement: {
    purchaseOrders: [
      { id: 1, poNumber: 'PO-2024-001', supplier: 'MedSupply Sdn Bhd', orderDate: '2024-01-10', expectedDelivery: '2024-01-25', status: 'Pending', totalAmount: 45000, items: 15 },
      { id: 2, poNumber: 'PO-2024-002', supplier: 'PharmaCorp Malaysia', orderDate: '2024-01-12', expectedDelivery: '2024-01-28', status: 'In Transit', totalAmount: 32000, items: 8 },
      { id: 3, poNumber: 'PO-2024-003', supplier: 'MedTech Solutions', orderDate: '2024-01-08', expectedDelivery: '2024-01-22', status: 'Delivered', totalAmount: 28000, items: 12 }
    ],
    supplierPerformance: [
      { id: 1, supplier: 'MedSupply Sdn Bhd', totalOrders: 25, onTimeDelivery: 22, lateDelivery: 3, qualityIssues: 1, rating: 4.2, totalValue: 450000 },
      { id: 2, supplier: 'PharmaCorp Malaysia', totalOrders: 18, onTimeDelivery: 16, lateDelivery: 2, qualityIssues: 0, rating: 4.5, totalValue: 320000 },
      { id: 3, supplier: 'MedTech Solutions', totalOrders: 12, onTimeDelivery: 10, lateDelivery: 2, qualityIssues: 2, rating: 3.8, totalValue: 180000 }
    ]
  },
  distribution: {
    interFacility: [
      { id: 1, requestId: 'IF-2024-001', fromFacility: 'Main Hospital', toFacility: 'Clinic A', requestDate: '2024-01-15', status: 'Completed', totalItems: 25, totalValue: 15000 },
      { id: 2, requestId: 'IF-2024-002', fromFacility: 'Main Hospital', toFacility: 'Clinic B', requestDate: '2024-01-14', status: 'In Transit', totalItems: 18, totalValue: 12000 },
      { id: 3, requestId: 'IF-2024-003', fromFacility: 'Main Hospital', toFacility: 'Clinic C', requestDate: '2024-01-13', status: 'Pending', totalItems: 32, totalValue: 25000 }
    ],
    intraFacility: [
      { id: 1, requestId: 'IA-2024-001', fromDepartment: 'Pharmacy', toDepartment: 'Emergency', requestDate: '2024-01-15', status: 'Completed', totalItems: 15, totalValue: 8000 },
      { id: 2, requestId: 'IA-2024-002', fromDepartment: 'Pharmacy', toDepartment: 'ICU', requestDate: '2024-01-14', status: 'In Progress', totalItems: 22, totalValue: 15000 },
      { id: 3, requestId: 'IA-2024-003', fromDepartment: 'Pharmacy', toDepartment: 'General Ward', requestDate: '2024-01-13', status: 'Completed', totalItems: 28, totalValue: 12000 }
    ]
  },
  compliance: {
    auditTrail: [
      { id: 1, action: 'Stock Adjustment', user: 'Dr. Ahmad Rahman', department: 'Pharmacy', timestamp: '2024-01-15 14:30:25', details: 'Adjusted Paracetamol stock by +50 units', status: 'Approved' },
      { id: 2, action: 'Controlled Drug Issue', user: 'Nurse Sarah Lim', department: 'ICU', timestamp: '2024-01-15 13:45:12', details: 'Issued Morphine 10mg x 5 vials', status: 'Approved' },
      { id: 3, action: 'Expired Item Disposal', user: 'Pharm Tech Ali', department: 'Pharmacy', timestamp: '2024-01-15 11:20:45', details: 'Disposed expired Amoxicillin batch AMX2023001', status: 'Pending Review' }
    ],
    regulatoryCompliance: [
      { id: 1, regulation: 'Poisons Act 1952', compliance: 98, lastAudit: '2024-01-10', nextAudit: '2024-04-10', issues: 2, status: 'Compliant' },
      { id: 2, regulation: 'Good Distribution Practice', compliance: 95, lastAudit: '2024-01-05', nextAudit: '2024-07-05', issues: 3, status: 'Minor Issues' },
      { id: 3, regulation: 'Pharmacy Act 1951', compliance: 100, lastAudit: '2024-01-12', nextAudit: '2024-04-12', issues: 0, status: 'Fully Compliant' }
    ]
  },
  analytics: {
    usagePatterns: [
      { id: 1, itemName: 'Paracetamol 500mg', dailyUsage: 150, weeklyUsage: 1050, monthlyUsage: 4500, trend: 'Stable', peakHours: '09:00-11:00' },
      { id: 2, itemName: 'Insulin Glargine', dailyUsage: 25, weeklyUsage: 175, monthlyUsage: 750, trend: 'Increasing', peakHours: '08:00-10:00' },
      { id: 3, itemName: 'Surgical Gloves', dailyUsage: 200, weeklyUsage: 1400, monthlyUsage: 6000, trend: 'Stable', peakHours: '07:00-09:00' }
    ],
    forecasting: [
      { id: 1, itemName: 'Paracetamol 500mg', currentStock: 1250, predictedUsage: 150, daysRemaining: 8, recommendedOrder: 2000, urgency: 'Medium' },
      { id: 2, itemName: 'Insulin Glargine', currentStock: 45, predictedUsage: 25, daysRemaining: 2, recommendedOrder: 300, urgency: 'High' },
      { id: 3, itemName: 'Medical Oxygen', currentStock: 8, predictedUsage: 2, daysRemaining: 4, recommendedOrder: 20, urgency: 'Critical' }
    ]
  },
  clinical: {
    antibioticUsage: [
      { id: 1, antibiotic: 'Amoxicillin 500mg', department: 'General Ward', totalUnits: 1250, patients: 85, averageDuration: 7, ddd: 875, costPerUnit: 2.50, totalCost: 3125, indication: 'Respiratory Infection', resistance: 'Low' },
      { id: 2, antibiotic: 'Ceftriaxone 1g IV', department: 'ICU', totalUnits: 450, patients: 32, averageDuration: 10, ddd: 450, costPerUnit: 15.80, totalCost: 7110, indication: 'Severe Sepsis', resistance: 'Moderate' },
      { id: 3, antibiotic: 'Azithromycin 250mg', department: 'Emergency', totalUnits: 680, patients: 136, averageDuration: 5, ddd: 340, costPerUnit: 3.20, totalCost: 2176, indication: 'Atypical Pneumonia', resistance: 'Low' },
      { id: 4, antibiotic: 'Ciprofloxacin 500mg', department: 'Surgery', totalUnits: 320, patients: 40, averageDuration: 8, ddd: 320, costPerUnit: 4.50, totalCost: 1440, indication: 'Post-Surgical Prophylaxis', resistance: 'Moderate' },
      { id: 5, antibiotic: 'Vancomycin 1g IV', department: 'ICU', totalUnits: 180, patients: 15, averageDuration: 12, ddd: 180, costPerUnit: 45.00, totalCost: 8100, indication: 'MRSA Infection', resistance: 'Low' },
      { id: 6, antibiotic: 'Metronidazole 500mg', department: 'General Ward', totalUnits: 540, patients: 45, averageDuration: 12, ddd: 540, costPerUnit: 1.80, totalCost: 972, indication: 'Anaerobic Infection', resistance: 'Low' },
      { id: 7, antibiotic: 'Meropenem 1g IV', department: 'ICU', totalUnits: 280, patients: 20, averageDuration: 14, ddd: 280, costPerUnit: 85.00, totalCost: 23800, indication: 'Multi-Drug Resistant Infection', resistance: 'Low' },
      { id: 8, antibiotic: 'Cloxacillin 500mg', department: 'Surgery', totalUnits: 760, patients: 95, averageDuration: 8, ddd: 760, costPerUnit: 2.20, totalCost: 1672, indication: 'Skin & Soft Tissue Infection', resistance: 'Low' }
    ],
    insulinUsage: [
      { id: 1, insulin: 'Insulin Glargine (Lantus)', strength: '100 IU/mL', department: 'General Ward', totalVials: 125, patients: 85, averageDose: '24 IU/day', totalUnits: 204000, costPerVial: 185.00, totalCost: 23125, indication: 'Type 2 Diabetes - Basal', adherence: 95 },
      { id: 2, insulin: 'Insulin Aspart (NovoRapid)', strength: '100 IU/mL', department: 'General Ward', totalVials: 95, patients: 72, averageDose: '18 IU/day', totalUnits: 155400, costPerVial: 165.00, totalCost: 15675, indication: 'Type 1 & 2 Diabetes - Bolus', adherence: 92 },
      { id: 3, insulin: 'Insulin Regular (Actrapid)', strength: '100 IU/mL', department: 'ICU', totalVials: 45, patients: 28, averageDose: 'Variable IV', totalUnits: 67500, costPerVial: 125.00, totalCost: 5625, indication: 'Diabetic Ketoacidosis', adherence: 100 },
      { id: 4, insulin: 'Insulin NPH (Humulin N)', strength: '100 IU/mL', department: 'General Ward', totalVials: 68, patients: 45, averageDose: '20 IU/day', totalUnits: 108000, costPerVial: 95.00, totalCost: 6460, indication: 'Type 2 Diabetes - Intermediate', adherence: 88 },
      { id: 5, insulin: 'Insulin Detemir (Levemir)', strength: '100 IU/mL', department: 'Maternity Ward', totalVials: 32, patients: 18, averageDose: '22 IU/day', totalUnits: 50400, costPerVial: 195.00, totalCost: 6240, indication: 'Gestational Diabetes', adherence: 98 },
      { id: 6, insulin: 'Insulin Lispro (Humalog)', strength: '100 IU/mL', department: 'Paediatric Ward', totalVials: 28, patients: 15, averageDose: '12 IU/day', totalUnits: 33600, costPerVial: 175.00, totalCost: 4900, indication: 'Type 1 Diabetes (Children)', adherence: 96 },
      { id: 7, insulin: 'Insulin Glulisine (Apidra)', strength: '100 IU/mL', department: 'Emergency', totalVials: 18, patients: 12, averageDose: '15 IU/day', totalUnits: 27000, costPerVial: 170.00, totalCost: 3060, indication: 'Acute Hyperglycemia', adherence: 100 }
    ],
    thalassemiaUsage: [
      { id: 1, therapy: 'Deferasirox (Exjade)', form: 'Tablet', strength: '250 mg', department: 'General Ward', patients: 62, avgDose: '20 mg/kg/day', monthlyUnits: 3720, adherence: 92, adverseEvents: 4, monitoring: 'Ferritin q3 months', totalCost: 55800 },
      { id: 2, therapy: 'Deferiprone', form: 'Tablet', strength: '500 mg', department: 'Paediatric Ward', patients: 35, avgDose: '75 mg/kg/day', monthlyUnits: 3150, adherence: 89, adverseEvents: 6, monitoring: 'ANC weekly (init), LFT monthly', totalCost: 28350 },
      { id: 3, therapy: 'Deferoxamine', form: 'Injection (SC infusion)', strength: '500 mg/vial', department: 'Day Care', patients: 18, avgDose: '40 mg/kg 5x/week', monthlyUnits: 1440, adherence: 78, adverseEvents: 3, monitoring: 'Audiology, Ophthalmology yearly', totalCost: 43200 },
      { id: 4, therapy: 'Folic Acid', form: 'Tablet', strength: '5 mg', department: 'General Ward', patients: 80, avgDose: '5 mg/day', monthlyUnits: 2400, adherence: 96, adverseEvents: 0, monitoring: 'None specific', totalCost: 1200 },
      { id: 5, therapy: 'Hydroxyurea', form: 'Capsule', strength: '500 mg', department: 'Haemato Clinic', patients: 22, avgDose: '15 mg/kg/day', monthlyUnits: 1320, adherence: 85, adverseEvents: 2, monitoring: 'CBC monthly', totalCost: 7920 },
      { id: 6, therapy: 'Packed RBC Transfusion', form: 'Transfusion', strength: '—', department: 'Day Care', patients: 74, avgDose: '2 units/4 weeks', monthlyUnits: 296, adherence: 100, adverseEvents: 1, monitoring: 'Pre-transfusion Hb, Crossmatch', totalCost: 88800 }
    ],
    thalassemiaSummary: {
      totalPatients: 291,
      transfusionDependent: 176,
      nonTransfusionDependent: 115,
      avgPreTransfusionHb: 8.7,
      medianFerritin: 1350,
      overTargetFerritinPatients: 64,
      chelationCoverage: 81,
      complications: { cardiac: 4, hepatic: 9, endocrine: 7, infection: 3 }
    },
    thalassemiaCohorts: [
      { cohort: '<5 years', patients: 28, genotype: 'β-thal major 82%', chelationStartMedianAgeY: 2.5 },
      { cohort: '5-12 years', patients: 76, genotype: 'β-thal major 75%', chelationStartMedianAgeY: 4.1 },
      { cohort: '13-18 years', patients: 59, genotype: 'β-thal intermedia 34%', chelationStartMedianAgeY: 6.2 },
      { cohort: 'Adult', patients: 128, genotype: 'Mixed', chelationStartMedianAgeY: 7.0 }
    ],
    ferritinTrends: [
      { month: '2024-08', medianFerritin: 1480, pctAboveTarget: 27 },
      { month: '2024-09', medianFerritin: 1440, pctAboveTarget: 26 },
      { month: '2024-10', medianFerritin: 1410, pctAboveTarget: 25 },
      { month: '2024-11', medianFerritin: 1380, pctAboveTarget: 24 },
      { month: '2024-12', medianFerritin: 1365, pctAboveTarget: 23 },
      { month: '2025-01', medianFerritin: 1350, pctAboveTarget: 22 }
    ],
    transfusionSchedule: [
      { frequency: 'Every 3 weeks', patients: 52, avgUnits: 2.4 },
      { frequency: 'Every 4 weeks', patients: 94, avgUnits: 2.0 },
      { frequency: 'Every 6-8 weeks', patients: 30, avgUnits: 1.6 }
    ],
    adherenceBands: [
      { band: '≥95%', patients: 122 },
      { band: '90-94%', patients: 68 },
      { band: '80-89%', patients: 49 },
      { band: '<80%', patients: 17 }
    ]
  }
};

const reportCategories = [
  {
    id: 'inventory',
    title: 'Inventory Reports',
    icon: <IconBox />,
    color: 'blue',
    reports: [
      { id: 'stock-levels', name: 'Stock Level Report', description: 'Current stock levels vs minimum/maximum thresholds' },
      { id: 'near-expiry', name: 'Near Expiry Report', description: 'Items approaching expiry date' },
      { id: 'slow-moving', name: 'Slow Moving Stock', description: 'Items with low turnover rates' },
      { id: 'stock-movement', name: 'Stock Movement Report', description: 'Detailed movement history' },
      { id: 'inventory-valuation', name: 'Inventory Valuation', description: 'Current inventory value by category' }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    icon: <IconMoney />,
    color: 'green',
    reports: [
      { id: 'budget-utilization', name: 'Budget Utilization', description: 'Budget allocation vs actual spending' },
      { id: 'cost-analysis', name: 'Cost Analysis by Department', description: 'Cost breakdown by department' },
      { id: 'expense-trends', name: 'Expense Trends', description: 'Monthly/quarterly expense patterns' },
      { id: 'roi-analysis', name: 'ROI Analysis', description: 'Return on investment for major purchases' }
    ]
  },
  {
    id: 'procurement',
    title: 'Procurement Reports',
    icon: <IconReceipt />,
    color: 'purple',
    reports: [
      { id: 'purchase-orders', name: 'Purchase Order Status', description: 'Current status of all purchase orders' },
      { id: 'supplier-performance', name: 'Supplier Performance', description: 'Supplier delivery and quality metrics' },
      { id: 'procurement-trends', name: 'Procurement Trends', description: 'Purchase patterns and trends' },
      { id: 'cost-comparison', name: 'Cost Comparison', description: 'Price comparison across suppliers' }
    ]
  },
  {
    id: 'distribution',
    title: 'Distribution Reports',
    icon: <IconTruck />,
    color: 'orange',
    reports: [
      { id: 'inter-facility', name: 'Inter-Facility Transfers', description: 'Transfers between different facilities' },
      { id: 'intra-facility', name: 'Intra-Facility Distribution', description: 'Internal department distributions' },
      { id: 'delivery-performance', name: 'Delivery Performance', description: 'Delivery time and accuracy metrics' }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance Reports',
    icon: <IconCog />,
    color: 'red',
    reports: [
      { id: 'audit-trail', name: 'Audit Trail', description: 'Complete audit trail of all transactions' },
      { id: 'regulatory-compliance', name: 'Regulatory Compliance', description: 'Compliance with healthcare regulations' },
      { id: 'quality-control', name: 'Quality Control', description: 'Quality control metrics and issues' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics Reports',
    icon: <IconChart />,
    color: 'indigo',
    reports: [
      { id: 'usage-patterns', name: 'Usage Patterns', description: 'Item usage patterns and trends' },
      { id: 'forecasting', name: 'Demand Forecasting', description: 'Predictive analytics for stock planning' },
      { id: 'kpi-dashboard', name: 'KPI Dashboard', description: 'Key performance indicators' }
    ]
  },
  {
    id: 'clinical',
    title: 'Clinical Reports',
    icon: <IconBeaker />,
    color: 'teal',
    reports: [
      { id: 'antibiotic-usage', name: 'Antibiotic Usage Report', description: 'Comprehensive antibiotic consumption and stewardship data' },
      { id: 'insulin-usage', name: 'Insulin Usage Report', description: 'Detailed insulin utilization across departments' },
      { id: 'thalassemia-therapy', name: 'Thalassemia Therapy Usage', description: 'Iron chelation, supplements, and transfusion utilization' }
    ]
  }
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('inventory');
  const [selectedReport, setSelectedReport] = useState('stock-levels');
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDepartment(localStorage.getItem('department'));
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in transit': return 'text-blue-600 bg-blue-100';
      case 'in progress': return 'text-purple-600 bg-purple-100';
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'minor issues': return 'text-yellow-600 bg-yellow-100';
      case 'fully compliant': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-pink-500',
      orange: 'from-orange-500 to-red-500',
      red: 'from-red-500 to-rose-500',
      indigo: 'from-indigo-500 to-blue-500',
      teal: 'from-teal-500 to-cyan-500'
    };
    return colors[color] || colors.blue;
  };

  const renderReportData = () => {
    // When Office Admin, route to custom data buckets
    if (department === 'Office Admin') {
      const oa = mockReports.officeAdmin;
      switch (selectedReport) {
        case 'oxygen-stock':
          return (
            <div className="space-y-4">
              {oa.oxygen.stockLevels.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-sm text-gray-600">Current</p><p className="text-xl font-bold">{item.currentStock}</p></div>
                    <div><p className="text-sm text-gray-600">Min</p><p className="text-xl font-bold">{item.minLevel}</p></div>
                    <div><p className="text-sm text-gray-600">Max</p><p className="text-xl font-bold">{item.maxLevel}</p></div>
                    <div><p className="text-sm text-gray-600">Location</p><p className="text-sm font-medium">{item.location}</p></div>
                  </div>
                </div>
              ))}
            </div>
          );
        case 'oxygen-near-expiry':
          return (
            <div className="space-y-4">
              {oa.oxygen.nearExpiry.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-sm text-gray-600">Batch</p><p className="font-medium">{item.batchNo}</p></div>
                    <div><p className="text-sm text-gray-600">Qty</p><p className="font-bold">{item.quantity}</p></div>
                    <div><p className="text-sm text-gray-600">Expiry</p><p className="font-semibold">{item.expiryDate}</p></div>
                    <div><p className="text-sm text-gray-600">Days Left</p><p className="font-bold text-orange-600">{item.daysToExpiry}</p></div>
                  </div>
                </div>
              ))}
            </div>
          );
        case 'purchasing-pos':
          return (
            <div className="space-y-4">
              {oa.purchasing.purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(po.status)}`}>{po.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-600">Supplier</span><div className="font-medium">{po.supplier}</div></div>
                    <div><span className="text-gray-600">Order Date</span><div className="font-medium">{po.orderDate}</div></div>
                    <div><span className="text-gray-600">ETA</span><div className="font-medium">{po.expectedDelivery}</div></div>
                    <div><span className="text-gray-600">Amount</span><div className="font-semibold">RM {po.totalAmount.toLocaleString()}</div></div>
                  </div>
                </div>
              ))}
            </div>
          );
        case 'purchasing-suppliers':
          return (
            <div className="space-y-4">
              {oa.purchasing.supplierPerformance.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{s.supplier}</h3>
                    <span className="px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700 font-medium">Rating {s.rating}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-gray-600">Orders</p><p className="font-medium">{s.totalOrders}</p></div>
                    <div><p className="text-gray-600">On-time</p><p className="font-medium">{s.onTimeDelivery}</p></div>
                    <div><p className="text-gray-600">Late</p><p className="font-medium">{s.lateDelivery}</p></div>
                    <div><p className="text-gray-600">Quality Issues</p><p className="font-medium">{s.qualityIssues}</p></div>
                    <div><p className="text-gray-600">Total Value</p><p className="font-semibold">RM {s.totalValue.toLocaleString()}</p></div>
                  </div>
                </div>
              ))}
            </div>
          );
        case 'payment-status':
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200"><p className="text-sm text-green-700">Total Due</p><p className="text-2xl font-bold text-green-900">RM {oa.payment.summary.totalDue.toLocaleString()}</p></div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-sm text-red-700">Overdue</p><p className="text-2xl font-bold text-red-900">RM {oa.payment.summary.overdue.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><p className="text-sm text-blue-700">Scheduled</p><p className="text-2xl font-bold text-blue-900">RM {oa.payment.summary.scheduled.toLocaleString()}</p></div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-sm text-amber-700">Pending</p><p className="text-2xl font-bold text-amber-900">RM {oa.payment.summary.pending.toLocaleString()}</p></div>
              </div>
              <div className="space-y-3">
                {oa.payment.payables.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{p.invoiceNo}</h4>
                        <p className="text-sm text-gray-600">{p.supplier}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-600">Amount</span><div className="font-semibold">RM {p.amount.toLocaleString()}</div></div>
                      <div><span className="text-gray-600">Due Date</span><div className="font-medium">{p.dueDate}</div></div>
                      <div><span className="text-gray-600">Age (days)</span><div className="font-medium">{p.ageDays}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'receiving-log':
          return (
            <div className="space-y-4">
              {oa.receiving.receipts.map((r) => (
                <div key={r.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{r.doNo} • {r.documentNo}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-gray-600">Supplier</p><p className="font-medium">{r.supplier}</p></div>
                    <div><p className="text-gray-600">Date</p><p className="font-medium">{r.date}</p></div>
                    <div><p className="text-gray-600">Items</p><p className="font-medium">{r.items}</p></div>
                    <div><p className="text-gray-600">Cylinders</p><p className="font-medium">{r.cylinders}</p></div>
                  </div>
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    }

    const categoryData = mockReports[selectedCategory];
    if (!categoryData) return null;

    switch (selectedReport) {
      case 'stock-levels':
  return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {categoryData.stockLevels?.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.sku} | Category: {item.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-xl font-bold text-gray-900">{item.currentStock.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Min Level</p>
                      <p className="text-xl font-bold text-gray-900">{item.minLevel.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Level</p>
                      <p className="text-xl font-bold text-gray-900">{item.maxLevel.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-sm font-medium text-gray-900">{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'near-expiry':
  return (
          <div className="space-y-4">
            {categoryData.nearExpiry?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                    <p className="text-sm text-gray-600">Batch: {item.batchNo} | SKU: {item.sku}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="text-xl font-bold text-gray-900">{item.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="text-lg font-semibold text-gray-900">{item.expiryDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days to Expiry</p>
                    <p className="text-xl font-bold text-orange-600">{item.daysToExpiry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>
        );

      case 'budget-utilization':
        return (
          <div className="space-y-4">
            {categoryData.budgetUtilization?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.category}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Utilization Rate</span>
                    <span className="font-semibold">{item.utilizationRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.utilizationRate >= 90 ? 'bg-red-500' : item.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${item.utilizationRate}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Allocated</p>
                      <p className="text-lg font-bold text-gray-900">RM {item.allocated.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Utilized</p>
                      <p className="text-lg font-bold text-gray-900">RM {item.utilized.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-lg font-bold text-gray-900">RM {item.remaining.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'antibiotic-usage':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 mb-6">
              <h4 className="text-lg font-semibold text-teal-900 mb-2">Antibiotic Stewardship Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-teal-700">Total Antibiotics Used</p>
                  <p className="text-2xl font-bold text-teal-900">4,460 units</p>
                </div>
                <div>
                  <p className="text-sm text-teal-700">Total Patients</p>
                  <p className="text-2xl font-bold text-teal-900">468</p>
                </div>
                <div>
                  <p className="text-sm text-teal-700">Total Cost</p>
                  <p className="text-2xl font-bold text-teal-900">RM 48,395</p>
                </div>
                <div>
                  <p className="text-sm text-teal-700">DDD Total</p>
                  <p className="text-2xl font-bold text-teal-900">3,760</p>
                </div>
              </div>
            </div>
            {categoryData.antibioticUsage?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.antibiotic}</h3>
                    <p className="text-sm text-gray-600">Department: {item.department} | Indication: {item.indication}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.resistance)}`}>
                    Resistance: {item.resistance}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Units Used</p>
                    <p className="text-xl font-bold text-gray-900">{item.totalUnits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patients Treated</p>
                    <p className="text-xl font-bold text-gray-900">{item.patients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Duration (days)</p>
                    <p className="text-xl font-bold text-gray-900">{item.averageDuration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">DDD</p>
                    <p className="text-xl font-bold text-gray-900">{item.ddd}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cost Per Unit</p>
                    <p className="text-lg font-semibold text-gray-900">RM {item.costPerUnit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-lg font-semibold text-teal-600">RM {item.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'insulin-usage':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Insulin Utilization Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-blue-700">Total Vials Used</p>
                  <p className="text-2xl font-bold text-blue-900">411</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-900">275</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Units</p>
                  <p className="text-2xl font-bold text-blue-900">645,900 IU</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Cost</p>
                  <p className="text-2xl font-bold text-blue-900">RM 65,085</p>
                </div>
              </div>
            </div>
            {categoryData.insulinUsage?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.insulin}</h3>
                    <p className="text-sm text-gray-600">Strength: {item.strength} | Department: {item.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Adherence</p>
                    <p className="text-2xl font-bold text-green-600">{item.adherence}%</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Indication: {item.indication}</p>
                  <p className="text-sm text-gray-600">Average Dose: {item.averageDose}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Vials</p>
                    <p className="text-xl font-bold text-gray-900">{item.totalVials}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-xl font-bold text-gray-900">{item.patients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Units</p>
                    <p className="text-xl font-bold text-gray-900">{item.totalUnits.toLocaleString()} IU</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost Per Vial</p>
                    <p className="text-lg font-semibold text-gray-900">RM {item.costPerVial.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700">Total Cost:</p>
                    <p className="text-2xl font-bold text-blue-600">RM {item.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'thalassemia-therapy':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-xl p-6 border border-rose-200 mb-6">
              <h4 className="text-lg font-semibold text-rose-900 mb-2">Thalassemia Therapy Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div>
                  <p className="text-sm text-rose-700">Total Patients</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.totalPatients}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-700">TDT (dependent)</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.transfusionDependent}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-700">NTDT</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.nonTransfusionDependent}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-700">Median Ferritin (µg/L)</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.medianFerritin}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-700">Ferritin &gt;1500 (pts)</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.overTargetFerritinPatients}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-700">On Chelation (%)</p>
                  <p className="text-2xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.chelationCoverage}%</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 rounded-lg p-4 border border-white/70">
                  <p className="text-xs text-rose-700">Complications: Cardiac</p>
                  <p className="text-xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.complications?.cardiac}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-white/70">
                  <p className="text-xs text-rose-700">Complications: Hepatic</p>
                  <p className="text-xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.complications?.hepatic}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-white/70">
                  <p className="text-xs text-rose-700">Complications: Endocrine</p>
                  <p className="text-xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.complications?.endocrine}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-white/70">
                  <p className="text-xs text-rose-700">Complications: Infection</p>
                  <p className="text-xl font-bold text-rose-900">{categoryData.thalassemiaSummary?.complications?.infection}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h5 className="text-base font-semibold text-gray-900 mb-4">Cohort Breakdown</h5>
                <div className="space-y-3">
                  {categoryData.thalassemiaCohorts?.map((c: any) => (
                    <div key={c.cohort} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.cohort}</p>
                        <p className="text-xs text-gray-600">Genotype: {c.genotype}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Median chelation start</p>
                        <p className="text-sm font-semibold text-gray-900">{c.chelationStartMedianAgeY} yrs</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800 font-semibold">{c.patients} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h5 className="text-base font-semibold text-gray-900 mb-4">Transfusion Schedule</h5>
                <div className="space-y-3">
                  {categoryData.transfusionSchedule?.map((t: any) => (
                    <div key={t.frequency} className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{t.frequency}</p>
                      <p className="text-xs text-gray-600">Avg units: {t.avgUnits}</p>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">{t.patients} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h5 className="text-base font-semibold text-gray-900 mb-4">Ferritin Trend (Median, µg/L)</h5>
                <div className="space-y-2">
                  {categoryData.ferritinTrends?.map((f: any) => (
                    <div key={f.month} className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{f.month}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{f.medianFerritin}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{f.pctAboveTarget}% &gt;1500</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h5 className="text-base font-semibold text-gray-900 mb-4">Adherence Distribution</h5>
                <div className="space-y-3">
                  {categoryData.adherenceBands?.map((a: any) => (
                    <div key={a.band} className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{a.band}</p>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-semibold">{a.patients} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {categoryData.thalassemiaUsage?.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.therapy}</h3>
                    <p className="text-sm text-gray-600">Form: {item.form}{item.strength && ` • ${item.strength}`} | Dept: {item.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Adherence</p>
                    <p className="text-2xl font-bold text-green-600">{item.adherence}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-xl font-bold text-gray-900">{item.patients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Dose</p>
                    <p className="text-xl font-bold text-gray-900">{item.avgDose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Units</p>
                    <p className="text-xl font-bold text-gray-900">{item.monthlyUnits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adverse Events</p>
                    <p className="text-xl font-bold text-gray-900">{item.adverseEvents}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monitoring</p>
                    <p className="text-sm font-medium text-gray-900">{item.monitoring}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Cost</p>
                    <p className="text-lg font-semibold text-rose-600">RM {item.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <IconFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Data</h3>
            <p className="text-gray-600">Select a specific report to view detailed data.</p>
          </div>
        );
    }
  };

  // Build category list: Office Admin sees custom 4-section reports
  const categoriesForUI = department === 'Office Admin' ? [
    { id: 'oxygen', title: 'Oxygen Reports', icon: <IconBox />, color: 'blue', reports: [
      { id: 'oxygen-stock', name: 'Oxygen Stock Levels', description: 'Cylinder stock vs min/max by type' },
      { id: 'oxygen-near-expiry', name: 'Near Expiry (Accessories)', description: 'Regulators and accessories nearing expiry' }
    ]},
    { id: 'purchasing', title: 'Purchasing Reports', icon: <IconReceipt />, color: 'purple', reports: [
      { id: 'purchasing-pos', name: 'Purchase Orders', description: 'Status of oxygen-related POs' },
      { id: 'purchasing-suppliers', name: 'Supplier Performance', description: 'Delivery timeliness and value' }
    ]},
    { id: 'payment', title: 'Payment Reports', icon: <IconMoney />, color: 'green', reports: [
      { id: 'payment-status', name: 'Payables Status & Aging', description: 'Outstanding, overdue and scheduled payments' }
    ]},
    { id: 'receiving', title: 'Receiving Reports', icon: <IconTruck />, color: 'orange', reports: [
      { id: 'receiving-log', name: 'Receiving Log', description: 'Recent deliveries and QA status' }
    ]}
  ] : reportCategories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <IconChart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{department === 'Office Admin' ? 'Office Admin Reports' : 'Pharmacy Logistics Reports'}</h1>
                <p className="text-gray-600 mt-1">{department === 'Office Admin' ? 'Oxygen • Purchasing • Payment • Receiving' : 'Comprehensive reporting and analytics dashboard'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <IconFilter className="h-5 w-5" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h2>
              <div className="space-y-2">
                {categoriesForUI.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedReport(category.reports[0].id);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getCategoryColor(category.color)} flex items-center justify-center`}>
                        <div className="h-4 w-4 text-white">{category.icon}</div>
                      </div>
                      <div>
                        <p className="font-medium">{category.title}</p>
                        <p className="text-sm text-gray-500">{category.reports.length} reports</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report List and Data */}
          <div className="lg:col-span-3 space-y-6">
            {/* Report List */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {categoriesForUI.find(c => c.id === selectedCategory)?.title} Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriesForUI
                  .find(c => c.id === selectedCategory)
                  ?.reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-4 rounded-lg text-left transition-colors ${
                        selectedReport === report.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <h4 className="font-medium mb-1">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </button>
                  ))}
          </div>
        </div>

            {/* Report Data */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoriesForUI
                    .find(c => c.id === selectedCategory)
                    ?.reports.find(r => r.id === selectedReport)?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <IconDownload className="h-4 w-4" />
                    Export PDF
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <IconDownload className="h-4 w-4" />
                    Export Excel
                  </button>
                </div>
        </div>
              {renderReportData()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}