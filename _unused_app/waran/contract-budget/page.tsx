'use client';

import { useState } from 'react';

export default function ContractBudgetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate consistent sample data to avoid hydration mismatch
  const generateProcurementData = () => {
    const departments = [
      'Pharmacy', 'Emergency Department', 'General Ward', 'Laboratory',
      'Central Sterile Services', 'Anesthesiology', 'Rehabilitation Services',
      'Nephro Drug', 'Nephro Non-Drug', 'Radiology', 'Wound Care',
      'Vaccine', 'Insulin', 'Hep C'
    ];

    const categories = ['DRUG', 'NON DRUG', 'VACCINE'];
    const statuses = ['Completed', 'In Progress', 'Cancelled'];
    const suppliers = [
      'MediSupply Sdn Bhd', 'HealthTech Equipment', 'VaxCorp Malaysia',
      'PharmaCorp', 'MediTech Solutions', 'BioMed Supplies', 'CarePlus Medical',
      'Advanced Healthcare', 'Medical Innovations', 'Global Health Supply'
    ];

    const drugItems = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Aspirin 100mg', 'Metformin 500mg',
      'Omeprazole 20mg', 'Amlodipine 5mg', 'Simvastatin 20mg', 'Losartan 50mg',
      'Metoprolol 50mg', 'Furosemide 40mg', 'Warfarin 5mg', 'Atorvastatin 20mg'
    ];

    const nonDrugItems = [
      'Surgical Gloves', 'Syringes 10ml', 'Bandages', 'Gauze Pads',
      'Medical Masks', 'Disposable Gowns', 'Catheters', 'IV Bags',
      'Surgical Instruments', 'Wound Dressings', 'Sterile Swabs', 'Thermometers'
    ];

    const vaccineItems = [
      'COVID-19 Vaccine', 'Hepatitis B Vaccine', 'Influenza Vaccine',
      'MMR Vaccine', 'Polio Vaccine', 'Tetanus Vaccine', 'BCG Vaccine',
      'HPV Vaccine', 'Chickenpox Vaccine', 'Pneumococcal Vaccine'
    ];

    const data: any[] = [];

    // Use deterministic data generation based on index
    for (let i = 1; i <= 100; i++) {
      const categoryIndex = (i - 1) % categories.length;
      const departmentIndex = (i - 1) % departments.length;
      const statusIndex = (i - 1) % statuses.length;
      const supplierIndex = (i - 1) % suppliers.length;

      const category = categories[categoryIndex];
      const department = departments[departmentIndex];
      const status = statuses[statusIndex];
      const supplier = suppliers[supplierIndex];

      // Create up to 5 items per LPO (deterministic)
      // Base dates for this row
      const rowDay = (i % 28) + 1;
      const rowMonth = (i % 12);
      const baseDate = new Date(2024, rowMonth, rowDay);
      const formattedDate = baseDate.toLocaleDateString('en-GB');

      const numItems = (i % 5) + 1; // 1..5
      const items = Array.from({ length: numItems }).map((_, idx) => {
        const pick = (i + idx) % 3;
        let name: string; let sku: string; let qty: number; let unitPrice: number; let cat: string;
        if (pick === 0) {
          name = drugItems[(i + idx) % drugItems.length];
          sku = `DRG-${String(i).padStart(4, '0')}-${1000 + ((i+idx) % 9000)}`;
          qty = 200 + ((i+idx) % 8) * 100;
          unitPrice = 0.6 + ((i+idx) % 5) * 0.5;
          cat = 'DRUG';
        } else if (pick === 1) {
          name = nonDrugItems[(i + idx) % nonDrugItems.length];
          sku = `NDG-${String(i).padStart(4, '0')}-${1000 + ((i+idx) % 9000)}`;
          qty = 50 + ((i+idx) % 7) * 50;
          unitPrice = 3 + ((i+idx) % 4) * 2;
          cat = 'NON DRUG';
      } else {
          name = vaccineItems[(i + idx) % vaccineItems.length];
          sku = `VAX-${String(i).padStart(4, '0')}-${1000 + ((i+idx) % 9000)}`;
          qty = 50 + ((i+idx) % 5) * 50;
          unitPrice = 16 + ((i+idx) % 4) * 8;
          cat = 'VACCINE';
        }
        // create partial receipts (1-3 chunks)
        const parts = ((i+idx) % 3) + 1;
        const per = Math.floor(qty / parts);
        const receipts = Array.from({ length: parts }).map((__, p) => ({
          date: new Date(2024, (rowMonth + p) % 12, rowDay + p).toLocaleDateString('en-GB'),
          qty: p === parts - 1 ? qty - per * (parts - 1) : per,
        }));
        return { name, sku, qty, unitPrice, category: cat, receipts };
      });

      const totalAmount = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const total = `RM ${Math.round(totalAmount).toLocaleString()}`;

      // Released date and payment date (some have payment)
      const lpoReleaseDate = new Date(2024, rowMonth, rowDay + 1).toLocaleDateString('en-GB');
      const paymentDate = (i % 2 === 0) ? new Date(2024, (rowMonth + 1) % 12, rowDay + 3).toLocaleDateString('en-GB') : '';

      data.push({
        date: formattedDate,
        po: `PO-2024-${String(i).padStart(3, '0')}`,
        lpo: `LPO-${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}`,
        ccNo: 'KKM-260/2024/F(U)',
        department,
        supplier,
        items,
        lpoReleaseDate,
        paymentDate,
        total,
        status
      });
    }

    return data;
  };

  const procurementData = generateProcurementData();
  const [openRow, setOpenRow] = useState<any | null>(null);

  const filteredData = procurementData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      item.supplier.toLowerCase().includes(searchLower) ||
      item.po.toLowerCase().includes(searchLower) ||
      item.lpo.toLowerCase().includes(searchLower) ||
      item.ccNo.toLowerCase().includes(searchLower) ||
      item.department.toLowerCase().includes(searchLower) ||
      item.total.toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower);

    const matchesDepartment = departmentFilter === 'All' || item.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DRUG':
        return 'bg-blue-100 text-blue-800';
      case 'NON DRUG':
        return 'bg-green-100 text-green-800';
      case 'VACCINE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'PO', 'LPO', 'Contract KKM', 'Department', 'Supplier', 'Total (RM)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.date, item.po, item.lpo, item.ccNo, item.department, item.supplier, item.total, item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'cost-centre-procurement-items.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Cost Centre (CC/DP)</h1>
        <p className="text-gray-600 mt-1">Manage departmental budgets and cost center allocations</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-600">Total Department Budget</p>
              <p className="text-2xl font-bold text-gray-900">RM 5,000,000</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center" suppressHydrationWarning>
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">14</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center" suppressHydrationWarning>
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-600">Total Utilized</p>
              <p className="text-2xl font-bold text-gray-900">RM 3,000,000</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center" suppressHydrationWarning>
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
              <p className="text-2xl font-bold text-gray-900">RM 2,000,000</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center" suppressHydrationWarning>
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Budgets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Pharmacy</p>
              <p className="font-bold text-gray-900 text-sm">RM 1.5M</p>
              <p className="text-xs text-blue-600 font-medium">30%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 450K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Emergency</p>
              <p className="font-bold text-gray-900 text-sm">RM 800K</p>
              <p className="text-xs text-green-600 font-medium">16%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 240K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">General Ward</p>
              <p className="font-bold text-gray-900 text-sm">RM 600K</p>
              <p className="text-xs text-purple-600 font-medium">12%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 180K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Laboratory</p>
              <p className="font-bold text-gray-900 text-sm">RM 300K</p>
              <p className="text-xs text-orange-600 font-medium">6%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 90K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">CSS</p>
              <p className="font-bold text-gray-900 text-sm">RM 400K</p>
              <p className="text-xs text-teal-600 font-medium">8%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 120K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Anesthesiology</p>
              <p className="font-bold text-gray-900 text-sm">RM 350K</p>
              <p className="text-xs text-indigo-600 font-medium">7%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 105K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Rehabilitation</p>
              <p className="font-bold text-gray-900 text-sm">RM 300K</p>
              <p className="text-xs text-pink-600 font-medium">6%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 90K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">ND</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Nephro Drug</p>
              <p className="font-bold text-gray-900 text-sm">RM 300K</p>
              <p className="text-xs text-cyan-600 font-medium">6%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 90K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">NN</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Nephro Non-Drug</p>
              <p className="font-bold text-gray-900 text-sm">RM 200K</p>
              <p className="text-xs text-sky-600 font-medium">4%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 60K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Radiology</p>
              <p className="font-bold text-gray-900 text-sm">RM 250K</p>
              <p className="text-xs text-amber-600 font-medium">5%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 75K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Wound Care</p>
              <p className="font-bold text-gray-900 text-sm">RM 200K</p>
              <p className="text-xs text-red-600 font-medium">4%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 60K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Vaccine</p>
              <p className="font-bold text-gray-900 text-sm">RM 100K</p>
              <p className="text-xs text-emerald-600 font-medium">2%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 30K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-violet-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Insulin</p>
              <p className="font-bold text-gray-900 text-sm">RM 80K</p>
              <p className="text-xs text-violet-600 font-medium">1.6%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 24K</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="h-8 w-8 bg-rose-500 rounded-lg flex items-center justify-center mx-auto mb-2" suppressHydrationWarning>
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Hep C</p>
              <p className="font-bold text-gray-900 text-sm">RM 70K</p>
              <p className="text-xs text-rose-600 font-medium">1.4%</p>
              <p className="text-xs text-gray-500 mt-1">Bal: RM 21K</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="p-6 border-b border-gray-200/50" suppressHydrationWarning>
          <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div suppressHydrationWarning>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Procurement Items</h2>
                <p className="text-sm text-gray-600 mt-1">Advanced tracking with real-time status monitoring</p>
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5" 
              suppressHydrationWarning
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
          
          {/* Search and Filters */}
          <div className="space-y-4 mb-6" suppressHydrationWarning>
            {/* Search Bar */}
            <div className="relative" suppressHydrationWarning>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" suppressHydrationWarning>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search anything: item, supplier, PO, LPO, CC No, department, SKU, quantity, amount..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
                suppressHydrationWarning
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Filter</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
                  suppressHydrationWarning
                >
                  <option value="All">All Categories</option>
                  <option value="DRUG">DRUG</option>
                  <option value="NON DRUG">NON DRUG</option>
                  <option value="VACCINE">VACCINE</option>
                </select>
              </div>
              <div suppressHydrationWarning>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department Filter</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => handleDepartmentFilter(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
                  suppressHydrationWarning
                >
                  <option value="All">All Departments</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Central Sterile Services">Central Sterile Services</option>
                  <option value="Vaccine">Vaccine</option>
                  <option value="Emergency Department">Emergency Department</option>
                  <option value="General Ward">General Ward</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Anesthesiology">Anesthesiology</option>
                  <option value="Rehabilitation Services">Rehabilitation Services</option>
                  <option value="Nephro Drug">Nephro Drug</option>
                  <option value="Nephro Non-Drug">Nephro Non-Drug</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Wound Care">Wound Care</option>
                  <option value="Insulin">Insulin</option>
                  <option value="Hep C">Hep C</option>
                </select>
              </div>
              <div suppressHydrationWarning>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
                  suppressHydrationWarning
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
              <span className="text-sm font-medium text-gray-600">
                Showing <span className="font-bold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredData.length)}</span> of <span className="font-bold text-gray-900">{filteredData.length}</span> items (Page {currentPage} of {totalPages})
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium" suppressHydrationWarning>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
          <div className="overflow-x-auto" suppressHydrationWarning>
            <table className="min-w-full table-fixed" suppressHydrationWarning>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100" suppressHydrationWarning>
              <tr suppressHydrationWarning>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'90px'}}>Date</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'120px'}}>PO</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'140px'}}>LPO</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'160px'}}>CC No</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'180px'}}>Department</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'190px'}}>Supplier</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{width:'120px'}}>Total (RM)</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wider" style={{width:'110px'}}>Status</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200/50" suppressHydrationWarning>
              {currentData.map((item, index) => (
                <tr key={index} className="group hover:bg-white/80 transition-all duration-200 hover:shadow-sm text-[13px]" suppressHydrationWarning>
                  <td className="px-3 py-2 font-medium text-gray-900 border-r border-gray-100 whitespace-nowrap">{item.date}</td>
                  <td className="px-3 py-2 font-medium text-blue-600 border-r border-gray-100 whitespace-nowrap cursor-pointer" onClick={()=>setOpenRow(item)}>{item.po}</td>
                  <td className="px-3 py-2 font-medium text-purple-600 border-r border-gray-100 whitespace-nowrap cursor-pointer" onClick={()=>setOpenRow(item)}>{item.lpo}</td>
                  <td className="px-3 py-2 font-mono text-gray-600 bg-gray-50/50 border-r border-gray-100 whitespace-normal break-words">{item.ccNo}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900 border-r border-gray-100 whitespace-normal">{item.department}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900 border-r border-gray-100 whitespace-normal">{item.supplier}</td>
                  <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-100 whitespace-nowrap">{item.total}</td>
                  <td className="px-3 py-2 whitespace-nowrap" suppressHydrationWarning>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Details Modal */}
        {openRow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-slate-900">{openRow.po} • {openRow.lpo}</div>
                  <div className="text-xs text-slate-600">Supplier: <span className="font-medium text-slate-800">{openRow.supplier}</span></div>
                  <div className="text-xs text-slate-600">Department: <span className="font-medium text-slate-800">{openRow.department}</span></div>
                  <div className="text-xs text-slate-600">PO Date: <span className="font-medium text-slate-800">{openRow.date}</span></div>
                  <div className="text-xs text-slate-600">LPO Released: <span className="font-medium text-slate-800">{openRow.lpoReleaseDate}</span></div>
                  <div className="text-xs text-slate-600">Payment Made: <span className="font-medium text-slate-800">{openRow.paymentDate || '-'}</span></div>
                </div>
                <button onClick={()=>setOpenRow(null)} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
              </div>
              <div className="p-5">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">SKU/PKU</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Amount</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {openRow.items.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-slate-800">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-[11px] text-slate-500">Receipts: {it.receipts.map((r: any) => `${r.date} (${r.qty})`).join(' • ')}</div>
                        </td>
                        <td className="px-3 py-2 text-xs"><span className={`px-2 py-1 rounded-full ${getCategoryBadge(it.category)}`}>{it.category}</span></td>
                        <td className="px-3 py-2 text-sm text-slate-600">{it.sku}</td>
                        <td className="px-3 py-2 text-sm text-right">{it.qty}</td>
                        <td className="px-3 py-2 text-sm text-right">RM {it.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm text-right font-semibold">RM {Math.round(it.qty*it.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                <button onClick={()=>setOpenRow(null)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50" suppressHydrationWarning>
            <div className="flex items-center justify-between" suppressHydrationWarning>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  suppressHydrationWarning
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  suppressHydrationWarning
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <span className="text-sm text-gray-700">Go to page:</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  suppressHydrationWarning
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <option key={page} value={page}>Page {page}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}