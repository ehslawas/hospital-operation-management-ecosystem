import type { NonDrugItem, NonDrugCatalogStats } from '../types/NonDrugItem';
import { extendedNonDrugItems } from './nonDrugDataExtended';

// Comprehensive non-drug medical supplies database with 200 different items
export const nonDrugItems: NonDrugItem[] = [
  // Surgical Instruments
  {
    id: 'nd-001',
    itemCode: 'SI-001',
    itemName: 'Surgical Scissors Straight 5.5 inch',
    specification: 'Stainless Steel, Straight, 5.5 inch',
    sku: 'SCISS-STR-55',
    category: 'Surgical Instruments',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'APPL',
    unitPrice: 25.50,
    stockLevel: 50,
    minLevel: 10,
    maxLevel: 100,
    status: 'Active',
    createdAt: '2024-01-10',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-002',
    itemCode: 'SI-002',
    itemName: 'Surgical Forceps Straight 6 inch',
    specification: 'Stainless Steel, Straight, 6 inch',
    sku: 'FORC-STR-6',
    category: 'Surgical Instruments',
    supplier: 'BioPharm Solutions',
    budgetSource: 'CC/DP',
    unitPrice: 18.50,
    stockLevel: 75,
    minLevel: 15,
    maxLevel: 150,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-003',
    itemCode: 'SI-003',
    itemName: 'Hemostatic Forceps Curved 5 inch',
    specification: 'Stainless Steel, Curved, 5 inch',
    sku: 'HEMO-CURV-5',
    category: 'Surgical Instruments',
    supplier: 'Global Medical',
    budgetSource: 'LP',
    unitPrice: 22.00,
    stockLevel: 60,
    minLevel: 12,
    maxLevel: 120,
    status: 'Active',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-004',
    itemCode: 'SI-004',
    itemName: 'Surgical Scalpel Handle #3',
    specification: 'Stainless Steel, Handle #3',
    sku: 'SCAL-H3',
    category: 'Surgical Instruments',
    supplier: 'Prime Health Corp',
    budgetSource: 'CC/DP',
    unitPrice: 8.50,
    stockLevel: 100,
    minLevel: 20,
    maxLevel: 200,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-005',
    itemCode: 'SI-005',
    itemName: 'Surgical Needle Holder 6 inch',
    specification: 'Stainless Steel, 6 inch',
    sku: 'NEED-H6',
    category: 'Surgical Instruments',
    supplier: 'MediCare Solutions',
    budgetSource: 'APPL',
    unitPrice: 35.00,
    stockLevel: 40,
    minLevel: 8,
    maxLevel: 80,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Medical Consumables
  {
    id: 'nd-006',
    itemCode: 'MC-001',
    itemName: 'Surgical Gloves Nitrile Large',
    specification: 'Nitrile, Powder-free, Large, 100 pairs/box',
    sku: 'GLOV-NIT-L-100',
    category: 'Medical Consumables',
    supplier: 'PharmaCorp Malaysia',
    budgetSource: 'APPL',
    unitPrice: 45.00,
    stockLevel: 200,
    minLevel: 50,
    maxLevel: 500,
    status: 'Active',
    createdAt: '2024-01-12',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-007',
    itemCode: 'MC-002',
    itemName: 'Surgical Gloves Nitrile Medium',
    specification: 'Nitrile, Powder-free, Medium, 100 pairs/box',
    sku: 'GLOV-NIT-M-100',
    category: 'Medical Consumables',
    supplier: 'BioPharm Solutions',
    budgetSource: 'CC/DP',
    unitPrice: 45.00,
    stockLevel: 250,
    minLevel: 60,
    maxLevel: 600,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-008',
    itemCode: 'MC-003',
    itemName: 'Surgical Gloves Nitrile Small',
    specification: 'Nitrile, Powder-free, Small, 100 pairs/box',
    sku: 'GLOV-NIT-S-100',
    category: 'Medical Consumables',
    supplier: 'Global Medical',
    budgetSource: 'APPL',
    unitPrice: 45.00,
    stockLevel: 150,
    minLevel: 40,
    maxLevel: 400,
    status: 'Active',
    createdAt: '2024-01-18',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-009',
    itemCode: 'MC-004',
    itemName: 'Surgical Mask 3-Ply',
    specification: '3-Ply, Disposable, 50 pieces/box',
    sku: 'MASK-3PLY-50',
    category: 'Medical Consumables',
    supplier: 'Prime Health Corp',
    budgetSource: 'CC/DP',
    unitPrice: 12.50,
    stockLevel: 500,
    minLevel: 100,
    maxLevel: 1000,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-010',
    itemCode: 'MC-005',
    itemName: 'N95 Respirator Mask',
    specification: 'N95, Disposable, 20 pieces/box',
    sku: 'MASK-N95-20',
    category: 'Medical Consumables',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'APPL',
    unitPrice: 35.00,
    stockLevel: 300,
    minLevel: 60,
    maxLevel: 600,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Wound Care
  {
    id: 'nd-011',
    itemCode: 'WC-001',
    itemName: 'Gauze Pad 4x4 inch',
    specification: 'Sterile, 4x4 inch, 10 pieces/pack',
    sku: 'GAUZ-4X4-10',
    category: 'Wound Care',
    supplier: 'MediCare Solutions',
    budgetSource: 'APPL',
    unitPrice: 8.50,
    stockLevel: 400,
    minLevel: 80,
    maxLevel: 800,
    status: 'Active',
    createdAt: '2024-01-10',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-012',
    itemCode: 'WC-002',
    itemName: 'Gauze Pad 2x2 inch',
    specification: 'Sterile, 2x2 inch, 10 pieces/pack',
    sku: 'GAUZ-2X2-10',
    category: 'Wound Care',
    supplier: 'PharmaCorp Malaysia',
    budgetSource: 'CC/DP',
    unitPrice: 5.50,
    stockLevel: 600,
    minLevel: 120,
    maxLevel: 1200,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-013',
    itemCode: 'WC-003',
    itemName: 'Bandage Elastic 2 inch',
    specification: 'Elastic, 2 inch width, 5 yards',
    sku: 'BAND-ELAS-2IN',
    category: 'Wound Care',
    supplier: 'BioPharm Solutions',
    budgetSource: 'APPL',
    unitPrice: 3.50,
    stockLevel: 300,
    minLevel: 60,
    maxLevel: 600,
    status: 'Active',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-014',
    itemCode: 'WC-004',
    itemName: 'Bandage Elastic 4 inch',
    specification: 'Elastic, 4 inch width, 5 yards',
    sku: 'BAND-ELAS-4IN',
    category: 'Wound Care',
    supplier: 'Global Medical',
    budgetSource: 'CC/DP',
    unitPrice: 4.50,
    stockLevel: 250,
    minLevel: 50,
    maxLevel: 500,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-015',
    itemCode: 'WC-005',
    itemName: 'Adhesive Tape 1 inch',
    specification: 'Medical grade, 1 inch width, 10 yards',
    sku: 'TAPE-ADH-1IN',
    category: 'Wound Care',
    supplier: 'Prime Health Corp',
    budgetSource: 'APPL',
    unitPrice: 2.50,
    stockLevel: 500,
    minLevel: 100,
    maxLevel: 1000,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Laboratory Supplies
  {
    id: 'nd-016',
    itemCode: 'LS-001',
    itemName: 'Syringe 5ml',
    specification: 'Disposable, 5ml, 100 pieces/box',
    sku: 'SYR-5ML-100',
    category: 'Laboratory Supplies',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'APPL',
    unitPrice: 25.00,
    stockLevel: 200,
    minLevel: 50,
    maxLevel: 500,
    status: 'Active',
    createdAt: '2024-01-12',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-017',
    itemCode: 'LS-002',
    itemName: 'Syringe 10ml',
    specification: 'Disposable, 10ml, 100 pieces/box',
    sku: 'SYR-10ML-100',
    category: 'Laboratory Supplies',
    supplier: 'BioPharm Solutions',
    budgetSource: 'CC/DP',
    unitPrice: 30.00,
    stockLevel: 150,
    minLevel: 40,
    maxLevel: 400,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-018',
    itemCode: 'LS-003',
    itemName: 'Needle 21G',
    specification: 'Disposable, 21G, 100 pieces/box',
    sku: 'NEED-21G-100',
    category: 'Laboratory Supplies',
    supplier: 'Global Medical',
    budgetSource: 'APPL',
    unitPrice: 15.00,
    stockLevel: 300,
    minLevel: 60,
    maxLevel: 600,
    status: 'Active',
    createdAt: '2024-01-18',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-019',
    itemCode: 'LS-004',
    itemName: 'Needle 23G',
    specification: 'Disposable, 23G, 100 pieces/box',
    sku: 'NEED-23G-100',
    category: 'Laboratory Supplies',
    supplier: 'Prime Health Corp',
    budgetSource: 'CC/DP',
    unitPrice: 15.00,
    stockLevel: 250,
    minLevel: 50,
    maxLevel: 500,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-020',
    itemCode: 'LS-005',
    itemName: 'Blood Collection Tube 5ml',
    specification: 'Vacutainer, 5ml, 100 pieces/box',
    sku: 'BCT-5ML-100',
    category: 'Laboratory Supplies',
    supplier: 'MediCare Solutions',
    budgetSource: 'APPL',
    unitPrice: 45.00,
    stockLevel: 100,
    minLevel: 20,
    maxLevel: 200,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Diagnostic Equipment
  {
    id: 'nd-021',
    itemCode: 'DE-001',
    itemName: 'Digital Thermometer',
    specification: 'Digital, Oral/Rectal, Battery operated',
    sku: 'THERM-DIG-OR',
    category: 'Diagnostic Equipment',
    supplier: 'PharmaCorp Malaysia',
    budgetSource: 'CC/DP',
    unitPrice: 85.00,
    stockLevel: 50,
    minLevel: 10,
    maxLevel: 100,
    status: 'Active',
    createdAt: '2024-01-10',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-022',
    itemCode: 'DE-002',
    itemName: 'Blood Pressure Cuff Adult',
    specification: 'Adult size, Velcro closure',
    sku: 'BPC-ADULT',
    category: 'Diagnostic Equipment',
    supplier: 'BioPharm Solutions',
    budgetSource: 'APPL',
    unitPrice: 45.00,
    stockLevel: 75,
    minLevel: 15,
    maxLevel: 150,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-023',
    itemCode: 'DE-003',
    itemName: 'Stethoscope Single Head',
    specification: 'Single head, 27 inch tubing',
    sku: 'STETH-SINGLE',
    category: 'Diagnostic Equipment',
    supplier: 'Global Medical',
    budgetSource: 'CC/DP',
    unitPrice: 120.00,
    stockLevel: 40,
    minLevel: 8,
    maxLevel: 80,
    status: 'Active',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-024',
    itemCode: 'DE-004',
    itemName: 'Pulse Oximeter Finger',
    specification: 'Finger clip, Digital display',
    sku: 'PULSE-OX-FINGER',
    category: 'Diagnostic Equipment',
    supplier: 'Prime Health Corp',
    budgetSource: 'APPL',
    unitPrice: 95.00,
    stockLevel: 60,
    minLevel: 12,
    maxLevel: 120,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-025',
    itemCode: 'DE-005',
    itemName: 'Glucometer Kit',
    specification: 'Complete kit with strips and lancets',
    sku: 'GLUC-KIT-COMP',
    category: 'Diagnostic Equipment',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'CC/DP',
    unitPrice: 150.00,
    stockLevel: 30,
    minLevel: 6,
    maxLevel: 60,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Respiratory Equipment
  {
    id: 'nd-026',
    itemCode: 'RE-001',
    itemName: 'Oxygen Mask Simple',
    specification: 'Simple, Adult size, Disposable',
    sku: 'O2-MASK-SIMPLE',
    category: 'Respiratory Equipment',
    supplier: 'MediCare Solutions',
    budgetSource: 'APPL',
    unitPrice: 8.50,
    stockLevel: 200,
    minLevel: 40,
    maxLevel: 400,
    status: 'Active',
    createdAt: '2024-01-12',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-027',
    itemCode: 'RE-002',
    itemName: 'Oxygen Mask Non-Rebreathing',
    specification: 'Non-rebreathing, Adult size, Disposable',
    sku: 'O2-MASK-NRB',
    category: 'Respiratory Equipment',
    supplier: 'PharmaCorp Malaysia',
    budgetSource: 'CC/DP',
    unitPrice: 12.50,
    stockLevel: 150,
    minLevel: 30,
    maxLevel: 300,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-028',
    itemCode: 'RE-003',
    itemName: 'Nebulizer Kit',
    specification: 'Complete nebulizer kit with mask',
    sku: 'NEB-KIT-COMP',
    category: 'Respiratory Equipment',
    supplier: 'BioPharm Solutions',
    budgetSource: 'APPL',
    unitPrice: 85.00,
    stockLevel: 40,
    minLevel: 8,
    maxLevel: 80,
    status: 'Active',
    createdAt: '2024-01-18',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-029',
    itemCode: 'RE-004',
    itemName: 'Oxygen Tubing 7 feet',
    specification: '7 feet length, Disposable',
    sku: 'O2-TUBE-7FT',
    category: 'Respiratory Equipment',
    supplier: 'Global Medical',
    budgetSource: 'CC/DP',
    unitPrice: 3.50,
    stockLevel: 500,
    minLevel: 100,
    maxLevel: 1000,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-030',
    itemCode: 'RE-005',
    itemName: 'Venturi Mask 24%',
    specification: '24% oxygen concentration, Adult size',
    sku: 'VENT-MASK-24',
    category: 'Respiratory Equipment',
    supplier: 'Prime Health Corp',
    budgetSource: 'APPL',
    unitPrice: 15.00,
    stockLevel: 100,
    minLevel: 20,
    maxLevel: 200,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Orthopedic Supplies
  {
    id: 'nd-031',
    itemCode: 'OS-001',
    itemName: 'Plaster of Paris 4 inch',
    specification: '4 inch width, 5 yards roll',
    sku: 'POP-4IN-5YD',
    category: 'Orthopedic Supplies',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'APPL',
    unitPrice: 12.50,
    stockLevel: 100,
    minLevel: 20,
    maxLevel: 200,
    status: 'Active',
    createdAt: '2024-01-10',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-032',
    itemCode: 'OS-002',
    itemName: 'Fiberglass Cast 3 inch',
    specification: '3 inch width, 3 yards roll',
    sku: 'FGC-3IN-3YD',
    category: 'Orthopedic Supplies',
    supplier: 'BioPharm Solutions',
    budgetSource: 'CC/DP',
    unitPrice: 25.00,
    stockLevel: 80,
    minLevel: 16,
    maxLevel: 160,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-033',
    itemCode: 'OS-003',
    itemName: 'Elastic Bandage 3 inch',
    specification: '3 inch width, 5 yards',
    sku: 'ELAS-3IN-5YD',
    category: 'Orthopedic Supplies',
    supplier: 'Global Medical',
    budgetSource: 'APPL',
    unitPrice: 8.50,
    stockLevel: 150,
    minLevel: 30,
    maxLevel: 300,
    status: 'Active',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-034',
    itemCode: 'OS-004',
    itemName: 'Cervical Collar Soft',
    specification: 'Soft, Adjustable, Adult size',
    sku: 'CERV-SOFT-ADULT',
    category: 'Orthopedic Supplies',
    supplier: 'Prime Health Corp',
    budgetSource: 'CC/DP',
    unitPrice: 45.00,
    stockLevel: 30,
    minLevel: 6,
    maxLevel: 60,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-035',
    itemCode: 'OS-005',
    itemName: 'Knee Brace Hinged',
    specification: 'Hinged, Adjustable, Universal size',
    sku: 'KNEE-HINGED-UNI',
    category: 'Orthopedic Supplies',
    supplier: 'MediCare Solutions',
    budgetSource: 'APPL',
    unitPrice: 85.00,
    stockLevel: 25,
    minLevel: 5,
    maxLevel: 50,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Disposable Supplies
  {
    id: 'nd-036',
    itemCode: 'DS-001',
    itemName: 'Disposable Syringe 1ml',
    specification: '1ml, Luer lock, 100 pieces/box',
    sku: 'SYR-1ML-100',
    category: 'Disposable Supplies',
    supplier: 'PharmaCorp Malaysia',
    budgetSource: 'APPL',
    unitPrice: 15.00,
    stockLevel: 300,
    minLevel: 60,
    maxLevel: 600,
    status: 'Active',
    createdAt: '2024-01-12',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-037',
    itemCode: 'DS-002',
    itemName: 'Disposable Syringe 3ml',
    specification: '3ml, Luer lock, 100 pieces/box',
    sku: 'SYR-3ML-100',
    category: 'Disposable Supplies',
    supplier: 'BioPharm Solutions',
    budgetSource: 'CC/DP',
    unitPrice: 18.00,
    stockLevel: 250,
    minLevel: 50,
    maxLevel: 500,
    status: 'Active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-038',
    itemCode: 'DS-003',
    itemName: 'Disposable Syringe 20ml',
    specification: '20ml, Luer lock, 50 pieces/box',
    sku: 'SYR-20ML-50',
    category: 'Disposable Supplies',
    supplier: 'Global Medical',
    budgetSource: 'APPL',
    unitPrice: 35.00,
    stockLevel: 100,
    minLevel: 20,
    maxLevel: 200,
    status: 'Active',
    createdAt: '2024-01-18',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-039',
    itemCode: 'DS-004',
    itemName: 'Disposable Needle 18G',
    specification: '18G, 1.5 inch, 100 pieces/box',
    sku: 'NEED-18G-100',
    category: 'Disposable Supplies',
    supplier: 'Prime Health Corp',
    budgetSource: 'CC/DP',
    unitPrice: 12.00,
    stockLevel: 400,
    minLevel: 80,
    maxLevel: 800,
    status: 'Active',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01'
  },
  {
    id: 'nd-040',
    itemCode: 'DS-005',
    itemName: 'Disposable Needle 25G',
    specification: '25G, 1 inch, 100 pieces/box',
    sku: 'NEED-25G-100',
    category: 'Disposable Supplies',
    supplier: 'MediSupply Sdn Bhd',
    budgetSource: 'APPL',
    unitPrice: 10.00,
    stockLevel: 500,
    minLevel: 100,
    maxLevel: 1000,
    status: 'Active',
    createdAt: '2024-02-05',
    updatedAt: '2024-12-01'
  },

  // Continue with more categories to reach 200 total items...
  ...extendedNonDrugItems
];

export function getNonDrugStats(): NonDrugCatalogStats {
  const categories = [...new Set(nonDrugItems.map(item => item.category))];
  const suppliers = [...new Set(nonDrugItems.map(item => item.supplier))];
  const budgetSources = [...new Set(nonDrugItems.map(item => item.budgetSource))];
  
  return {
    totalItems: nonDrugItems.length,
    activeItems: nonDrugItems.filter(item => item.status === 'Active').length,
    inactiveItems: nonDrugItems.filter(item => item.status === 'Inactive').length,
    discontinuedItems: nonDrugItems.filter(item => item.status === 'Discontinued').length,
    categories,
    suppliers,
    budgetSources
  };
}

export function getNonDrugItems(filters?: Partial<NonDrugCatalogFilters>): NonDrugItem[] {
  let filteredItems = [...nonDrugItems];
  
  if (filters) {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }
    
    if (filters.supplier) {
      filteredItems = filteredItems.filter(item => item.supplier === filters.supplier);
    }
    
    if (filters.budgetSource) {
      filteredItems = filteredItems.filter(item => item.budgetSource === filters.budgetSource);
    }
    
    if (filters.status) {
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }
    
    if (filters.specification) {
      filteredItems = filteredItems.filter(item => item.specification.toLowerCase().includes(filters.specification.toLowerCase()));
    }
  }
  
  return filteredItems;
}
