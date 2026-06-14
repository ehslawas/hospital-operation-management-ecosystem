'use client';

import { useState } from 'react';

export default function APPLBudgetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate consistent sample data to avoid hydration mismatch
  const generateProcurementData = () => {
    const categories = ['DRUG', 'NON DRUG', 'VACCINE'];
    const statuses = ['Completed', 'In Progress', 'Cancel'];
    const suppliers = [
      'MediSupply Sdn Bhd', 'HealthTech Equipment', 'VaxCorp Malaysia',
      'PharmaCorp', 'MediTech Solutions', 'BioMed Supplies', 'CarePlus Medical',
      'Advanced Healthcare', 'Medical Innovations', 'Global Health Supply'
    ];
    
    const drugItems = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Aspirin 100mg', 'Metformin 500mg',
      'Omeprazole 20mg', 'Amlodipine 5mg', 'Simvastatin 20mg', 'Losartan 50mg',
      'Metoprolol 50mg', 'Furosemide 40mg', 'Warfarin 5mg', 'Atorvastatin 20mg',
      'Ciprofloxacin 500mg', 'Amoxicillin 500mg', 'Doxycycline 100mg', 'Ceftriaxone 1g'
    ];
    
    const nonDrugItems = [
      'Surgical Gloves', 'Syringes 10ml', 'Bandages', 'Gauze Pads',
      'Medical Masks', 'Disposable Gowns', 'Catheters', 'IV Bags',
      'Surgical Instruments', 'Wound Dressings', 'Sterile Swabs', 'Thermometers',
      'Blood Pressure Cuffs', 'Stethoscopes', 'Defibrillators', 'Ventilators'
    ];
    
    const vaccineItems = [
      'COVID-19 Vaccine', 'Hepatitis B Vaccine', 'Influenza Vaccine',
      'MMR Vaccine', 'Polio Vaccine', 'Tetanus Vaccine', 'BCG Vaccine',
      'HPV Vaccine', 'Chickenpox Vaccine', 'Pneumococcal Vaccine',
      'Rabies Vaccine', 'Yellow Fever Vaccine', 'Typhoid Vaccine'
    ];
    
    const data = [];
    
    // Use deterministic data generation based on index
    for (let i = 1; i <= 100; i++) {
      const categoryIndex = (i - 1) % categories.length;
      const statusIndex = (i - 1) % statuses.length;
      const supplierIndex = (i - 1) % suppliers.length;
      
      const category = categories[categoryIndex];
      const status = statuses[statusIndex];
      const supplier = suppliers[supplierIndex];
      
      let item, sku, quantity, amount;
      
      if (category === 'DRUG') {
        const itemIndex = (i - 1) % drugItems.length;
        item = drugItems[itemIndex];
        sku = `DRG-${String(i).padStart(4, '0')}-${1000 + (i % 9000)}`;
        quantity = 1000 + (i * 500);
        amount = `RM ${(0.1 + (i * 0.5)).toFixed(2)}`;
      } else if (category === 'NON DRUG') {
        const itemIndex = (i - 1) % nonDrugItems.length;
        item = nonDrugItems[itemIndex];
        sku = `NDG-${String(i).padStart(4, '0')}-${1000 + (i % 9000)}`;
        quantity = 100 + (i * 100);
        amount = `RM ${(1 + (i * 1)).toFixed(2)}`;
      } else {
        const itemIndex = (i - 1) % vaccineItems.length;
        item = vaccineItems[itemIndex];
        sku = `VAX-${String(i).padStart(4, '0')}-${1000 + (i % 9000)}`;
        quantity = 100 + (i * 50);
        amount = `RM ${(10 + (i * 2)).toFixed(2)}`;
      }
      
      const totalAmount = parseFloat(amount.replace('RM ', '')) * quantity;
      const total = `RM ${totalAmount.toLocaleString()}`;
      
      // Use deterministic dates
      const day = (i % 28) + 1;
      const month = (i % 12);
      const date = new Date(2024, month, day);
      const formattedDate = date.toLocaleDateString('en-GB');
      
      data.push({
        date: formattedDate,
        po: `PO-2024-${String(i).padStart(3, '0')}`,
        lpo: `LPO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`,
        sku,
        item,
        category,
        quantity: quantity.toLocaleString(),
        amount,
        total,
        status,
        supplier
      });
    }
    
    return data;
  };

  const procurementData = generateProcurementData();
  const [openRow, setOpenRow] = useState<any | null>(null);

  const filteredData = procurementData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      item.item.toLowerCase().includes(searchLower) ||
      item.po.toLowerCase().includes(searchLower) ||
      item.lpo.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.quantity.includes(searchTerm) ||
      item.amount.includes(searchTerm) ||
      item.total.includes(searchTerm);
    
    const categoryMatch = categoryFilter === 'All' || item.category === categoryFilter;
    const statusMatch = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && categoryMatch && statusMatch;
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
      case 'Cancel':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'PO', 'LPO', 'SKU/PKU', 'Item', 'Category', 'Quantity', 'Amount', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.date,
        item.po,
        item.lpo,
        item.sku,
        item.item,
        item.category,
        item.quantity,
        item.amount,
        item.total,
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'appl-procurement-items.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" suppressHydrationWarning>
      <div className=" px-6 py-8" suppressHydrationWarning>
        {/* Modern Header */}
        <div className="mb-8" suppressHydrationWarning>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20" suppressHydrationWarning>
            <div className="flex items-center gap-4 mb-4" suppressHydrationWarning>
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div suppressHydrationWarning>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Annual Procurement Plan
                </h1>
                <p className="text-lg text-gray-600 mt-2">Comprehensive budget management and procurement tracking</p>
                <div className="flex items-center gap-2 mt-3" suppressHydrationWarning>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" suppressHydrationWarning></div>
                  <span className="text-sm text-gray-500 font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" suppressHydrationWarning>
          <div className="group bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" suppressHydrationWarning>
            <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" suppressHydrationWarning>
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-right" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Budget</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">RM 1.5M</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-3" suppressHydrationWarning>
              <div className="flex justify-between text-sm font-medium text-blue-800" suppressHydrationWarning>
                <span>Allocated</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" suppressHydrationWarning>
            <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" suppressHydrationWarning>
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Utilized</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">RM 900K</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl p-3" suppressHydrationWarning>
              <div className="flex justify-between text-sm font-medium text-green-800" suppressHydrationWarning>
                <span>Utilization</span>
                <span>60%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2" suppressHydrationWarning>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '60%'}} suppressHydrationWarning></div>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" suppressHydrationWarning>
            <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
              <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" suppressHydrationWarning>
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right" suppressHydrationWarning>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Available</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-800 bg-clip-text text-transparent">RM 600K</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-violet-200 rounded-xl p-3" suppressHydrationWarning>
              <div className="flex justify-between text-sm font-medium text-purple-800" suppressHydrationWarning>
                <span>Remaining</span>
                <span>40%</span>
              </div>
            </div>
          </div>
        </div>
      
        {/* Modern Categories & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" suppressHydrationWarning>
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20" suppressHydrationWarning>
            <div className="flex items-center gap-3 mb-6" suppressHydrationWarning>
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">APPL Categories</h2>
            </div>
            <div className="space-y-4" suppressHydrationWarning>
              <div className="group bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-200/50 hover:shadow-lg transition-all duration-300" suppressHydrationWarning>
                <div className="flex items-center justify-between" suppressHydrationWarning>
                  <div suppressHydrationWarning>
                    <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md" suppressHydrationWarning>
                        <span className="text-white font-bold text-sm">D</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">DRUG</p>
                    </div>
                    <p className="text-sm text-blue-700 font-medium">Critical medications and treatments</p>
                  </div>
                  <div className="text-right" suppressHydrationWarning>
                    <p className="font-bold text-gray-900 text-xl">RM 800K</p>
                    <p className="text-sm text-blue-600 font-semibold">53%</p>
                    <p className="text-xs text-gray-500 mt-1">Balance: RM 220K</p>
                  </div>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 mt-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '73%'}} suppressHydrationWarning></div>
                </div>
              </div>
              
              <div className="group bg-gradient-to-r from-green-500/10 to-emerald-600/10 backdrop-blur-sm rounded-2xl p-5 border border-green-200/50 hover:shadow-lg transition-all duration-300" suppressHydrationWarning>
                <div className="flex items-center justify-between" suppressHydrationWarning>
                  <div suppressHydrationWarning>
                    <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md" suppressHydrationWarning>
                        <span className="text-white font-bold text-sm">N</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">NON DRUG</p>
                    </div>
                    <p className="text-sm text-green-700 font-medium">Disposables and consumables</p>
                  </div>
                  <div className="text-right" suppressHydrationWarning>
                    <p className="font-bold text-gray-900 text-xl">RM 400K</p>
                    <p className="text-sm text-green-600 font-semibold">27%</p>
                    <p className="text-xs text-gray-500 mt-1">Balance: RM 110K</p>
                  </div>
                </div>
                <div className="w-full bg-green-100 rounded-full h-2 mt-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '73%'}} suppressHydrationWarning></div>
                </div>
              </div>
              
              <div className="group bg-gradient-to-r from-purple-500/10 to-violet-600/10 backdrop-blur-sm rounded-2xl p-5 border border-purple-200/50 hover:shadow-lg transition-all duration-300" suppressHydrationWarning>
                <div className="flex items-center justify-between" suppressHydrationWarning>
                  <div suppressHydrationWarning>
                    <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md" suppressHydrationWarning>
                        <span className="text-white font-bold text-sm">V</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">VACCINE</p>
                    </div>
                    <p className="text-sm text-purple-700 font-medium">Medical devices and tools</p>
                  </div>
                  <div className="text-right" suppressHydrationWarning>
                    <p className="font-bold text-gray-900 text-xl">RM 300K</p>
                    <p className="text-sm text-purple-600 font-semibold">20%</p>
                    <p className="text-xs text-gray-500 mt-1">Balance: RM 80K</p>
                  </div>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-2 mt-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full" style={{width: '73%'}} suppressHydrationWarning></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20" suppressHydrationWarning>
            <div className="flex items-center gap-3 mb-6" suppressHydrationWarning>
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Quarterly Progress</h2>
            </div>
            <div className="space-y-6" suppressHydrationWarning>
              <div className="group" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-2" suppressHydrationWarning>
                  <span className="text-sm font-semibold text-gray-700">Q1 2024</span>
                  <span className="text-sm font-bold text-blue-600">85%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style={{width: '85%'}} suppressHydrationWarning></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1" suppressHydrationWarning>
                  <span>Jan - Mar</span>
                  <span>RM 1.28M</span>
                </div>
              </div>
              
              <div className="group" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-2" suppressHydrationWarning>
                  <span className="text-sm font-semibold text-gray-700">Q2 2024</span>
                  <span className="text-sm font-bold text-green-600">70%</span>
                </div>
                <div className="w-full bg-green-100 rounded-full h-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500" style={{width: '70%'}} suppressHydrationWarning></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1" suppressHydrationWarning>
                  <span>Apr - Jun</span>
                  <span>RM 1.05M</span>
                </div>
              </div>
              
              <div className="group" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-2" suppressHydrationWarning>
                  <span className="text-sm font-semibold text-gray-700">Q3 2024</span>
                  <span className="text-sm font-bold text-orange-600">45%</span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500" style={{width: '45%'}} suppressHydrationWarning></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1" suppressHydrationWarning>
                  <span>Jul - Sep</span>
                  <span>RM 675K</span>
                </div>
              </div>
              
              <div className="group" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-2" suppressHydrationWarning>
                  <span className="text-sm font-semibold text-gray-700">Q4 2024</span>
                  <span className="text-sm font-bold text-purple-600">25%</span>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-3" suppressHydrationWarning>
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 h-3 rounded-full transition-all duration-500" style={{width: '25%'}} suppressHydrationWarning></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1" suppressHydrationWarning>
                  <span>Oct - Dec</span>
                  <span>RM 375K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Procurement Table (PO/LPO clickable, no item details inline) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden" suppressHydrationWarning>
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
            
            {/* Search Bar */}
            <div className="relative mb-4" suppressHydrationWarning>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" suppressHydrationWarning>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search anything: item, PO, LPO, SKU, quantity, amount..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex gap-4 mb-4" suppressHydrationWarning>
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
                  <option value="Cancel">Cancel</option>
                </select>
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
            <table className="min-w-full" suppressHydrationWarning>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100" suppressHydrationWarning>
                <tr suppressHydrationWarning>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">PO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">LPO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Amount (RM)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/50" suppressHydrationWarning>
                {currentData.map((item, index) => (
                  <tr key={index} className="group hover:bg-white/80 transition-all duration-200 hover:shadow-sm" suppressHydrationWarning>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-100 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600 border-r border-gray-100 whitespace-nowrap cursor-pointer" onClick={()=>setOpenRow(item)}>{item.po}</td>
                    <td className="px-4 py-3 text-sm font-medium text-purple-600 border-r border-gray-100 whitespace-nowrap cursor-pointer" onClick={()=>setOpenRow(item)}>{item.lpo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-100 whitespace-nowrap">{item.total}</td>
                    <td className="px-4 py-3 whitespace-nowrap" suppressHydrationWarning>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
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
        {/* Details Modal */}
        {openRow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-900">{openRow.po} • {openRow.lpo}</div>
                  <div className="text-xs text-slate-600">Date: {openRow.date}</div>
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
                    <tr>
                      <td className="px-3 py-2 text-sm text-slate-800">{openRow.item}</td>
                      <td className="px-3 py-2 text-xs"><span className={`px-2 py-1 rounded-full ${openRow.category==='DRUG'?'bg-blue-50 text-blue-700':openRow.category==='NON DRUG'?'bg-emerald-50 text-emerald-700':'bg-violet-50 text-violet-700'}`}>{openRow.category}</span></td>
                      <td className="px-3 py-2 text-sm text-slate-600">{openRow.sku}</td>
                      <td className="px-3 py-2 text-sm text-right">{openRow.quantity}</td>
                      <td className="px-3 py-2 text-sm text-right">{openRow.amount}</td>
                      <td className="px-3 py-2 text-sm text-right font-semibold">{openRow.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                <button onClick={()=>setOpenRow(null)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
