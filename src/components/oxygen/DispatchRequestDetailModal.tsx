// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Play, Ban, Receipt, Check, FileText, ChevronRight, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import type { CylinderDispatchRequestWithRelations } from '@/types/pharmacy';
import type { User as UserType } from '@/types';

interface DispatchRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CylinderDispatchRequestWithRelations | null;
  currentUser: UserType | null;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onIssue: (
    requestId: string,
    items: { id: string; quantity_issued: number; cylinder_id?: string }[]
  ) => Promise<void>;
  onComplete: (requestId: string) => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
}

export const DispatchRequestDetailModal: React.FC<DispatchRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onApprove,
  onReject,
  onIssue,
  onComplete,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueData, setIssueData] = useState<{ [itemId: string]: { qty: number; cylinderId: string } }>({});
  const [availableCylinders, setAvailableCylinders] = useState<{ [sizeCode: string]: any[] }>({});
  const [error, setError] = useState<string | null>(null);

  // Load available cylinders when issuing
  useEffect(() => {
    if (isOpen && request && isIssuing && isSupabaseConfigured()) {
      const fetchCylinders = async () => {
        try {
          // Get unique size codes requested
          const sizeCodes = Array.from(new Set((request.items || []).map((itm) => itm.size_code)));
          const cylindersMap: { [sizeCode: string]: any[] } = {};

          for (const size of sizeCodes) {
            // Fetch available cylinders matching this size code
            const { data, error } = await supabase
              .from('pharmacy_oxygen_cylinder_inventory')
              .select('id, serial_number, qr_code, cylinder_size_id')
              .eq('status', 'available')
              .ilike('cylinder_size_id', `%${size.replace('101-', '')}%`); // Match sizes loosely e.g. BN, F

            if (!error && data) {
              cylindersMap[size] = data;
            } else {
              cylindersMap[size] = [];
            }
          }
          setAvailableCylinders(cylindersMap);

          // Initialize issue quantity data
          const initialData: { [itemId: string]: { qty: number; cylinderId: string } } = {};
          (request.items || []).forEach((itm) => {
            initialData[itm.id] = {
              qty: itm.quantity_requested,
              cylinderId: '',
            };
          });
          setIssueData(initialData);
        } catch (err) {
          console.error('Error fetching available cylinders:', err);
        }
      };
      fetchCylinders();
    }
  }, [isOpen, request, isIssuing]);

  if (!isOpen || !request) return null;

  const isPharmacyStaff = currentUser?.jawatan?.toLowerCase().includes('farmasi') || 
                          currentUser?.email?.includes('pharmacy') ||
                          currentUser?.jawatan?.toLowerCase().includes('pharmacist');

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onApprove(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onReject(request.id, rejectionReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssue = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const itemsPayload = (request.items || []).map((itm) => {
        const issue = issueData[itm.id] || { qty: itm.quantity_requested, cylinderId: '' };
        return {
          id: itm.id,
          quantity_issued: issue.qty,
          cylinder_id: issue.cylinderId || undefined,
        };
      });

      await onIssue(request.id, itemsPayload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue cylinders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCancel(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { key: 'requested', label: 'Requested', date: request.request_date, done: true },
      {
        key: 'approved',
        label: request.status === 'rejected' ? 'Rejected' : 'Approved',
        date: request.approved_date,
        done: !!request.approved_date || request.status === 'rejected',
        error: request.status === 'rejected',
      },
      {
        key: 'issued',
        label: 'Issued',
        date: request.issued_date,
        done: !!request.issued_date,
      },
      {
        key: 'completed',
        label: 'Completed',
        date: request.completed_date,
        done: !!request.completed_date,
      },
    ];
    return steps;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500 uppercase">
                {request.request_type === 'manual_issue' ? 'Manual Issue' : 'Unit Request'}
              </span>
              <span className="text-slate-300">â€¢</span>
              <span className="font-mono text-sm font-extrabold text-blue-600">
                {request.request_number}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Cylinder Request Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
              {error}
            </div>
          )}

          {/* Timeline Process Map */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Request Lifecycle Status
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {getTimelineSteps().map((step, idx) => (
                <React.Fragment key={step.key}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                        step.error
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : step.done
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {step.done ? (
                        step.error ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{step.label}</div>
                      {step.date && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(step.date).toLocaleDateString('ms-MY')}
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < 3 && (
                    <ChevronRight className="hidden sm:block w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Request Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-slate-200 rounded-2xl text-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Department
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {request.department?.department_name || 'Pharmacy Store'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Priority
              </span>
              <p className="font-semibold text-slate-800 mt-0.5 capitalize">{request.priority}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Requester
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {request.requester?.full_name || 'Manual Issue'}
              </p>
              {request.requester && (
                <span className="text-xs text-slate-400">({request.requester.jawatan})</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Issuer (Pharmacy Officer)
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {request.issuer?.full_name || 'Pending Dispatch'}
              </p>
              {request.issuer && (
                <span className="text-xs text-slate-400">({request.issuer.jawatan})</span>
              )}
            </div>
          </div>

          {/* Remarks / Rejection reasons */}
          {request.remarks && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Remarks
              </span>
              <p className="text-slate-700 mt-1">{request.remarks}</p>
            </div>
          )}

          {request.rejection_reason && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                Reason for Rejection
              </span>
              <p className="text-rose-800 font-semibold mt-1">{request.rejection_reason}</p>
            </div>
          )}

          {/* Items requested vs issued */}
          <div className="space-y-3">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Request Items
            </span>

            {isIssuing ? (
              /* Issuing interface */
              <div className="space-y-4">
                {(request.items || []).map((itm) => (
                  <div
                    key={itm.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Size {itm.size_code}</span>
                      <span className="text-xs text-slate-500">Requested: {itm.quantity_requested}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Issue quantity */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Qty to Issue
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={itm.quantity_requested}
                          value={issueData[itm.id]?.qty || 0}
                          onChange={(e) =>
                            setIssueData({
                              ...issueData,
                              [itm.id]: {
                                ...issueData[itm.id],
                                qty: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700"
                        />
                      </div>

                      {/* Select Cylinder Inventory ID */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Assign Cylinder (Optional)
                        </span>
                        <select
                          value={issueData[itm.id]?.cylinderId || ''}
                          onChange={(e) =>
                            setIssueData({
                              ...issueData,
                              [itm.id]: {
                                ...issueData[itm.id],
                                cylinderId: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700"
                        >
                          <option value="">Do not assign specific cylinder</option>
                          {(availableCylinders[itm.size_code] || []).map((cyl) => (
                            <option key={cyl.id} value={cyl.id}>
                              {cyl.serial_number} ({cyl.qr_code || 'No QR'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Regular display table */
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3">Size Code</th>
                      <th className="px-4 py-3">Qty Requested</th>
                      <th className="px-4 py-3">Qty Issued</th>
                      <th className="px-4 py-3">Usage Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(request.items || []).map((itm) => (
                      <tr key={itm.id} className="hover:bg-slate-50/20">
                        <td className="px-4 py-3 font-semibold">{itm.size_code}</td>
                        <td className="px-4 py-3 font-medium">{itm.quantity_requested}</td>
                        <td className="px-4 py-3 font-medium">
                          {request.status === 'pending' || request.status === 'rejected' ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            itm.quantity_issued
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{itm.usage_notes || 'â€”'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <form onSubmit={handleReject} className="p-4 border border-rose-200 bg-rose-50/20 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider">
                Reason for rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why is this request being rejected?"
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 font-semibold text-xs bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 font-semibold text-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer (Contextual Action Buttons) */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            {request.status === 'pending' && currentUser?.id === request.created_by && !showRejectForm && !isSubmitting && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-sm transition-all focus:outline-none"
              >
                Cancel Request
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all focus:outline-none"
            >
              Close
            </button>

            {/* Pharmacy Approval actions */}
            {isPharmacyStaff && request.status === 'pending' && !showRejectForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-sm transition-all focus:outline-none"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all focus:outline-none"
                >
                  Approve Request
                </button>
              </>
            )}

            {/* Pharmacy Issue/Dispatch actions */}
            {isPharmacyStaff && request.status === 'approved' && !isIssuing && (
              <button
                type="button"
                onClick={() => setIsIssuing(true)}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all focus:outline-none"
              >
                Dispatch Cylinders
              </button>
            )}

            {isIssuing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsIssuing(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-sm transition-all focus:outline-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleIssue}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all focus:outline-none"
                >
                  Confirm Dispatch
                </button>
              </>
            )}

            {/* Ward/Requester acknowledge receipt */}
            {request.status === 'issued' && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all focus:outline-none"
              >
                Acknowledge Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
