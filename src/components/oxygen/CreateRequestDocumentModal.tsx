// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { X, Calendar, Save, Loader2, Info } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { createRequestDocument } from '@/services/pharmacy/oxygenService';

interface CreateRequestDocumentModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRequestDocumentModal: React.FC<CreateRequestDocumentModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [requestedDate, setRequestedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Items inputs
  const [qtyBN101N, setQtyBN101N] = useState<number>(0);
  const [qtyPI101FWard, setQtyPI101FWard] = useState<number>(0);
  const [qtyPI101FAmbulance, setQtyPI101FAmbulance] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      resetForm();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .eq('status', 'active');
      if (err) throw err;
      if (data) {
        setSuppliers(data);
        // Find Linde Eox to set as default
        const defaultSupplier = data.find(s => s.company_name.toLowerCase().includes('linde'));
        if (defaultSupplier) {
          setSelectedSupplierId(defaultSupplier.id);
        } else if (data.length > 0) {
          setSelectedSupplierId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const resetForm = () => {
    setRequestedDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setQtyBN101N(0);
    setQtyPI101FWard(0);
    setQtyPI101FAmbulance(0);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setError('Sila pilih pembekal.');
      return;
    }

    if (qtyBN101N <= 0 && qtyPI101FWard <= 0 && qtyPI101FAmbulance <= 0) {
      setError('Sila masukkan kuantiti sekurang-kurangnya untuk satu jenis silinder.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items: any[] = [];
      if (qtyBN101N > 0) {
        items.push({
          size_code: '101-N',
          quantity: qtyBN101N,
          usage_notes: 'Bantuan Gas Sewaan (8.0m3)'
        });
      }
      if (qtyPI101FWard > 0) {
        items.push({
          size_code: '101-F',
          quantity: qtyPI101FWard,
          usage_notes: 'ward usage (long Cylinder)'
        });
      }
      if (qtyPI101FAmbulance > 0) {
        items.push({
          size_code: '101-F',
          quantity: qtyPI101FAmbulance,
          usage_notes: 'Ambulance usage (short Cylinder)'
        });
      }

      // Fetch active user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      const res = await createRequestDocument(
        hospitalId,
        selectedSupplierId,
        new Date(requestedDate).toISOString(),
        remarks,
        items,
        userId
      );

      if (res.error) throw new Error(res.error);

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal menghasilkan borang pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm">Create Request Document</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          {/* Supplier and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pembekal</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">-- Pilih Pembekal --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh Pesanan</label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-[11px] text-blue-800 font-semibold leading-relaxed">
              Borang permintaan sewaan gas perubatan ini hanya dibenarkan bagi peranti silinder sewaan berskala **BN (8.0m³)** dan **PI (1.4m³)** sahaja mengikut pekeliling perolehan KKM.
            </span>
          </div>

          {/* Cylinder Items Request */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-1">Cylinder Request Quantities</h4>

            {/* Cylinder 1: BN 101-N */}
            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-800">Loan Oxygen BN (8.0m³)</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Code: 101-N â€¢ Ward / Store General Refill</div>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    value={qtyBN101N || ''}
                    onChange={(e) => setQtyBN101N(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-center font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Cylinder 2: PI 101-F (Ward Usage) */}
            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-800">Loan Oxygen PI (1.4m³) (ward usage) (long Cylinder)</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Code: 101-F â€¢ Ward Usage (Long Cylinder)</div>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    value={qtyPI101FWard || ''}
                    onChange={(e) => setQtyPI101FWard(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-center font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Cylinder 3: PI 101-F (Ambulance Usage) */}
            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-800">Loan Oxygen PI (1.4m³) (Ambulance usage) (short Cylinder)</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Code: 101-F â€¢ Ambulance Usage (Short Cylinder)</div>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    value={qtyPI101FAmbulance || ''}
                    onChange={(e) => setQtyPI101FAmbulance(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-center font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan / Remarks</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Maklumat tambahan jika ada..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menjana...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Hantar Permohonan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
