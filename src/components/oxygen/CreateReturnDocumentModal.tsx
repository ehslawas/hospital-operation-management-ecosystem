// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit3, CheckSquare, Square, ChevronDown, ChevronRight, AlertCircle, RefreshCw, Trash2, Plus, QrCode, CheckCircle2, ChevronLeft, Search } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { getEmptyCylindersInStore, createReturnDocument, getCylinderByQrOrSerial, markCylinderAsEmpty } from '@/services/pharmacy/oxygenService';
import type { OxygenCylinderWithRelations } from '@/types/pharmacy';

const parseTypeAndSize = (typeName: string) => {
  const regex = /\(([^)]+)\)/;
  const match = typeName.match(regex);
  if (match) {
    const size = match[1];
    const type = typeName.replace(regex, '').replace(/\s+/g, ' ').trim();
    return { type, size };
  }
  return { type: typeName, size: '-' };
};

interface CreateReturnDocumentModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionScannedCylinders: OxygenCylinderWithRelations[];
  setSessionScannedCylinders: React.Dispatch<React.SetStateAction<OxygenCylinderWithRelations[]>>;
}

export const CreateReturnDocumentModal: React.FC<CreateReturnDocumentModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onSuccess,
  sessionScannedCylinders,
  setSessionScannedCylinders,
}) => {
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<{ id: string; company_name: string }[]>([]);
  const [emptyCylinders, setEmptyCylinders] = useState<OxygenCylinderWithRelations[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [selectedCylinders, setSelectedCylinders] = useState<string[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<{ [key: string]: boolean }>({});
  
  // Manual Loan quantities state
  const [manualLoans, setManualLoans] = useState<{ sizeCode: string; qty: number }[]>([]);
  const [manualSizeSelect, setManualSizeSelect] = useState('101-F (1.4m3)');
  const [manualQtyInput, setManualQtyInput] = useState<number>(1);
  const [supplierCylinders, setSupplierCylinders] = useState<OxygenCylinderWithRelations[]>([]);
  const [supplierSizeFilter, setSupplierSizeFilter] = useState<'all' | '101-N' | '101-F'>('101-N');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard states
  const [step, setStep] = useState<'scan' | 'details'>('scan');
  const [scannedCylinders, setScannedCylinders] = useState<OxygenCylinderWithRelations[]>([]);

  // Tab state for separating loan vs standard empty cylinders (Standardized to standard, loan items added via bulk manual input)
  const [cylinderTab, setCylinderTab] = useState<'loan' | 'standard'>('standard');
  const [currentPage, setCurrentPage] = useState(1);
  const [innerSearchTerm, setInnerSearchTerm] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('');
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [cylinderTab, innerSearchTerm, selectedSizeFilter]);

  useEffect(() => {
    setSelectedSizeFilter('');
  }, [cylinderTab]);

  const loanSizes = ['101-F (1.4m3)', '101-N (8.0m3)'];

  // Load suppliers and empty cylinders
  useEffect(() => {
    if (isOpen && hospitalId) {
      loadData();
    }
  }, [isOpen, hospitalId]);

  const handleClose = () => {
    onClose();
  };

  // Sync scannedCylinders back to sessionScannedCylinders
  useEffect(() => {
    if (isOpen) {
      setSessionScannedCylinders(scannedCylinders);
    }
  }, [scannedCylinders, isOpen, setSessionScannedCylinders]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setManualLoans([]);
    setStep('scan');
    setScannedCylinders(sessionScannedCylinders);
    try {
      // 1. Fetch active suppliers
      const { data: sups, error: supErr } = await supabase
        .from('suppliers')
        .select('id, company_name, supplier_code')
        .eq('status', 'active');

      if (supErr) throw supErr;
      setSuppliers(sups || []);
      
      const linde = (sups || []).find(s => s.company_name.toLowerCase().includes('linde'));
      if (linde) {
        setSelectedSupplier(linde.id);
      } else if (sups && sups.length > 0) {
        setSelectedSupplier(sups[0].id);
      }

      // 2. Fetch empty cylinders in store (status='issued')
      const res = await getEmptyCylindersInStore(hospitalId);
      if (res.error) throw new Error(res.error);
      const filtered = (res.data || []).filter((c: any) => {
        if (c.supplier_tagged) return true;
        const serial = (c.serial_number || '').toUpperCase();
        const typeName = (c.type_info?.type_name || '').toLowerCase();
        const isLoan = c.is_loan || 
                       typeName.includes('loan') || 
                       serial.startsWith('101-N') || 
                       serial.startsWith('101-F') ||
                       serial.startsWith('101N') ||
                       serial.startsWith('101F') ||
                       serial.startsWith('LOAN');
        return !isLoan;
      });
      setEmptyCylinders(filtered);
      
      // Reset selections
      setSelectedCylinders([]);
      setRemarks('');
      setReturnDate(new Date().toISOString().split('T')[0]);

      // 3. Fetch supplier-tagged cylinders
      const { isSupabaseConfigured } = await import('@/services/supabase');
      if (isSupabaseConfigured()) {
        const { data: supCyls, error: supCylsErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .select(`
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            type_info:pharmacy_oxygen_cylinder_types(*)
          `)
          .eq('hospital_id', hospitalId)
          .eq('supplier_tagged', true)
          .neq('status', 'returned_to_supplier')
          .order('serial_number', { ascending: true });

        if (!supCylsErr) {
          setSupplierCylinders(supCyls || []);
        }
      } else {
        const { mockOxygenCylinders } = await import('@/services/pharmacy/mockData');
        const mockSupCyls = mockOxygenCylinders.filter(
          c => c.supplier_tagged === true && c.status !== 'returned_to_supplier'
        );
        setSupplierCylinders(mockSupCyls);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load return document details.');
    } finally {
      setIsLoading(false);
    }
  };



  // Get unique cylinder sizes/types in active tab for secondary filter pills
  const availableSizes = Array.from(new Set(
    emptyCylinders
      .filter(c => {
        const isLoan = !c.supplier_tagged && (c.is_loan || c.type_info?.type_name?.toLowerCase().includes('loan'));
        const isScanned = sessionScannedCylinders.some(sc => sc.id === c.id);
        return (cylinderTab === 'loan' ? isLoan : !isLoan) && isScanned;
      })
      .map(c => c.type_info?.type_name)
      .filter(Boolean)
  )) as string[];

  // Filter empty cylinders by active tab, search query, and size filter
  const filteredCylinders = emptyCylinders.filter(c => {
    const isLoan = !c.supplier_tagged && (c.is_loan || c.type_info?.type_name?.toLowerCase().includes('loan'));
    const matchesTab = cylinderTab === 'loan' ? isLoan : !isLoan;
    
    if (!matchesTab) return false;

    // Only show cylinders that have been scanned/selected empty in this session
    const isScanned = sessionScannedCylinders.some(sc => sc.id === c.id);
    if (!isScanned) return false;
    
    if (selectedSizeFilter && c.type_info?.type_name !== selectedSizeFilter) {
      return false;
    }
    
    if (innerSearchTerm.trim()) {
      const query = innerSearchTerm.toLowerCase();
      const serial = (c.serial_number || '').toLowerCase();
      const qr = (c.qr_code || '').toLowerCase();
      const type = (c.type_info?.type_name || '').toLowerCase();
      const ward = (c.assigned_ward?.department_name || '').toLowerCase();
      return serial.includes(query) || qr.includes(query) || type.includes(query) || ward.includes(query);
    }
    
    return true;
  });

  const totalItems = filteredCylinders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCylinders = filteredCylinders.slice(startIndex, startIndex + pageSize);

  const isAllOnPageSelected = paginatedCylinders.length > 0 && paginatedCylinders.every(c => scannedCylinders.some(sc => sc.id === c.id));
  const isSomeOnPageSelected = paginatedCylinders.some(c => scannedCylinders.some(sc => sc.id === c.id)) && !isAllOnPageSelected;

  const isAllMatchingSelected = filteredCylinders.length > 0 && filteredCylinders.every(c => scannedCylinders.some(sc => sc.id === c.id));

  const handleSelectAllMatching = () => {
    if (isAllMatchingSelected) {
      const matchingIds = filteredCylinders.map(c => c.id);
      setScannedCylinders(scannedCylinders.filter(c => !matchingIds.includes(c.id)));
    } else {
      const newSelections = [...scannedCylinders];
      filteredCylinders.forEach(cyl => {
        if (!newSelections.some(c => c.id === cyl.id)) {
          newSelections.push(cyl);
        }
      });
      setScannedCylinders(newSelections);
    }
  };

  const handleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      const pageIds = paginatedCylinders.map(c => c.id);
      setScannedCylinders(scannedCylinders.filter(c => !pageIds.includes(c.id)));
    } else {
      const newSelections = [...scannedCylinders];
      paginatedCylinders.forEach(cyl => {
        if (!newSelections.some(c => c.id === cyl.id)) {
          newSelections.push(cyl);
        }
      });
      setScannedCylinders(newSelections);
    }
  };

  const toggleCylinderSelect = (id: string) => {
    if (scannedCylinders.some(c => c.id === id)) {
      setScannedCylinders(scannedCylinders.filter(c => c.id !== id));
    } else {
      const cyl = emptyCylinders.find(c => c.id === id);
      if (cyl) {
        setScannedCylinders([...scannedCylinders, cyl]);
      }
    }
  };

  // Add Manual Quantity (Strictly Loan Cylinders)
  const handleAddManualLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQtyInput <= 0) return;

    const existing = manualLoans.find(item => item.sizeCode === manualSizeSelect);
    if (existing) {
      setManualLoans(manualLoans.map(item => 
        item.sizeCode === manualSizeSelect ? { ...item, qty: item.qty + manualQtyInput } : item
      ));
    } else {
      setManualLoans([...manualLoans, { sizeCode: manualSizeSelect, qty: manualQtyInput }]);
    }
    setManualQtyInput(1);
  };

  const handleRemoveManualLoan = (sizeCode: string) => {
    setManualLoans(manualLoans.filter(item => item.sizeCode !== sizeCode));
  };

  const handleKeyDownManualQty = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddManualLoan(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      setError('Please select a supplier.');
      return;
    }
    if (scannedCylinders.length === 0 && manualLoans.length === 0) {
      setError('Please scan at least one empty cylinder or add manual loan quantities.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const creatorId = user?.id || localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205';
      
      // Auto-generate placeholder cylinders for manual quantities
      const payloadManualLoans: { serial_number: string; qr_code?: string }[] = [];
      manualLoans.forEach(loan => {
        for (let i = 0; i < loan.qty; i++) {
          const rand = Math.floor(10000 + Math.random() * 90000);
          payloadManualLoans.push({
            serial_number: `LOAN-${loan.sizeCode.replace(/\s+/g, '')}-${rand}`,
            qr_code: `qr-loan-${loan.sizeCode.toLowerCase().replace(/\s+/g, '')}-${rand}`
          });
        }
      });

      const res = await createReturnDocument(
        hospitalId,
        selectedSupplier,
        returnDate,
        scannedCylinders.map(c => c.id),
        remarks,
        creatorId,
        payloadManualLoans
      );

      if (res.error) throw new Error(res.error);
      setSessionScannedCylinders([]);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate return document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={handleClose}
        className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60 bg-gradient-to-r from-rose-500/5 to-pink-500/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
              {step === 'scan' ? (
                <QrCode className="w-5 h-5 text-rose-600" />
              ) : (
                <Calendar className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {step === 'scan' ? 'Select Cylinders to Return' : 'Create Return Document'}
              </h3>
              <p className="text-slate-500 text-xs font-semibold">
                {step === 'scan' ? 'Select available empty cylinders in inventory to return' : 'Sent when returning empty cylinders to supplier'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/50 flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
              <span className="text-slate-500 font-bold text-sm">Loading empty cylinders registry...</span>
            </div>
          ) : (
            <>
              {step === 'scan' ? (
                <div className="space-y-4">
                  {/* Empty Cylinders Registry selection with separating tabs */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                      <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                        <CheckSquare className="w-4.5 h-4.5 text-rose-600" />
                        <span>Select Available Empty Cylinders to Return</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAllMatching}
                          className="px-3 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                        >
                          {isAllMatchingSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="bg-rose-500 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                          {scannedCylinders.length} Selected
                        </span>
                      </div>
                    </div>

                    {/* Search filter input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={innerSearchTerm}
                        onChange={(e) => setInnerSearchTerm(e.target.value)}
                        placeholder="Search by Serial, QR Code, Type or Location..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                    </div>

                    {/* Ownership tabs removed as loan cylinders are quantity-only/untracked */}

                    {/* Secondary Cylinder Size Filter Pills */}
                    {availableSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSizeFilter('')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                            selectedSizeFilter === ''
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          All ({emptyCylinders.filter(c => {
                            const isLoan = !c.supplier_tagged && (c.is_loan || c.type_info?.type_name?.toLowerCase().includes('loan'));
                            const isScanned = sessionScannedCylinders.some(sc => sc.id === c.id);
                            return (cylinderTab === 'loan' ? isLoan : !isLoan) && isScanned;
                          }).length})
                        </button>
                        {availableSizes.map((sizeName) => {
                          const count = emptyCylinders.filter(c => c.type_info?.type_name === sizeName && sessionScannedCylinders.some(sc => sc.id === c.id)).length;
                          return (
                            <button
                              key={sizeName}
                              type="button"
                              onClick={() => setSelectedSizeFilter(sizeName)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                                selectedSizeFilter === sizeName
                                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sizeName} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {filteredCylinders.length === 0 ? (
                      <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-sm">
                        No empty {cylinderTab === 'loan' ? 'Loan' : 'Standard/Hospital Owned'} cylinders found matching the query.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200/50 bg-slate-50/25 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                <th className="py-3 px-4 w-10">
                                  <button
                                    type="button"
                                    onClick={handleSelectAllOnPage}
                                    className="text-slate-500 hover:text-rose-600 transition-colors flex items-center"
                                  >
                                    {isAllOnPageSelected ? (
                                      <CheckSquare className="w-5 h-5 text-rose-500" />
                                    ) : isSomeOnPageSelected ? (
                                      <div className="w-5 h-5 rounded border-2 border-slate-400 bg-rose-200 flex items-center justify-center">
                                        <div className="w-2.5 h-[2px] bg-rose-700" />
                                      </div>
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-400" />
                                    )}
                                  </button>
                                </th>
                                <th className="py-3 px-4">Serial Number</th>
                                <th className="py-3 px-4">QR Code</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Size</th>
                                <th className="py-3 px-4">Location</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/40 text-slate-700 font-medium">
                              {paginatedCylinders.map((cyl) => {
                                const isSelected = scannedCylinders.some(c => c.id === cyl.id);
                                const parsed = parseTypeAndSize(cyl.type_info?.type_name || 'Standard');
                                return (
                                  <tr
                                    key={cyl.id}
                                    onClick={() => toggleCylinderSelect(cyl.id)}
                                    className="hover:bg-slate-50/30 transition-colors duration-150 cursor-pointer"
                                  >
                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => toggleCylinderSelect(cyl.id)}
                                        className="text-slate-500 hover:text-rose-600 transition-colors flex items-center"
                                      >
                                        {isSelected ? (
                                          <CheckSquare className="w-5 h-5 text-rose-500" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-bold text-slate-800 font-mono">
                                      {cyl.serial_number}
                                    </td>
                                    <td className="py-3 px-4 text-[10px] text-slate-500 font-mono">
                                      {cyl.qr_code || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                                      {parsed.type}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-bold text-slate-600">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[10px]">
                                        {parsed.size}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-slate-500">
                                      {cyl.assigned_ward?.department_name || 'Store'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination controller */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between border border-slate-200 bg-slate-50/50 rounded-2xl p-3 text-xs font-semibold text-slate-600 shadow-sm">
                            <span>
                              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} cylinders
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Supplier & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1.5">Supplier</label>
                      <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-sm"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1.5">Return Date</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-sm"
                      />
                    </div>
                  </div>

                  {/* Return Summary / Scanned Count */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Scanned Cylinders to Return</span>
                    <span className="bg-rose-500 text-white px-2.5 py-1 rounded-full text-[10px]">
                      {scannedCylinders.length} cylinders
                    </span>
                  </div>

                  {/* Manual Supplier Tag Selection (Loan Cylinders Only) */}
                  {supplierCylinders.length > 0 || scannedCylinders.some(c => c.supplier_tagged) ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-rose-600 animate-pulse" />
                          Select Supplier Cylinder ID (Loan 101-N / 101-F)
                        </label>
                        
                        {/* Size Filter Toggle/Pills */}
                        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-extrabold uppercase">
                          {(['all', '101-N', '101-F'] as const).map((filterVal) => {
                            const count = supplierCylinders.filter(c => filterVal === 'all' || c.size_info?.code === filterVal).length;
                            return (
                              <button
                                key={filterVal}
                                type="button"
                                onClick={() => setSupplierSizeFilter(filterVal)}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                  supplierSizeFilter === filterVal
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-800'
                                }`}
                              >
                                {filterVal === 'all' ? 'All' : filterVal} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Checkbox Grid of available supplier cylinders */}
                      {(() => {
                        const displayedCyls = supplierCylinders.filter(c => supplierSizeFilter === 'all' || c.size_info?.code === supplierSizeFilter);
                        if (displayedCyls.length === 0) {
                          return (
                            <p className="text-[11px] text-slate-400 font-semibold italic text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl">
                              No active supplier-tagged cylinders found for this size.
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                            {displayedCyls.map((cyl) => {
                              const isSelected = scannedCylinders.some(sc => sc.id === cyl.id);
                              return (
                                <label
                                  key={cyl.id}
                                  className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all select-none hover:bg-slate-100/50 ${
                                    isSelected
                                      ? 'border-rose-400 bg-rose-50/20 text-rose-800 ring-2 ring-rose-500/5 shadow-sm'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setScannedCylinders(scannedCylinders.filter(sc => sc.id !== cyl.id));
                                      } else {
                                        setScannedCylinders([...scannedCylinders, cyl]);
                                      }
                                    }}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-mono font-bold truncate leading-none mb-1">{cyl.serial_number}</span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{cyl.size_info?.code || '101-N'}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}

                  {/* Add Manual Quantity Widget */}
                  <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-4 shadow-sm">
                    <label className="block text-slate-700 font-bold text-xs mb-2 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-rose-600" />
                      Add Manual Quantity (Generic Loan Cylinders Only)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                      <div className="sm:col-span-2">
                        <select
                          value={manualSizeSelect}
                          onChange={(e) => setManualSizeSelect(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          {loanSizes.map((size) => (
                            <option key={size} value={size}>
                              {size} Loan
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={manualQtyInput}
                          onChange={(e) => setManualQtyInput(parseInt(e.target.value) || 1)}
                          onKeyDown={handleKeyDownManualQty}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 text-center"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualLoan}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Add Loan Quantity
                    </button>

                    {manualLoans.length > 0 && (
                      <div className="mt-4 border-t border-slate-200/60 pt-3">
                        <span className="block text-slate-600 font-bold text-[10px] uppercase mb-1.5">
                          Manual Loan Quantities Selected
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {manualLoans.map((item) => (
                            <div key={item.sizeCode} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-xs">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{item.sizeCode} Loan Cylinder</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Quantity to return: {item.qty}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveManualLoan(item.sizeCode)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1.5">Remarks / Notes</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                      <textarea
                        rows={2}
                        placeholder="Enter supplier collection instructions or notes..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-xs"
                      />
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between gap-3">
          {step === 'scan' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 flex items-center gap-1"
              >
                <span>Proceed to Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('scan')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-colors shadow-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Scan</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (scannedCylinders.length === 0 && manualLoans.length === 0)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-lg disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Generating Document...' : 'Generate Return Document'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
