import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldAlert, Store, User as UserIcon } from 'lucide-react';
import type { User } from '@/types';

interface ManualIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    department_id: string;
    items: { size_code: string; quantity: number; usage_notes?: string }[];
    remarks?: string;
    requested_by?: string;
    manual_requester_name?: string;
  }) => Promise<void>;
  departments: { id: string; department_name: string }[];
  currentUser: User | null;
  users: { id: string; full_name: string; jawatan?: string }[];
}

interface ItemRow {
  size_code: string;
  quantity: number;
  usage_notes: string;
}

const CYLINDER_SIZES = [
  { code: '101-N', label: 'BN (8.0m³)' },
  { code: '101-F', label: 'PI (1.4m³)' },
  { code: '101-E', label: 'E (0.7m³)' },
  { code: '101-D', label: 'D (0.5m³)' },
  { code: '101-HS', label: 'HS (6.4m³)' },
];

export const ManualIssueModal: React.FC<ManualIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
  currentUser,
  users,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isManualRequester, setIsManualRequester] = useState(false);
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [manualRequesterName, setManualRequesterName] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { size_code: '101-N', quantity: 1, usage_notes: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { size_code: '101-N', quantity: 1, usage_notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      setError('Please select a department.');
      return;
    }

    if (!isManualRequester && !selectedRequesterId) {
      setError('Please select a requesting user.');
      return;
    }

    if (isManualRequester && !manualRequesterName.trim()) {
      setError('Please enter the requester name manually.');
      return;
    }

    const invalidItem = items.some((item) => !item.quantity || item.quantity <= 0);
    if (invalidItem) {
      setError('Quantity must be a positive number for all items.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedUser = users.find(u => u.id === selectedRequesterId);
      await onSubmit({
        department_id: selectedDeptId,
        items: items.map((itm) => ({
          size_code: itm.size_code,
          quantity: Number(itm.quantity),
          usage_notes: itm.usage_notes || undefined,
        })),
        remarks: remarks || undefined,
        requested_by: isManualRequester ? undefined : selectedRequesterId,
        manual_requester_name: isManualRequester ? manualRequesterName : selectedUser?.full_name,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
      <div 
        className="bg-slate-50 w-full max-w-2xl h-full rounded-l-3xl shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 flex items-center justify-between bg-white shadow-sm relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Borang Pengeluaran Silinder Manual</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Record a manual cylinder issue to a department directly.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all duration-200 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-8 bg-slate-50/50">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl flex items-start gap-2.5 text-rose-800 text-sm animate-in fade-in zoom-in-95 duration-200">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Requesting Department *
            </label>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer"
                required
              >
                <option value="">Select Department...</option>
                {departments
                  .filter(dept => {
                    const name = dept.department_name.toLowerCase();
                    const keywords = [
                      'paediatric', 'paed',
                      'maternity', 'bersalin',
                      'emergency', 'trauma', 'kecemasan',
                      'general ward', 'wad am',
                      'haemodialysis', 'hemodialysis', 'hemodialisis', 'dialisis',
                      'radiology', 'radiografi', 'radiography', 'x-ray',
                      'operation theater', 'operation theatre', 'dewan bedah', 'ot'
                    ];
                    return keywords.some(keyword => name.includes(keyword));
                  })
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3.5 top-3 sm:top-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Requester Selection */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Requested By (Requester) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualRequester(!isManualRequester);
                  setSelectedRequesterId('');
                  setManualRequesterName('');
                  setError(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors"
              >
                {isManualRequester ? 'Choose from system users' : 'Enter name manually'}
              </button>
            </div>

            {isManualRequester ? (
              <input
                type="text"
                placeholder="Enter requester name manually..."
                value={manualRequesterName}
                onChange={(e) => setManualRequesterName(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                required
              />
            ) : (
              <div className="relative">
                <select
                  value={selectedRequesterId}
                  onChange={(e) => setSelectedRequesterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Requester...</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} {u.jawatan ? `(${u.jawatan})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3 sm:top-3.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Item Inputs */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cylinders to Dispatch *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Size
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2.5 p-3.5 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl relative shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  {/* Size and Qty Row on mobile */}
                  <div className="flex gap-3 w-full">
                    {/* Size Dropdown */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Size Code</span>
                      <div className="relative">
                        <select
                          value={item.size_code}
                          onChange={(e) => handleItemChange(index, 'size_code', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg sm:rounded-xl bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          {CYLINDER_SIZES.map((sz) => (
                            <option key={sz.code} value={sz.code}>
                              {sz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="w-20 sm:w-28 space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg sm:rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div className="w-full space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Usage Notes</span>
                    <input
                      type="text"
                      placeholder="e.g. Ward 3B, ambulance refill..."
                      value={item.usage_notes}
                      onChange={(e) => handleItemChange(index, 'usage_notes', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg sm:rounded-xl bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-rose-50 transition-all focus:outline-none border border-transparent hover:border-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Remarks / Remarks
            </label>
            <textarea
              placeholder="Enter additional remarks or justification..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Current User Info Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs text-slate-600 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded by Officer (Issuer)</span>
                <span className="font-extrabold text-slate-800 text-xs block mt-0.5">{currentUser?.full_name || 'Loading user...'}</span>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] uppercase">
              {currentUser?.jawatan || 'Officer'}
            </span>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-t border-slate-200/80 flex justify-end gap-3 bg-white relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
          >
            {isSubmitting ? 'Submitting...' : 'Issue Cylinders'}
          </button>
        </div>
      </div>
    </div>
  );
};
