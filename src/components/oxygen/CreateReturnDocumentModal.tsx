import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit3, CheckSquare, Square, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { getEmptyCylindersInStore, createReturnDocument } from '@/services/pharmacy/oxygenService';
import type { OxygenCylinderWithRelations } from '@/types/pharmacy';

interface CreateReturnDocumentModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateReturnDocumentModal: React.FC<CreateReturnDocumentModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<{ id: string; company_name: string }[]>([]);
  const [emptyCylinders, setEmptyCylinders] = useState<OxygenCylinderWithRelations[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [selectedCylinders, setSelectedCylinders] = useState<string[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<{ [key: string]: boolean }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers and empty cylinders
  useEffect(() => {
    if (isOpen && hospitalId) {
      loadData();
    }
  }, [isOpen, hospitalId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch active non-drug suppliers (like Linde)
      const { data: sups, error: supErr } = await supabase
        .from('suppliers')
        .select('id, company_name, supplier_code')
        .eq('status', 'active')
        .or('supplier_code.ilike.SUP-ND-%,company_name.ilike.%linde%,company_name.ilike.%gas%');

      if (supErr) throw supErr;
      setSuppliers(sups || []);
      
      // Auto-select Linde if available
      const linde = (sups || []).find(s => s.company_name.toLowerCase().includes('linde'));
      if (linde) {
        setSelectedSupplier(linde.id);
      } else if (sups && sups.length > 0) {
        setSelectedSupplier(sups[0].id);
      }

      // 2. Fetch empty cylinders in store
      const res = await getEmptyCylindersInStore(hospitalId);
      if (res.error) throw new Error(res.error);
      setEmptyCylinders(res.data || []);
      
      // Reset selections
      setSelectedCylinders([]);
      setRemarks('');
      setReturnDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load return document creator data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group empty cylinders by type display name
  const groupedCylinders: { [key: string]: OxygenCylinderWithRelations[] } = {};
  emptyCylinders.forEach((cyl) => {
    const typeName = cyl.type_info?.type_name || 'Standard Cylinder';
    if (!groupedCylinders[typeName]) {
      groupedCylinders[typeName] = [];
    }
    groupedCylinders[typeName].push(cyl);
  });

  const toggleTypeExpand = (typeName: string) => {
    setExpandedTypes({
      ...expandedTypes,
      [typeName]: !expandedTypes[typeName],
    });
  };

  const handleSelectAllOfType = (typeName: string, isAllSelected: boolean) => {
    const typeIds = groupedCylinders[typeName].map(c => c.id);
    if (isAllSelected) {
      // Deselect all of this type
      setSelectedCylinders(selectedCylinders.filter(id => !typeIds.includes(id)));
    } else {
      // Select all of this type
      const newSelections = [...selectedCylinders];
      typeIds.forEach(id => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      setSelectedCylinders(newSelections);
    }
  };

  const toggleCylinderSelect = (id: string) => {
    if (selectedCylinders.includes(id)) {
      setSelectedCylinders(selectedCylinders.filter(cId => cId !== id));
    } else {
      setSelectedCylinders([...selectedCylinders, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      setError('Please select a supplier.');
      return;
    }
    if (selectedCylinders.length === 0) {
      setError('Please select at least one cylinder to return.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const creatorId = localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205'; // fallback fallback
      const res = await createReturnDocument(
        hospitalId,
        selectedSupplier,
        returnDate,
        selectedCylinders,
        remarks,
        creatorId
      );

      if (res.error) throw new Error(res.error);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate return document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60 bg-gradient-to-r from-rose-500/5 to-pink-500/5 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Create Return Document</h3>
              <p className="text-slate-500 text-xs font-semibold">Sent when returning empty cylinders to supplier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/50 flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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
              {/* Supplier & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 font-bold text-sm mb-2">Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-sm mb-2">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              {/* Empty Cylinders Registry */}
              <div>
                <label className="block text-slate-700 font-bold text-sm mb-2">
                  Select Empty Cylinders Awaiting Return ({selectedCylinders.length} selected)
                </label>
                
                {emptyCylinders.length === 0 ? (
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                    No empty/issued cylinders found in the hospital inventory.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/40">
                    {Object.keys(groupedCylinders).map((typeName) => {
                      const list = groupedCylinders[typeName];
                      const isExpanded = !!expandedTypes[typeName];
                      const typeIds = list.map(c => c.id);
                      
                      const selectedCountOfType = list.filter(c => selectedCylinders.includes(c.id)).length;
                      const isAllOfTypeSelected = selectedCountOfType === list.length;
                      const isSomeOfTypeSelected = selectedCountOfType > 0 && selectedCountOfType < list.length;

                      return (
                        <div key={typeName} className="border-b border-slate-200 last:border-0">
                          {/* Type Header Row */}
                          <div className="flex items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => handleSelectAllOfType(typeName, isAllOfTypeSelected)}
                                className="text-slate-500 hover:text-rose-600 transition-colors"
                              >
                                {isAllOfTypeSelected ? (
                                  <CheckSquare className="w-5 h-5 text-rose-500" />
                                ) : isSomeOfTypeSelected ? (
                                  <div className="w-5 h-5 rounded border border-slate-400 bg-rose-200 flex items-center justify-center">
                                    <div className="w-2.5 h-[2px] bg-rose-700" />
                                  </div>
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </button>
                              <span className="font-bold text-slate-800 text-sm">{typeName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-200/60 border border-slate-300/30 text-[10px] text-slate-600 font-extrabold uppercase">
                                {selectedCountOfType} / {list.length} empty
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => toggleTypeExpand(typeName)}
                              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            </button>
                          </div>

                          {/* Expanded Serial Numbers */}
                          {isExpanded && (
                            <div className="px-4 py-3 bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
                              {list.map((cyl) => {
                                const isSelected = selectedCylinders.includes(cyl.id);
                                return (
                                  <div
                                    key={cyl.id}
                                    onClick={() => toggleCylinderSelect(cyl.id)}
                                    className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-rose-50/20"
                                  >
                                    <div className="flex items-center space-x-3">
                                      {isSelected ? (
                                        <CheckSquare className="w-4.5 h-4.5 text-rose-500" />
                                      ) : (
                                        <Square className="w-4.5 h-4.5 text-slate-400" />
                                      )}
                                      <span className="font-bold text-slate-700 text-xs">{cyl.serial_number}</span>
                                      <span className="font-mono text-[10px] text-slate-400">({cyl.qr_code})</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Location: {cyl.assigned_ward?.department_name || 'Store'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-bold text-sm mb-2">Remarks / Notes</label>
                <div className="relative">
                  <Edit3 className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <textarea
                    rows={3}
                    placeholder="Enter supplier collection instructions or notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-2xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCylinders.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-lg disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Generating Document...' : 'Generate Return Document'}
          </button>
        </div>
      </div>
    </div>
  );
};
