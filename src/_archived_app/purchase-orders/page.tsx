'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconPlus, IconSearch, IconFilter, IconEye, IconEdit, IconTrash, IconCheck, IconX, IconClock, IconTruck, IconMoney, IconCreditCard, IconReceipt, IconShoppingCart, IconFileSearch, IconFilePen } from '@/components/ui/Icons';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  supplierContact: string;
  createdDate: string;
  expectedDelivery: string;
  status: 'COMPLETED' | 'ACTIVE' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  paymentType: 'APPL' | 'CC' | 'DP';
  items: PurchaseOrderItem[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  department: string;
}

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: 'DRUG' | 'NON_DRUG' | 'VACCINE';
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  specifications?: string;
}

export default function PurchaseOrdersPage() {
  const [isClient, setIsClient] = useState(false);
  const [department, setDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [voteCodeFilter, setVoteCodeFilter] = useState('all');
  const [voteActivityFilter, setVoteActivityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPO, setNewPO] = useState({
    department: '',
    voteCode: '',
    voteActivity: '',
    items: [{
      id: 'new-0',
      itemName: '',
      quantity: 0,
      price: 0
    }]
  });
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [searchingItemIndex, setSearchingItemIndex] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState<'PO' | 'SQ'>('PO');

  // Mock item catalog data
  const itemCatalog = [
    { id: '1', name: 'Paracetamol 500mg', code: 'PAR-500', category: 'DRUG', unitPrice: 0.15 },
    { id: '2', name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'DRUG', unitPrice: 0.25 },
    { id: '3', name: 'Amoxicillin 250mg', code: 'AMX-250', category: 'DRUG', unitPrice: 0.35 },
    { id: '4', name: 'Surgical Gloves', code: 'SG-001', category: 'NON_DRUG', unitPrice: 2.50 },
    { id: '5', name: 'Syringe 5ml', code: 'SYR-5ML', category: 'NON_DRUG', unitPrice: 0.80 },
    { id: '6', name: 'Bandage 10cm', code: 'BAN-10', category: 'NON_DRUG', unitPrice: 1.20 },
    { id: '7', name: 'COVID-19 Vaccine', code: 'COV-VAC', category: 'VACCINE', unitPrice: 45.00 },
    { id: '8', name: 'Hepatitis B Vaccine', code: 'HEP-B', category: 'VACCINE', unitPrice: 35.00 },
    { id: '9', name: 'Aspirin 100mg', code: 'ASP-100', category: 'DRUG', unitPrice: 0.20 },
    { id: '10', name: 'Gauze Pad 10x10cm', code: 'GAU-10', category: 'NON_DRUG', unitPrice: 0.60 },
    { id: '11', name: 'Thermometer Digital', code: 'THM-DIG', category: 'NON_DRUG', unitPrice: 25.00 },
    { id: '12', name: 'Blood Pressure Cuff', code: 'BPC-001', category: 'NON_DRUG', unitPrice: 45.00 },
    { id: '13', name: 'Ceftriaxone 1g', code: 'CEF-1G', category: 'DRUG', unitPrice: 8.50 },
    { id: '14', name: 'Insulin Pen', code: 'INS-PEN', category: 'NON_DRUG', unitPrice: 12.00 },
    { id: '15', name: 'Flu Vaccine', code: 'FLU-VAC', category: 'VACCINE', unitPrice: 28.00 }
  ];

  // Filter items based on search term and activity code
  const getFilteredItems = () => {
    if (!itemSearchTerm.trim()) return [];
    
    const activityCode = newPO.voteActivity;
    let categoryFilter = '';
    
    if (activityCode === '27401') categoryFilter = 'DRUG';
    else if (activityCode === '27499') categoryFilter = 'NON_DRUG';
    else if (activityCode === '27404') categoryFilter = 'VACCINE';
    
    return itemCatalog.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                           item.code.toLowerCase().includes(itemSearchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).slice(0, 8); // Limit to 8 suggestions
  };

  // Handle item selection
  const handleItemSelect = (item: typeof itemCatalog[0], index: number) => {
    const newItems = [...newPO.items];
    newItems[index] = {
      ...newItems[index],
      itemName: item.name,
      price: item.unitPrice
    };
    setNewPO(prev => ({ ...prev, items: newItems }));
    setItemSearchTerm('');
    setShowItemSuggestions(false);
    setSearchingItemIndex(null);
  };

  // Handle PO details view
  const handleViewPODetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowDetailsModal(true);
  };

  // Handle print PO details
  const handlePrintPODetails = () => {
    if (!selectedPO) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order - ${selectedPO.poNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
            .header p { color: #64748b; margin: 5px 0; font-size: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-card h3 { margin: 0 0 10px 0; color: #475569; font-size: 14px; text-transform: uppercase; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .info-label { color: #64748b; }
            .info-value { font-weight: 600; color: #1e293b; }
            .status-badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .total-amount { color: #059669; font-weight: bold; }
            .items-section { margin-top: 30px; }
            .items-section h3 { color: #1e40af; margin-bottom: 15px; font-size: 18px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: bold; color: #475569; border: 1px solid #e2e8f0; }
            .items-table td { padding: 12px; border: 1px solid #e2e8f0; }
            .items-table tr:nth-child(even) { background: #f8fafc; }
            .category-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .category-drug { background: #dbeafe; color: #1e40af; }
            .category-non-drug { background: #dcfce7; color: #166534; }
            .category-vaccine { background: #f3e8ff; color: #7c3aed; }
            .total-price { color: #059669; font-weight: bold; }
            .print-date { text-align: right; color: #64748b; font-size: 12px; margin-top: 30px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Order Details</h1>
            <p>${selectedPO.poNumber} - ${selectedPO.department}</p>
            <p>Generated on ${new Date().toLocaleDateString('en-MY')} at ${new Date().toLocaleTimeString('en-MY')}</p>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>Order Information</h3>
              <div class="info-row">
                <span class="info-label">PO Number:</span>
                <span class="info-value">${selectedPO.poNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department:</span>
                <span class="info-value">${selectedPO.department}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Created Date:</span>
                <span class="info-value">${selectedPO.createdDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                  <span class="status-badge">${selectedPO.status}</span>
                </span>
              </div>
            </div>

            <div class="info-card">
              <h3>Financial Details</h3>
              <div class="info-row">
                <span class="info-label">Vote Code:</span>
                <span class="info-value">${selectedPO.paymentType === 'APPL' ? '990102' : '080702'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vote Activity:</span>
                <span class="info-value">${selectedPO.paymentType === 'APPL' ? (getOrderActivityCodes(selectedPO.items)[0] || '27499') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Type:</span>
                <span class="info-value">${selectedPO.paymentType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Amount:</span>
                <span class="info-value total-amount">RM ${selectedPO.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Remaining Balance:</span>
                <span class="info-value" style="color: #2563eb; font-weight: bold;">
                  ${(() => {
                    const balance = getPOBalance(selectedPO);
                    return balance !== null ? `RM ${(balance / 1000).toFixed(0)}K` : 'N/A';
                  })()}
                </span>
              </div>
            </div>

            <div class="info-card">
              <h3>Order Details</h3>
              <div class="info-row">
                <span class="info-label">Created By:</span>
                <span class="info-value">${selectedPO.createdBy}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Approved By:</span>
                <span class="info-value">${selectedPO.approvedBy || 'Pending'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value">${selectedPO.priority}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Items Count:</span>
                <span class="info-value">${selectedPO.items.length} items</span>
              </div>
            </div>
          </div>

          <div class="items-section">
            <h3>Items in this Purchase Order</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${selectedPO.items.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${item.itemName}</div>
                      <div style="font-size: 12px; color: #64748b;">Code: ${item.itemCode}</div>
                    </td>
                    <td>
                      <span class="category-badge category-${item.category.toLowerCase().replace('_', '-')}">
                        ${item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>${item.quantity} ${item.unit}</td>
                    <td>RM ${item.unitPrice.toFixed(2)}</td>
                    <td class="total-price">RM ${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${selectedPO.notes ? `
            <div style="margin-top: 30px;">
              <h3 style="color: #1e40af; margin-bottom: 10px;">Notes</h3>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #475569;">${selectedPO.notes}</p>
              </div>
            </div>
          ` : ''}

          <div class="print-date">
            Printed on ${new Date().toLocaleDateString('en-MY')} at ${new Date().toLocaleTimeString('en-MY')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Handle cancel PO
  const handleCancelPO = () => {
    if (!selectedPO || !cancelReason.trim()) return;
    
    // Update the PO status to CANCELLED
    setPurchaseOrders(prev => prev.map(po => 
      po.id === selectedPO.id 
        ? { ...po, status: 'CANCELLED' as const, notes: `${po.notes || ''}\n\nCANCELLED: ${cancelReason}`.trim() }
        : po
    ));
    
    // Close modals and reset
    setShowCancelModal(false);
    setShowDetailsModal(false);
    setCancelReason('');
    setSelectedPO(null);
    
    alert('Purchase Order has been cancelled successfully.');
  };

  // Mock financial overview data
  const financialOverview = {
    'Pharmacy': {
      '990102': {
        '27401': { balance: 112000, total: 410000, used: 299000 }, // Drug
        '27499': { balance: 52000, total: 150000, used: 99000 },  // Non-Drug
        '27404': { balance: 3000, total: 10000, used: 7000 }     // Vaccine
      },
      '080702': {
        '27401': { balance: 31000, total: 77000, used: 46000 },  // Contract Drug
        '27499': { balance: 28000, total: 70000, used: 42000 }   // Contract Non-Drug
      }
    },
    'Emergency': {
      '990102': {
        '27401': { balance: 18000, total: 40000, used: 22000 },  // ETU
        '27499': { balance: 20000, total: 45000, used: 25000 }   // GW
      },
      '080702': {
        '27401': { balance: 15000, total: 35000, used: 20000 },
        '27499': { balance: 12000, total: 30000, used: 18000 }
      }
    },
    'Laboratory': {
      '990102': {
        '27401': { balance: 25000, total: 60000, used: 35000 },
        '27499': { balance: 30000, total: 70000, used: 40000 }
      },
      '080702': {
        '27401': { balance: 20000, total: 50000, used: 30000 },
        '27499': { balance: 18000, total: 45000, used: 27000 }
      }
    },
    'Surgery': {
      '990102': {
        '27401': { balance: 35000, total: 80000, used: 45000 },
        '27499': { balance: 40000, total: 90000, used: 50000 }
      },
      '080702': {
        '27401': { balance: 30000, total: 70000, used: 40000 },
        '27499': { balance: 25000, total: 60000, used: 35000 }
      }
    },
    'Cardiology': {
      '990102': {
        '27401': { balance: 28000, total: 65000, used: 37000 },
        '27499': { balance: 32000, total: 75000, used: 43000 }
      },
      '080702': {
        '27401': { balance: 22000, total: 55000, used: 33000 },
        '27499': { balance: 20000, total: 50000, used: 30000 }
      }
    },
    'Oncology': {
      '990102': {
        '27401': { balance: 45000, total: 100000, used: 55000 },
        '27499': { balance: 50000, total: 110000, used: 60000 }
      },
      '080702': {
        '27401': { balance: 40000, total: 90000, used: 50000 },
        '27499': { balance: 35000, total: 80000, used: 45000 }
      }
    },
    'Pediatrics': {
      '990102': {
        '27401': { balance: 15000, total: 35000, used: 20000 },
        '27499': { balance: 18000, total: 40000, used: 22000 }
      },
      '080702': {
        '27401': { balance: 12000, total: 30000, used: 18000 },
        '27499': { balance: 10000, total: 25000, used: 15000 }
      }
    },
    'ICU': {
      '990102': {
        '27401': { balance: 60000, total: 140000, used: 80000 },
        '27499': { balance: 55000, total: 130000, used: 75000 }
      },
      '080702': {
        '27401': { balance: 50000, total: 120000, used: 70000 },
        '27499': { balance: 45000, total: 110000, used: 65000 }
      }
    }
  };

  // Function to get balance based on department, vote code, and vote activity
  const getDepartmentBalance = () => {
    if (!newPO.department || !newPO.voteCode || !newPO.voteActivity) {
      return null;
    }
    
    const deptData = financialOverview[newPO.department as keyof typeof financialOverview];
    if (!deptData) return null;
    
    const voteData = deptData[newPO.voteCode as keyof typeof deptData];
    if (!voteData) return null;
    
    const activityData = voteData[newPO.voteActivity as keyof typeof voteData];
    if (!activityData) return null;
    
    return activityData.balance;
  };

  // Function to get balance for existing PO
  const getPOBalance = (po: PurchaseOrder) => {
    const deptData = financialOverview[po.department as keyof typeof financialOverview];
    if (!deptData) return null;
    
    const voteCode = po.paymentType === 'APPL' ? '990102' : '080702';
    const voteData = deptData[voteCode as keyof typeof deptData];
    if (!voteData) return null;
    
    const activityCode = po.paymentType === 'APPL' ? (getOrderActivityCodes(po.items)[0] || '27499') : '27499';
    const activityData = voteData[activityCode as keyof typeof voteData];
    if (!activityData) return null;
    
    return activityData.balance;
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data for purchase orders - Generate 200 POs
  const generateMockPOs = (): PurchaseOrder[] => {
    const suppliers = [
      'MedSupply Solutions Sdn Bhd',
      'PharmaCorp Malaysia',
      'MedTech Supplies',
      'Healthcare Plus Sdn Bhd',
      'Medical Equipment Co',
      'PharmaDirect Malaysia',
      'MediCare Supplies',
      'BioMed Solutions',
      'HealthTech Malaysia',
      'MediCore Supplies'
    ];
    
    const departments = ['Pharmacy', 'Emergency', 'Laboratory', 'Surgery', 'Cardiology', 'Oncology', 'Pediatrics', 'ICU'];
    const statuses: ('COMPLETED' | 'ACTIVE' | 'CANCELLED')[] = ['COMPLETED', 'ACTIVE', 'CANCELLED'];
    const paymentTypes: ('APPL' | 'CC' | 'DP')[] = ['APPL', 'CC', 'DP'];
    const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const categories: ('DRUG' | 'NON_DRUG' | 'VACCINE')[] = ['DRUG', 'NON_DRUG', 'VACCINE'];
    
    const drugItems = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 250mg', 'Ciprofloxacin 500mg',
      'Metformin 500mg', 'Amlodipine 5mg', 'Atorvastatin 20mg', 'Omeprazole 20mg',
      'Losartan 50mg', 'Simvastatin 20mg', 'Aspirin 100mg', 'Warfarin 5mg'
    ];
    
    const nonDrugItems = [
      'Surgical Gloves', 'Gauze Pad 4x4', 'Syringe 5ml', 'Blood Collection Tube',
      'Surgical Mask', 'Alcohol Swabs', 'Bandage Roll', 'Cotton Balls',
      'Thermometer', 'Blood Pressure Cuff', 'Stethoscope', 'Surgical Scissors'
    ];
    
    const vaccineItems = [
      'COVID-19 Vaccine', 'Hepatitis B Vaccine', 'Influenza Vaccine', 'MMR Vaccine',
      'Tetanus Vaccine', 'Polio Vaccine', 'Chickenpox Vaccine', 'HPV Vaccine'
    ];
    
    const mockPOs: PurchaseOrder[] = [];
    
    for (let i = 1; i <= 200; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      // Ensure more APPL orders (60% APPL, 25% CC, 15% DP)
      // Make first 10 orders APPL for testing
      let paymentType: 'APPL' | 'CC' | 'DP';
      if (i <= 10) {
        paymentType = 'APPL';
      } else {
        const rand = Math.random();
        if (rand < 0.6) {
          paymentType = 'APPL';
        } else if (rand < 0.85) {
          paymentType = 'CC';
        } else {
          paymentType = 'DP';
        }
      }
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      
      // Generate 1-4 items per PO
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const items = [];
      
      for (let j = 1; j <= itemCount; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        let itemName = '';
        
        switch (category) {
          case 'DRUG':
            itemName = drugItems[Math.floor(Math.random() * drugItems.length)];
            break;
          case 'NON_DRUG':
            itemName = nonDrugItems[Math.floor(Math.random() * nonDrugItems.length)];
            break;
          case 'VACCINE':
            itemName = vaccineItems[Math.floor(Math.random() * vaccineItems.length)];
            break;
        }
        
        const quantity = Math.floor(Math.random() * 1000) + 10;
        const unitPrice = Math.random() * 50 + 0.1;
        const totalPrice = quantity * unitPrice;
        
        items.push({
          id: `${i}-${j}`,
          itemName,
          itemCode: `${category.substring(0, 3).toUpperCase()}-${i.toString().padStart(3, '0')}-${j}`,
          category,
          quantity,
          receivedQuantity: status === 'COMPLETED' ? quantity : Math.floor(Math.random() * quantity),
          unitPrice,
          totalPrice,
          unit: category === 'DRUG' ? 'tablets' : category === 'VACCINE' ? 'doses' : 'pieces'
        });
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const createdDate = new Date(2024, 0, Math.floor(Math.random() * 365) + 1).toISOString().split('T')[0];
      const expectedDelivery = new Date(2024, 0, Math.floor(Math.random() * 30) + 15).toISOString().split('T')[0];
      
      mockPOs.push({
        id: i.toString(),
        poNumber: `PO-2024-${i.toString().padStart(3, '0')}`,
        supplier,
        supplierContact: `+60 3-${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
        createdDate,
        expectedDelivery,
        status,
        totalAmount: Math.round(totalAmount * 100) / 100,
        currency: 'MYR',
        paymentType,
        priority,
        createdBy: `User ${i}`,
        approvedBy: status === 'COMPLETED' ? `Approver ${i}` : undefined,
        approvedDate: status === 'COMPLETED' ? new Date(2024, 0, Math.floor(Math.random() * 10) + 1).toISOString().split('T')[0] : undefined,
        department,
        items
      });
    }
    
    return mockPOs;
  };
  
  const purchaseOrders: PurchaseOrder[] = generateMockPOs();


  // Vote and Activity codes
  const VOTE_CODE = '990102';
  const getActivityCodeForItem = (category: string): string => {
    switch (category) {
      case 'DRUG': return '27401';
      case 'NON_DRUG': return '27499';
      case 'VACCINE': return '27404';
      default: return '27499';
    }
  };
  const getOrderActivityCodes = (items: PurchaseOrderItem[]): string[] => {
    const codes = new Set<string>();
    for (const item of items) {
      if (item.category && item.category !== 'UNKNOWN') {
        codes.add(getActivityCodeForItem(item.category));
      }
    }
    return Array.from(codes).sort();
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || po.department === departmentFilter;
    const matchesVoteCode = voteCodeFilter === 'all' || 
      (voteCodeFilter === '990102' && po.paymentType === 'APPL') ||
      (voteCodeFilter === '080702' && (po.paymentType === 'CC' || po.paymentType === 'DP'));
    const matchesVoteActivity = voteActivityFilter === 'all' || 
      (po.paymentType === 'APPL' && getOrderActivityCodes(po.items).includes(voteActivityFilter));
    return matchesSearch && matchesStatus && matchesDepartment && matchesVoteCode && matchesVoteActivity;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, voteCodeFilter, voteActivityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <IconCheck className="h-4 w-4" />;
      case 'ACTIVE': return <IconClock className="h-4 w-4" />;
      case 'CANCELLED': return <IconX className="h-4 w-4" />;
      default: return <IconClock className="h-4 w-4" />;
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'APPL': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CC': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DP': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'APPL': return <IconMoney className="h-4 w-4" />;
      case 'CC': return <IconCreditCard className="h-4 w-4" />;
      case 'DP': return <IconReceipt className="h-4 w-4" />;
      default: return <IconMoney className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-600';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  useEffect(() => {
    setIsClient(true);
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Breadcrumbs & Header */}
        <div className="space-y-6">
          <nav className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            <Link href="/financial" className="hover:text-blue-600 transition-colors">Financial</Link>
            <span>/</span>
            <Link href="/procurement" className="hover:text-blue-600 transition-colors">Procurement</Link>
            <span>/</span>
            <span className="text-slate-900">Purchase Orders</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 ring-4 ring-blue-50">
                <IconShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Purchase Orders
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Manage purchase orders for drugs and non-drug items with real-time tracking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 group">
                <IconFileSearch className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                Create SQ
              </button>
              <button className="px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 group">
                <IconFilePen className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                Manual PO
              </button>
              <button 
                onClick={department === 'Office Admin' ? undefined : () => setShowCreateModal(true)}
                className="px-6 py-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                <IconPlus className="h-5 w-5" />
                New PO
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total POs */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-blue-100 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-full">Yearly</span>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <IconReceipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">{purchaseOrders.length}</div>
                <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Total Purchase Orders</div>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-emerald-100 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">Accumulated</span>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <IconMoney className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  RM {(purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0) / 1000000).toFixed(2)}M
                </div>
                <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Total Order Value</div>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-100 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                <div className="w-1 h-1 bg-orange-600 rounded-full animate-pulse"></div>
                Action required
              </span>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <IconClock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  {purchaseOrders.filter(po => po.status === 'ACTIVE').length}
                </div>
                <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Pending Approvals</div>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-purple-100 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-full">Fully received</span>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <IconCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  {purchaseOrders.filter(po => po.status === 'COMPLETED').length}
                </div>
                <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Completed Orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-8 pt-6">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab('PO')}
                className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'PO' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Purchase Orders
                {activeTab === 'PO' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('SQ')}
                className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'SQ' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Stock Quotations
                {activeTab === 'SQ' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-8">
            <div className="bg-slate-50/50 rounded-[2rem] p-4 flex flex-wrap items-center gap-4 border border-slate-100">
              {/* Search */}
              <div className="flex-1 min-w-[300px] relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by PO number, supplier, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Selects */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none cursor-pointer min-w-[140px]"
              >
                <option value="all">Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="ACTIVE">Active</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select 
                value={voteCodeFilter}
                onChange={(e) => setVoteCodeFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none cursor-pointer min-w-[140px]"
              >
                <option value="all">Vote Codes</option>
                <option value="990102">990102</option>
                <option value="080702">080702</option>
              </select>

              <select 
                value={voteActivityFilter}
                onChange={(e) => setVoteActivityFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none cursor-pointer min-w-[140px]"
              >
                <option value="all">Vote Activities</option>
                <option value="27401">27401</option>
                <option value="27499">27499</option>
                <option value="27404">27404</option>
              </select>

              <select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none cursor-pointer min-w-[140px]"
              >
                <option value="all">Departments</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Emergency">Emergency</option>
                <option value="Laboratory">Laboratory</option>
              </select>

              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVoteCodeFilter('all');
                  setVoteActivityFilter('all');
                  setDepartmentFilter('all');
                }}
                className="px-6 py-3 text-sm font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
            </div>

            {/* Table Area */}
            <div className="mt-8">
              {activeTab === 'PO' ? (
                <>
                  <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PO Number</th>
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</th>
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vote Code</th>
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity</th>
                          <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total (RM)</th>
                          <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {paginatedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="text-sm font-bold text-slate-600">{order.createdDate}</div>
                            </td>
                            <td className="px-6 py-5">
                              <button
                                onClick={() => handleViewPODetails(order)}
                                className="text-sm font-black text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {order.poNumber}
                              </button>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm font-bold text-slate-900">{order.department}</div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                                {order.paymentType === 'APPL' ? '990102' : '080702'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {order.paymentType === 'APPL' ? (
                                <span className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600">
                                  {(() => {
                                    const activityCodes = getOrderActivityCodes(order.items);
                                    return activityCodes.length > 0 ? activityCodes[0] : '27499';
                                  })()}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="text-sm font-black text-slate-900">
                                {order.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex justify-center">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-400">
                        Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(endIndex, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <IconArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <IconArrowLeft className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <IconFileSearch className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Stock Quotations</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">
                    This module is currently being integrated. Please check back later for updates on stock quotation management.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Create PO Modal */}
        {showCreateModal && department !== 'Office Admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Create New Purchase Order</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <IconX className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                    <select
                      value={newPO.department}
                      onChange={(e) => setNewPO(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
                    >
                      <option value="">Select Department</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Surgery">Surgery</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="ICU">ICU</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Vote Code</label>
                    <select
                      value={newPO.voteCode}
                      onChange={(e) => setNewPO(prev => ({ ...prev, voteCode: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
                    >
                      <option value="">Select Vote Code</option>
                      <option value="990102">990102 (APPL)</option>
                      <option value="080702">080702 (CC/DP)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Vote Activity</label>
                    <select
                      value={newPO.voteActivity}
                      onChange={(e) => setNewPO(prev => ({ ...prev, voteActivity: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
                    >
                      <option value="">Select Vote Activity</option>
                      <option value="27401">27401 (Drug)</option>
                      <option value="27499">27499 (Non-Drug)</option>
                      <option value="27404">27404 (Vaccine)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Balance Department Budget</label>
                    <div className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-800 text-sm">
                      {getDepartmentBalance() !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold">
                            RM {(getDepartmentBalance()! / 1000).toFixed(0)}K
                          </span>
                          <span className="text-slate-500 text-xs">
                            ({newPO.department} {newPO.voteCode} {newPO.voteActivity})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          Select Department, Vote Code, and Vote Activity
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Items (Maximum 5)</h3>
                  <div className="space-y-4">
                    {newPO.items.map((item, index) => (
                      <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-700">Item {index + 1}</h4>
                          {index > 0 && (
                            <button
                              onClick={() => {
                                const newItems = newPO.items.filter((_, i) => i !== index);
                                setNewPO(prev => ({ ...prev, items: newItems }));
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="relative">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Item Name</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={searchingItemIndex === index ? itemSearchTerm : item.itemName}
                                onChange={(e) => {
                                  if (searchingItemIndex === index) {
                                    setItemSearchTerm(e.target.value);
                                    setShowItemSuggestions(e.target.value.length > 0);
                                  } else {
                                    const newItems = [...newPO.items];
                                    newItems[index].itemName = e.target.value;
                                    setNewPO(prev => ({ ...prev, items: newItems }));
                                  }
                                }}
                                onFocus={() => {
                                  setSearchingItemIndex(index);
                                  setItemSearchTerm(item.itemName);
                                  setShowItemSuggestions(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setShowItemSuggestions(false);
                                    setSearchingItemIndex(null);
                                  }, 200);
                                }}
                                placeholder="Search for item..."
                                className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 text-sm"
                              />
                              <IconSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                            
                            {/* Search Suggestions Dropdown */}
                            {showItemSuggestions && searchingItemIndex === index && getFilteredItems().length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {getFilteredItems().map((suggestedItem) => (
                                  <div
                                    key={suggestedItem.id}
                                    onClick={() => handleItemSelect(suggestedItem, index)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium text-slate-900 text-sm">
                                          {suggestedItem.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          Code: {suggestedItem.code}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-semibold text-green-600">
                                          RM {suggestedItem.unitPrice.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-slate-400 capitalize">
                                          {suggestedItem.category.toLowerCase().replace('_', ' ')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...newPO.items];
                                newItems[index].quantity = parseInt(e.target.value) || 0;
                                setNewPO(prev => ({ ...prev, items: newItems }));
                              }}
                              placeholder="0"
                              min="0"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Price (RM)</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const newItems = [...newPO.items];
                                newItems[index].price = parseFloat(e.target.value) || 0;
                                setNewPO(prev => ({ ...prev, items: newItems }));
                              }}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Sub Total (RM)</label>
                            <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm font-semibold">
                              {(item.quantity * item.price).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {newPO.items.length < 5 && (
                      <button
                        onClick={() => {
                          const newItem = {
                            id: `new-${Date.now()}`,
                            itemName: '',
                            quantity: 0,
                            price: 0
                          };
                          setNewPO(prev => ({ ...prev, items: [...prev.items, newItem] }));
                        }}
                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <IconPlus className="h-5 w-5" />
                        Add Item
                      </button>
                    )}
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      RM {newPO.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setItemSearchTerm('');
                      setShowItemSuggestions(false);
                      setSearchingItemIndex(null);
                    }}
                    className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle form submission here
                      alert('Purchase Order created successfully!');
                      setShowCreateModal(false);
                      // Reset form
                      setNewPO({
                        department: '',
                        voteCode: '',
                        voteActivity: '',
                        items: [{
                          id: 'new-0',
                          itemName: '',
                          quantity: 0,
                          price: 0
                        }]
                      });
                      setItemSearchTerm('');
                      setShowItemSuggestions(false);
                      setSearchingItemIndex(null);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PO Details Modal */}
        {showDetailsModal && selectedPO && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Purchase Order Details</h2>
                    <p className="text-slate-600 mt-1">{selectedPO.poNumber} - {selectedPO.department}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedPO.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                      >
                        <IconX className="h-4 w-4" />
                        Cancel PO
                      </button>
                    )}
                    <button
                      onClick={handlePrintPODetails}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                    >
                      <IconX className="h-6 w-6 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {/* PO Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-2">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">PO Number:</span>
                        <span className="font-medium">{selectedPO.poNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Department:</span>
                        <span className="font-medium">{selectedPO.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Created Date:</span>
                        <span className="font-medium">{selectedPO.createdDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(selectedPO.status)}`}>
                          {getStatusIcon(selectedPO.status)}
                          {selectedPO.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-2">Financial Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vote Code:</span>
                        <span className="font-medium">{selectedPO.paymentType === 'APPL' ? '990102' : '080702'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vote Activity:</span>
                        <span className="font-medium">
                          {selectedPO.paymentType === 'APPL' ? getOrderActivityCodes(selectedPO.items)[0] || '27499' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Payment Type:</span>
                        <span className="font-medium">{selectedPO.paymentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Amount:</span>
                        <span className="font-bold text-green-600">
                          RM {selectedPO.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Remaining Balance:</span>
                        <span className="font-bold text-blue-600">
                          {getPOBalance(selectedPO) !== null ? 
                            `RM ${(getPOBalance(selectedPO)! / 1000).toFixed(0)}K` : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-2">Order Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Created By:</span>
                        <span className="font-medium">{selectedPO.createdBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Approved By:</span>
                        <span className="font-medium">{selectedPO.approvedBy || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Priority:</span>
                        <span className="font-medium">{selectedPO.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Items Count:</span>
                        <span className="font-medium">{selectedPO.items.length} items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Items in this Purchase Order</h3>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item Name</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Category</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Unit Price</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPO.items.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-slate-900">{item.itemName}</div>
                                <div className="text-sm text-slate-500">Code: {item.itemCode}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                                item.category === 'DRUG' ? 'bg-blue-100 text-blue-700' :
                                item.category === 'NON_DRUG' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {item.category.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">
                              RM {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-green-600">
                              RM {(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedPO.notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Notes</h3>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-700">{selectedPO.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2.5 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel PO Confirmation Modal */}
        {showCancelModal && selectedPO && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <IconX className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Cancel Purchase Order</h2>
                    <p className="text-slate-600 text-sm">Are you sure you want to cancel this PO?</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-slate-600 mb-1">Purchase Order</div>
                    <div className="font-semibold text-slate-900">{selectedPO.poNumber}</div>
                    <div className="text-sm text-slate-600">{selectedPO.department}</div>
                    <div className="text-sm text-slate-600">Total: RM {selectedPO.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Reason for Cancellation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling this purchase order..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white text-slate-800 text-sm resize-none"
                    rows={4}
                    required
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    This reason will be recorded in the PO notes.
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
                  >
                    Keep PO
                  </button>
                  <button
                    onClick={handleCancelPO}
                    disabled={!cancelReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    Cancel Purchase Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}


