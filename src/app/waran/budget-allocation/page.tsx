'use client';

import { useState } from 'react';

export default function BudgetAllocationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showNewAllocation, setShowNewAllocation] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    codeNo: '',
    voteNo: '',
    department: ''
  });
  const [formData, setFormData] = useState({
    date: '',
    documentNo: '',
    code: '',
    voteNo: '',
    category: '',
    department: '',
    amount: '',
    allocationType: ''
  });

  const transactions = [
    { date: '2024-01-15', documentNo: 'APPL-001', codeNo: '990102', voteNo: '27401', category: 'APPL Drug', department: 'Pharmacy', amount: 'RM 50,000' },
    { date: '2024-01-14', documentNo: 'APPL-002', codeNo: '990102', voteNo: '27499', category: 'APPL Non Drug', department: 'Pharmacy', amount: 'RM 25,000' },
    { date: '2024-01-13', documentNo: 'FARM-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Pharmacy', amount: 'RM 30,000' },
    { date: '2024-01-12', documentNo: 'VAKS-001', codeNo: '990102', voteNo: '27404', category: 'APPL Vaccine', department: 'Pharmacy', amount: 'RM 5,000' },
    { date: '2024-01-11', documentNo: 'OKSIG-001', codeNo: '080702', voteNo: '27402', category: 'Oxygen', department: 'Pharmacy', amount: 'RM 15,000' },
    { date: '2024-01-10', documentNo: 'ETU-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Emergency Department', amount: 'RM 45,000' },
    { date: '2024-01-09', documentNo: 'GW-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'General Ward', amount: 'RM 38,000' },
    { date: '2024-01-08', documentNo: 'ANAES-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Anesthesiology', amount: 'RM 42,000' },
    { date: '2024-01-07', documentNo: 'REHAB-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Rehabilitation Services', amount: 'RM 35,000' },
    { date: '2024-01-06', documentNo: 'NEPHRO-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Nephrology', amount: 'RM 78,500' },
    { date: '2024-01-05', documentNo: 'NEPHRO-002', codeNo: '080702', voteNo: '27499', category: 'CC Non Drug', department: 'Nephrology', amount: 'RM 46,500' },
    { date: '2024-01-04', documentNo: 'PATOLOGI-001', codeNo: '080702', voteNo: '27403', category: 'Patologi', department: 'Pathology Laboratory', amount: 'RM 72,000' },
    { date: '2024-01-03', documentNo: 'XRAY-001', codeNo: '080702', voteNo: '27501', category: 'Xray', department: 'Radiologi', amount: 'RM 10,000' },
    { date: '2024-01-02', documentNo: 'WOUND-001', codeNo: '080702', voteNo: '27500', category: 'WoundCare', department: 'Wound Care', amount: 'RM 15,000' },
    { date: '2024-01-01', documentNo: 'CSSU-001', codeNo: '080702', voteNo: '27499', category: 'CSSU/CSSD', department: 'Central Sterile Services', amount: 'RM 6,000' },
    { date: '2023-12-31', documentNo: 'INSULIN-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Pharmacy', amount: 'RM 2,000' },
    { date: '2023-12-30', documentNo: 'VAKSIN-001', codeNo: '080702', voteNo: '27404', category: 'CC Vaccine', department: 'Pharmacy', amount: 'RM 10,000' },
    { date: '2023-12-29', documentNo: 'HEPC-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Pharmacy', amount: 'RM 2,000' },
  ];

  const departments = ['Pharmacy', 'Emergency Department', 'General Ward', 'Central Sterile Services', 'Anesthesiology', 'Rehabilitation Services', 'Nephrology', 'Pathology Laboratory', 'Radiologi', 'Wound Care'];
  const codeNos = ['990102', '080702'];
  const voteNos = ['27401', '27499', '27404', '27501', '27500', '27402', '27403'];
  const categories = ['APPL Drug', 'APPL Non Drug', 'APPL Vaccine', 'CC Drug', 'CC Non Drug', 'CC Vaccine', 'Non Standards', 'Oxygen', 'Patologi', 'Xray', 'WoundCare', 'CSSU/CSSD'];
  const allocationTypes = ['New', 'Virement'];

  // Date picker helper functions
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setFormData(prev => ({ ...prev, date: formatDateForInput(selectedDate) }));
    setShowDatePicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = (!filters.codeNo || transaction.codeNo === filters.codeNo) &&
                          (!filters.voteNo || transaction.voteNo === filters.voteNo) &&
                          (!filters.department || transaction.department === filters.department);
    
    return matchesSearch && matchesFilters;
  });

  const clearFilters = () => {
    setFilters({ codeNo: '', voteNo: '', department: '' });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      date: '',
      documentNo: '',
      code: '',
      voteNo: '',
      category: '',
      department: '',
      amount: '',
      allocationType: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('New allocation data:', formData);
    // Reset form and close modal
    resetForm();
    setShowNewAllocation(false);
    // You might want to refresh the transactions list here
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Document No', 'Code No', 'Vote No', 'Category', 'Department', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        transaction.date,
        transaction.documentNo,
        transaction.codeNo,
        transaction.voteNo,
        transaction.category,
        transaction.department,
        transaction.amount.replace('RM ', '').replace(',', '')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeStyle = (category: string) => {
    const styles = {
      'APPL Drug': 'from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'APPL Non Drug': 'from-green-100 to-green-200 text-green-800 border-green-300',
      'CC Drug': 'from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300',
      'APPL Vaccine': 'from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'Oxygen': 'from-teal-100 to-teal-200 text-teal-800 border-teal-300',
    };
    return styles[category as keyof typeof styles] || 'from-gray-100 to-gray-200 text-gray-800 border-gray-300';
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Budgetary Allocation
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base font-medium">Manage and allocate budget across departments and categories</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Data</span>
              </div>
                  <button 
                    onClick={() => setShowNewAllocation(true)}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Allocation
                  </button>
            </div>
          </div>
        </div>
      
      
        {/* Modern Transaction Details */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-white rounded-3xl shadow-2xl border border-slate-200/60">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
          
          {/* Modern Header */}
          <div className="relative px-8 py-8 border-b border-slate-200/40">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                    Transaction Details
                  </h2>
                  <p className="text-slate-600 mt-1 font-medium">Financial transaction records and audit trail</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    className="pl-12 pr-4 py-3 border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm w-72 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <button 
                  onClick={() => setShowFilter(true)}
                  className="group px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter
                  {(filters.codeNo || filters.voteNo || filters.department) && (
                    <span className="ml-1 px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                      {[filters.codeNo, filters.voteNo, filters.department].filter(Boolean).length}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={exportToCSV}
                  className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 via-slate-100/80 to-slate-50 border-b border-slate-200/60">
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Document No
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Code No
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Vote No
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Category
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Department
                    </div>
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2 justify-end">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Amount
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={index} className="group hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-blue-50/30 transition-all duration-300 border-l-4 border-transparent hover:border-emerald-400">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                        <span className="text-sm font-semibold text-slate-900">{transaction.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-slate-700 transition-colors duration-200">
                        {transaction.documentNo}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {transaction.codeNo}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        {transaction.voteNo}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold shadow-sm border ${getCategoryBadgeStyle(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200">
                        {transaction.department}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-200">
                        {transaction.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Modern Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-slate-50/80 via-slate-100/60 to-slate-50/80 border-t border-slate-200/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="text-sm font-semibold text-slate-700">
                  Showing <span className="font-bold text-emerald-600">{filteredTransactions.length}</span> of <span className="font-bold text-slate-900">{transactions.length}</span> transactions
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="group px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300 hover:shadow-sm">
                  <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  <span className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm">1</span>
                  <span className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-colors duration-200 cursor-pointer">2</span>
                  <span className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-colors duration-200 cursor-pointer">3</span>
                </div>
                <button className="group px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300 hover:shadow-sm">
                  Next
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Allocation Modal */}
      {showNewAllocation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      New Allocation
                    </h3>
                    <p className="text-gray-600 text-sm font-medium">Create a new budget allocation</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowNewAllocation(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.date ? new Date(formData.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : ''}
                        placeholder="Select a date"
                        readOnly
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="w-full px-4 py-3 pl-12 pr-12 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-md text-gray-900 font-medium cursor-pointer"
                        required
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {formData.date && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>

                    {/* Custom Date Picker */}
                    {showDatePicker && (
                      <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/60 p-6 w-full max-w-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigateYear('prev')}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-lg font-bold text-gray-900 min-w-[80px] text-center">
                              {currentDate.getFullYear()}
                            </span>
                            <button 
                              onClick={() => navigateYear('next')}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigateMonth('prev')}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-lg font-bold text-gray-900 min-w-[100px] text-center">
                              {months[currentDate.getMonth()]}
                            </span>
                            <button 
                              onClick={() => navigateMonth('next')}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-10"></div>
                          ))}
                          {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, index) => {
                            const day = index + 1;
                            const isSelected = formData.date && new Date(formData.date).getDate() === day && 
                                              new Date(formData.date).getMonth() === currentDate.getMonth() && 
                                              new Date(formData.date).getFullYear() === currentDate.getFullYear();
                            const isToday = new Date().getDate() === day && 
                                           new Date().getMonth() === currentDate.getMonth() && 
                                           new Date().getFullYear() === currentDate.getFullYear();
                            
                            return (
                              <button
                                key={day}
                                onClick={() => handleDateSelect(day)}
                                className={`h-10 w-10 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : isToday 
                                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const today = new Date();
                                setFormData(prev => ({ ...prev, date: formatDateForInput(today) }));
                                setShowDatePicker(false);
                              }}
                              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
                            >
                              Today
                            </button>
                            <button 
                              onClick={() => setShowDatePicker(false)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.date && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-800">
                            Selected: {new Date(formData.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document No */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Document No *</label>
                    <input 
                      type="text" 
                      value={formData.documentNo}
                      onChange={(e) => handleFormChange('documentNo', e.target.value)}
                      placeholder="e.g., APPL-001"
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Code *</label>
                    <select 
                      value={formData.code}
                      onChange={(e) => handleFormChange('code', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Select Code</option>
                      {codeNos.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vote No */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vote No *</label>
                    <select 
                      value={formData.voteNo}
                      onChange={(e) => handleFormChange('voteNo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Select Vote No</option>
                      {voteNos.map(vote => (
                        <option key={vote} value={vote}>{vote}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                    <select 
                      value={formData.department}
                      onChange={(e) => handleFormChange('department', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (RM) *</label>
                    <input 
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => handleFormChange('amount', e.target.value)}
                      placeholder="e.g., 50000"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Allocation Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Allocation Type *</label>
                    <select 
                      value={formData.allocationType}
                      onChange={(e) => handleFormChange('allocationType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Select Type</option>
                      {allocationTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200/40">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowNewAllocation(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Allocation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Filter Transactions
                </h3>
                <button 
                  onClick={() => setShowFilter(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Code No Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code No</label>
                  <select 
                    value={filters.codeNo}
                    onChange={(e) => setFilters({...filters, codeNo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="">All Code Numbers</option>
                    {codeNos.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>

                {/* Vote No Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vote No</label>
                  <select 
                    value={filters.voteNo}
                    onChange={(e) => setFilters({...filters, voteNo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="">All Vote Numbers</option>
                    {voteNos.map(vote => (
                      <option key={vote} value={vote}>{vote}</option>
                    ))}
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <select 
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={clearFilters}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowFilter(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
