import React, { useState, useEffect } from 'react';
import { Plus, Printer, FileText, Truck, FileCheck, Edit2, Trash2, X, AlertTriangle, History as HistoryIcon, MoreVertical } from 'lucide-react';
import type { OxygenReturnDocumentWithRelations, OxygenRequestDocumentWithRelations } from '@/types/pharmacy';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import {
  updateReturnDocument,
  deleteReturnDocument,
  updateRequestDocument,
  deleteRequestDocument,
  updateReturnDocumentCylinders,
  getEmptyCylindersInStore,
} from '@/modules/mycylinder/services/oxygenService';

interface SupplierReturnsSectionProps {
  documents: OxygenReturnDocumentWithRelations[];
  requestDocuments?: OxygenRequestDocumentWithRelations[];
  onCreateClick: () => void;
  onCreateRequestClick?: () => void;
  onScanClick: () => void;
  onPrintClick: (docId: string) => void;
  onPrintRequestClick?: (docId: string) => void;
  isViewOnly: boolean;
  subTab?: 'returns' | 'requests';
  onSubTabChange?: (tab: 'returns' | 'requests') => void;
  hideSubTabBar?: boolean;
  onSuccess?: () => void;
}

export const SupplierReturnsSection: React.FC<SupplierReturnsSectionProps> = ({
  documents,
  requestDocuments = [],
  onCreateClick,
  onCreateRequestClick = () => {},
  onScanClick,
  onPrintClick,
  onPrintRequestClick = () => {},
  isViewOnly,
  subTab: propSubTab,
  onSubTabChange,
  hideSubTabBar = false,
  onSuccess,
}) => {
  const [localSubTab, setLocalSubTab] = useState<'returns' | 'requests'>('returns');
  const subTab = propSubTab !== undefined ? propSubTab : localSubTab;
  const setSubTab = onSubTabChange !== undefined ? onSubTabChange : setLocalSubTab;

  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<{ id: string; company_name: string }[]>([]);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docType, setDocType] = useState<'returns' | 'requests'>('returns');

  // Edit form state
  const [editDate, setEditDate] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'completed' | 'cancelled'>('completed');
  const [editRemarks, setEditRemarks] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [emptyCylinders, setEmptyCylinders] = useState<any[]>([]);
  const [supplierCylinders, setSupplierCylinders] = useState<any[]>([]);
  const [selectedCylIdList, setSelectedCylIdList] = useState<string[]>([]);
  const [supplierSizeFilter, setSupplierSizeFilter] = useState<'all' | '101-N' | '101-F'>('101-N');
  const [privateSizeFilter, setPrivateSizeFilter] = useState<string>('');

  // Delete form state
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // History state
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setActiveDropdownId(prev => prev === docId ? null : docId);
  };

  // Load active suppliers list
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data } = await supabase
          .from('suppliers')
          .select('id, company_name')
          .eq('status', 'active');
        if (data) {
          setSuppliers(data);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    void fetchSuppliers();
  }, []);

  const fetchAvailableCylinders = async (hospitalId: string, currentCyls: any[] = []) => {
    try {
      // 1. Fetch empty cylinders in store
      const emptyRes = await getEmptyCylindersInStore(hospitalId);
      if (emptyRes.data) {
        // Filter out loan cylinders (standard only)
        const standardEmpty = emptyRes.data.filter((c: any) => {
          if (c.supplier_tagged) return false;
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

        // Add any standard cylinders currently selected in this document
        const currentStandardCyls = currentCyls.filter((c: any) => {
          if (c.supplier_tagged) return false;
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

        const combinedStandard = [...standardEmpty];
        currentStandardCyls.forEach((c: any) => {
          if (!combinedStandard.some(sc => sc.id === c.id)) {
            combinedStandard.push(c);
          }
        });

        setEmptyCylinders(combinedStandard);
        if (combinedStandard.length > 0) {
          const uniqueSizes = Array.from(new Set(combinedStandard.map((sc: any) => sc.type_info?.type_name || 'Standard')));
          if (uniqueSizes.length > 0) {
            setPrivateSizeFilter(uniqueSizes[0]);
          }
        }
      }

      // 2. Fetch supplier cylinders (loan tags)
      const { isSupabaseConfigured } = await import('@/services/supabase');
      let supCyls: any[] = [];
      if (isSupabaseConfigured()) {
        const { data } = await supabase
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
        supCyls = data || [];
      } else {
        const { mockOxygenCylinders } = await import('@/services/pharmacy/mockData');
        supCyls = mockOxygenCylinders.filter(
          c => c.supplier_tagged === true && (c.status as string) !== 'returned_to_supplier'
        );
      }

      // Add any supplier cylinders currently selected in this document
      const currentSupplierCyls = currentCyls.filter((c: any) => c.supplier_tagged);
      const combinedSupplier = [...supCyls];
      currentSupplierCyls.forEach((c: any) => {
        if (!combinedSupplier.some(sc => sc.id === c.id)) {
          combinedSupplier.push(c);
        }
      });

      setSupplierCylinders(combinedSupplier);
    } catch (err) {
      console.error('Error fetching cylinders for editing:', err);
    }
  };

  const openEditModal = (doc: any, type: 'returns' | 'requests') => {
    setSelectedDoc(doc);
    setDocType(type);
    setEditDate(
      type === 'returns'
        ? new Date(doc.returned_date).toISOString().split('T')[0]
        : new Date(doc.requested_date).toISOString().split('T')[0]
    );
    setEditSupplierId(doc.supplier_id || '');
    setEditStatus(doc.status || 'completed');
    setEditRemarks(doc.remarks || '');
    setEditReason('');

    if (type === 'returns') {
      const items = doc.items || [];
      const currentCyls = items.map((x: any) => x.cylinder).filter(Boolean);
      const cylIds = items.map((x: any) => x.cylinder_id || x.cylinder?.id).filter(Boolean);
      setSelectedCylIdList(cylIds);
      fetchAvailableCylinders(doc.hospital_id, currentCyls);
    } else {
      setSelectedCylIdList([]);
      setEmptyCylinders([]);
      setSupplierCylinders([]);
    }

    setIsEditOpen(true);
  };

  const openDeleteModal = (doc: any, type: 'returns' | 'requests') => {
    setSelectedDoc(doc);
    setDocType(type);
    setDeleteReason('');
    setIsDeleteOpen(true);
  };

  const openHistoryModal = async (doc: any, type: 'returns' | 'requests') => {
    setSelectedDoc(doc);
    setDocType(type);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, full_name, jawatan)
        `)
        .eq('entity_id', doc.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching document history:', error);
      } else {
        let logs = data || [];
        if (logs.length === 0) {
          // Fallback mock history logs for demo/testing
          logs = [
            {
              id: 'mock-hist-1',
              action: 'CREATE_DOCUMENT',
              created_at: doc.created_at || new Date().toISOString(),
              user: doc.creator || { full_name: 'Pharmacy Officer', jawatan: 'Pharmacist' },
              new_values: { remarks: doc.remarks }
            }
          ];
        }
        setHistoryLogs(logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const renderLogChanges = (log: any) => {
    const changes: string[] = [];
    if (log.old_values && log.new_values) {
      const oldVal = log.old_values;
      const newVal = log.new_values;

      if (newVal.returned_date && oldVal.returned_date && newVal.returned_date !== oldVal.returned_date) {
        changes.push(`Date updated from ${new Date(oldVal.returned_date).toLocaleDateString()} to ${new Date(newVal.returned_date).toLocaleDateString()}`);
      }
      if (newVal.requested_date && oldVal.requested_date && newVal.requested_date !== oldVal.requested_date) {
        changes.push(`Requested date updated from ${new Date(oldVal.requested_date).toLocaleDateString()} to ${new Date(newVal.requested_date).toLocaleDateString()}`);
      }
      if (newVal.supplier_id && oldVal.supplier_id && newVal.supplier_id !== oldVal.supplier_id) {
        changes.push(`Supplier updated`);
      }
      if (newVal.status && oldVal.status && newVal.status !== oldVal.status) {
        changes.push(`Status updated from "${oldVal.status}" to "${newVal.status}"`);
      }
      if (newVal.remarks !== undefined && oldVal.remarks !== newVal.remarks) {
        changes.push(`Remarks updated`);
      }
    }
    if (changes.length === 0) return null;
    return (
      <ul className="mt-1.5 pl-4 list-disc text-[11px] text-slate-500 space-y-0.5">
        {changes.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!editReason.trim()) {
      alert('Please enter a reason for this edit.');
      return;
    }
    setIsSaving(true);
    try {
      const updates = {
        returned_date: docType === 'returns' ? new Date(editDate).toISOString() : undefined,
        requested_date: docType === 'requests' ? new Date(editDate).toISOString() : undefined,
        supplier_id: editSupplierId,
        status: editStatus,
        remarks: editRemarks,
      };

      let res;
      if (docType === 'returns') {
        res = await updateReturnDocument(
          selectedDoc.id,
          {
            returned_date: updates.returned_date!,
            supplier_id: updates.supplier_id,
            status: updates.status,
            remarks: updates.remarks,
          },
          editReason,
          user?.id || ''
        );
      } else {
        res = await updateRequestDocument(
          selectedDoc.id,
          {
            requested_date: updates.requested_date!,
            supplier_id: updates.supplier_id,
            status: updates.status,
            remarks: updates.remarks,
          },
          editReason,
          user?.id || ''
        );
      }

      if (res?.error) {
        alert(res.error);
      } else {
        if (docType === 'returns') {
          const cylindersRes = await updateReturnDocumentCylinders(selectedDoc.id, selectedCylIdList);
          if (cylindersRes.error) {
            alert(`Document details updated, but failed to update cylinders: ${cylindersRes.error}`);
          }
        }
        setIsEditOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!deleteReason.trim()) {
      alert('Please enter a reason for this deletion.');
      return;
    }
    setIsDeleting(true);
    try {
      let res;
      if (docType === 'returns') {
        res = await deleteReturnDocument(selectedDoc.id, deleteReason, user?.id || '');
      } else {
        res = await deleteRequestDocument(selectedDoc.id, deleteReason, user?.id || '');
      }

      if (res?.error) {
        alert(res.error);
      } else {
        setIsDeleteOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs selector */}
      {!hideSubTabBar && (
        <div className="flex bg-slate-100/60 backdrop-blur-md p-1 rounded-2xl max-w-xs border border-slate-200">
          <button
            onClick={() => setSubTab('returns')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              subTab === 'returns'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Returns
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              subTab === 'requests'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Requests
          </button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border ${
            subTab === 'returns' 
              ? 'bg-rose-500/10 border-rose-500/20' 
              : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            {subTab === 'returns' ? (
              <Truck className="w-6 h-6 text-rose-600" />
            ) : (
              <FileCheck className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {subTab === 'returns' ? 'Supplier Returns' : 'Supplier Requests'}
            </h3>
            <p className="text-slate-500 text-xs font-semibold">
              {subTab === 'returns' 
                ? 'Return documents sent to medical oxygen suppliers' 
                : 'Cylinder request documents sent to medical oxygen suppliers'}
            </p>
          </div>
        </div>

        {subTab === 'returns' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onScanClick}
              disabled={isViewOnly}
              title={isViewOnly ? 'View-only for Office Admin' : undefined}
              className={`group px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] sm:hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 ${
                isViewOnly ? 'opacity-60 grayscale cursor-not-allowed hover:scale-100 hover:shadow-md' : ''
              }`}
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Scan Empty Cylinder</span>
            </button>
            <button
              onClick={onCreateClick}
              disabled={isViewOnly}
              title={isViewOnly ? 'View-only for Office Admin' : undefined}
              className={`group px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] sm:hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 border border-rose-400/20 ${
                isViewOnly ? 'opacity-60 grayscale cursor-not-allowed hover:scale-100 hover:shadow-lg' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Return Document</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onCreateRequestClick}
            disabled={isViewOnly}
            title={isViewOnly ? 'View-only for Office Admin' : undefined}
            className={`group w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] sm:hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 border border-blue-400/20 ${
              isViewOnly ? 'opacity-60 grayscale cursor-not-allowed hover:scale-100 hover:shadow-lg' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Request Document</span>
          </button>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl shadow-xl overflow-hidden">
        {subTab === 'returns' ? (
          <>
            {/* Mobile View: Cards Layout */}
            <div className="block md:hidden divide-y divide-slate-200/40 text-slate-700 font-medium">
              {documents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold">
                  No return documents found. Create one to get started.
                </div>
              ) : (
                documents.map((doc) => {
                  const itemsCount = doc.items?.length || 0;
                  return (
                    <div key={doc.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Document #</span>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                            <FileText className="w-4 h-4 text-rose-500" />
                            {doc.document_number}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 relative">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center ${
                            doc.status === 'completed' 
                              ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200/50' 
                              : doc.status === 'cancelled'
                              ? 'bg-red-100/60 text-red-800 border-red-200/50'
                              : 'bg-amber-100/60 text-amber-800 border-amber-200/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              doc.status === 'completed' ? 'bg-emerald-500' : doc.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            {doc.status}
                          </span>
                          <button
                            onClick={(e) => toggleDropdown(e, doc.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                          
                          {activeDropdownId === doc.id && (
                            <div 
                              className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-2xl p-1 z-30 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 text-left font-semibold text-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  onPrintClick(doc.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-400" />
                                Print Document
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openHistoryModal(doc, 'returns');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                              >
                                <HistoryIcon className="w-3.5 h-3.5 text-slate-400" />
                                View History
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openEditModal(doc, 'returns');
                                }}
                                disabled={isViewOnly}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                Edit Document
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openDeleteModal(doc, 'returns');
                                }}
                                disabled={isViewOnly}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-650 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                Delete Document
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Standard Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 bg-slate-50/20 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">Return Document #</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6 text-center">Cylinders Returned</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 text-slate-700 font-medium">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        No return documents found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => {
                      const itemsCount = doc.items?.length || 0;
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-white/25 transition-colors duration-200"
                        >
                          <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-500" />
                            {doc.document_number}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {new Date(doc.returned_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-6">
                            {doc.supplier?.company_name || 'Linde Malaysia'}
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-800">
                            {itemsCount}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center ${
                              doc.status === 'completed' 
                                ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200/50' 
                                : doc.status === 'cancelled'
                                ? 'bg-red-100/60 text-red-800 border-red-200/50'
                                : 'bg-amber-100/60 text-amber-800 border-amber-200/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                doc.status === 'completed' ? 'bg-emerald-500' : doc.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right relative">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={(e) => toggleDropdown(e, doc.id)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-500" />
                              </button>
                              
                              {activeDropdownId === doc.id && (
                                <div 
                                  className="absolute right-6 top-12 bg-white/95 border border-slate-200/60 backdrop-blur-md shadow-xl rounded-2xl p-1 z-30 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 text-left font-semibold text-slate-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      onPrintClick(doc.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-405" />
                                    Print Document
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openHistoryModal(doc, 'returns');
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                                  >
                                    <HistoryIcon className="w-3.5 h-3.5 text-slate-405" />
                                    View History
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openEditModal(doc, 'returns');
                                    }}
                                    disabled={isViewOnly}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-405" />
                                    Edit Document
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openDeleteModal(doc, 'returns');
                                    }}
                                    disabled={isViewOnly}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-650 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-405" />
                                    Delete Document
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Mobile View: Cards Layout */}
            <div className="block md:hidden divide-y divide-slate-200/40 text-slate-700 font-medium">
              {requestDocuments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold">
                  No request documents found. Create one to get started.
                </div>
              ) : (
                requestDocuments.map((doc) => {
                  const totalQty = doc.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  return (
                    <div key={doc.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Request Document #</span>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                            <FileText className="w-4 h-4 text-blue-500" />
                            {doc.document_number}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 relative">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center ${
                            doc.status === 'completed' 
                              ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200/50' 
                              : doc.status === 'cancelled'
                              ? 'bg-red-100/60 text-red-800 border-red-200/50'
                              : 'bg-amber-100/60 text-amber-800 border-amber-200/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              doc.status === 'completed' ? 'bg-emerald-500' : doc.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            {doc.status}
                          </span>
                          <button
                            onClick={(e) => toggleDropdown(e, doc.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                          
                          {activeDropdownId === doc.id && (
                            <div 
                              className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-2xl p-1 z-30 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 text-left font-semibold text-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  onPrintRequestClick(doc.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-400" />
                                Print Document
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openHistoryModal(doc, 'requests');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                              >
                                <HistoryIcon className="w-3.5 h-3.5 text-slate-400" />
                                View History
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openEditModal(doc, 'requests');
                                }}
                                disabled={isViewOnly}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                Edit Document
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openDeleteModal(doc, 'requests');
                                }}
                                disabled={isViewOnly}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-650 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                Delete Document
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Standard Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 bg-slate-50/20 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">Request Document #</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6 text-center">Cylinders Requested</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 text-slate-700 font-medium">
                  {requestDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        No request documents found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    requestDocuments.map((doc) => {
                      const totalQty = doc.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-white/25 transition-colors duration-200"
                        >
                          <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            {doc.document_number}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {new Date(doc.requested_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-6">
                            {doc.supplier?.company_name || 'Linde Malaysia'}
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-800">
                            {totalQty}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center ${
                              doc.status === 'completed' 
                                ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200/50' 
                                : doc.status === 'cancelled'
                                ? 'bg-red-100/60 text-red-800 border-red-200/50'
                                : 'bg-amber-100/60 text-amber-800 border-amber-200/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                doc.status === 'completed' ? 'bg-emerald-500' : doc.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right relative">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={(e) => toggleDropdown(e, doc.id)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-500" />
                              </button>
                              
                              {activeDropdownId === doc.id && (
                                <div 
                                  className="absolute right-6 top-12 bg-white/95 border border-slate-200/60 backdrop-blur-md shadow-xl rounded-2xl p-1 z-30 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 text-left font-semibold text-slate-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      onPrintRequestClick(doc.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-405" />
                                    Print Document
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openHistoryModal(doc, 'requests');
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150"
                                  >
                                    <HistoryIcon className="w-3.5 h-3.5 text-slate-405" />
                                    View History
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openEditModal(doc, 'requests');
                                    }}
                                    disabled={isViewOnly}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-405" />
                                    Edit Document
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      openDeleteModal(doc, 'requests');
                                    }}
                                    disabled={isViewOnly}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-650 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-405" />
                                    Delete Document
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Document Side Drawer */}
      <div 
        onClick={() => setIsEditOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isEditOpen && selectedDoc ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200 ${
          isEditOpen && selectedDoc ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedDoc && (
          <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Edit Document
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold font-mono">
                    {selectedDoc.document_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                    Document Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                    Document Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none"
                  >
                    <option value="draft">draft</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Supplier
                </label>
                <select
                  required
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Remarks / Internal Notes
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none h-20 resize-none"
                  placeholder="Additional remarks..."
                />
              </div>

              {docType === 'returns' && (
                <div className="space-y-4">
                  {/* Standard Cylinders */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                        Standard / Hospital Owned Cylinders (Private Cylinders)
                      </label>
                      {(() => {
                        const uniqueSizes = Array.from(new Set(emptyCylinders.map((sc: any) => sc.type_info?.type_name || 'Standard')));
                        if (uniqueSizes.length === 0) return null;
                        return (
                          <div className="flex flex-wrap bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold uppercase gap-0.5">
                            {uniqueSizes.map((sizeName) => {
                              const count = emptyCylinders.filter(c => (c.type_info?.type_name || 'Standard') === sizeName).length;
                              const isSelected = privateSizeFilter === sizeName;
                              return (
                                <button
                                  key={sizeName}
                                  type="button"
                                  onClick={() => setPrivateSizeFilter(sizeName)}
                                  className={`px-2 py-0.5 rounded-md transition-all ${
                                    isSelected
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/40'
                                  }`}
                                >
                                  {sizeName} ({count})
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    {(() => {
                      const displayedCyls = emptyCylinders.filter(
                        c => !privateSizeFilter || (c.type_info?.type_name || 'Standard') === privateSizeFilter
                      );
                      if (displayedCyls.length === 0) {
                        return (
                          <p className="text-[11px] text-slate-400 font-semibold italic text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl">
                            Select a size above to display available cylinders.
                          </p>
                        );
                      }
                      return (
                        <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {displayedCyls.map((cyl) => {
                            const isSelected = selectedCylIdList.includes(cyl.id);
                            return (
                              <label
                                key={cyl.id}
                                className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer transition-all select-none hover:bg-slate-100/50 ${
                                  isSelected
                                    ? 'border-rose-400 bg-rose-50/20 text-rose-800 ring-2 ring-rose-500/5'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedCylIdList(selectedCylIdList.filter(id => id !== cyl.id));
                                    } else {
                                      setSelectedCylIdList([...selectedCylIdList, cyl.id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-rose-600 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-mono font-bold truncate leading-none mb-0.5">{cyl.serial_number}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold leading-none">{cyl.type_info?.type_name || 'Standard'}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Supplier-Tagged Loan Cylinders */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                        Supplier Tagged Loan Cylinders
                      </label>
                      
                      {/* Filter pills */}
                      {(() => {
                        const supplierSizes = Array.from(new Set(supplierCylinders.map(c => c.size_info?.code).filter(Boolean))) as string[];
                        if (supplierSizes.length === 0) return null;
                        return (
                          <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold uppercase gap-0.5">
                            {supplierSizes.map((filterVal) => {
                              const count = supplierCylinders.filter(c => c.size_info?.code === filterVal).length;
                              const isSelected = supplierSizeFilter === filterVal;
                              return (
                                <button
                                  key={filterVal}
                                  type="button"
                                  onClick={() => setSupplierSizeFilter(filterVal as any)}
                                  className={`px-2 py-0.5 rounded-md transition-all ${
                                    isSelected
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/40'
                                  }`}
                                >
                                  {filterVal} ({count})
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const displayedCyls = supplierCylinders.filter(c => !supplierSizeFilter || supplierSizeFilter === 'all' || c.size_info?.code === supplierSizeFilter);
                      if (displayedCyls.length === 0) {
                        return (
                          <p className="text-[11px] text-slate-400 font-semibold italic text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl">
                            Select a size above to display loan cylinders.
                          </p>
                        );
                      }
                      return (
                        <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {displayedCyls.map((cyl) => {
                            const isSelected = selectedCylIdList.includes(cyl.id);
                            return (
                              <label
                                key={cyl.id}
                                className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer transition-all select-none hover:bg-slate-100/50 ${
                                  isSelected
                                    ? 'border-rose-400 bg-rose-50/20 text-rose-800 ring-2 ring-rose-500/5'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedCylIdList(selectedCylIdList.filter(id => id !== cyl.id));
                                    } else {
                                      setSelectedCylIdList([...selectedCylIdList, cyl.id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-rose-600 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-mono font-bold truncate leading-none mb-0.5">{cyl.serial_number}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold leading-none">{cyl.size_info?.code || '101-N'}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 space-y-2">
                <label className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Reason for Edit (Required for Audit Log)
                </label>
                <textarea
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-white border border-amber-250 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none h-16 resize-none"
                  placeholder="Specify details or reason for editing this document..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editReason.trim()}
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-all duration-200"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Document Modal */}
      {isDeleteOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Delete Document
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold font-mono">
                    {selectedDoc.document_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteConfirm} className="p-5 space-y-4">
              <div className="text-sm text-slate-600 font-medium leading-relaxed">
                Are you sure you want to permanently delete this {docType === 'returns' ? 'return' : 'request'} document? This action cannot be undone.
              </div>

              <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4 space-y-2">
                <label className="block text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Reason for Deletion (Required for Audit Log)
                </label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-white border border-red-250 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl px-3 py-2 text-sm text-slate-800 transition-all duration-200 outline-none h-20 resize-none"
                  placeholder="Specify the reason for deleting this document..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deleteReason.trim()}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-650 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-all duration-200"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <HistoryIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Document Audit History
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold font-mono">
                    {selectedDoc.document_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-450 font-bold">Loading audit logs...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-semibold">
                  No log history recorded for this document.
                </div>
              ) : (
                <div className="relative border-l border-slate-100 pl-6 space-y-6">
                  {historyLogs.map((log, idx) => {
                    const isEdit = log.action.includes('EDIT');
                    const isDelete = log.action.includes('DELETE');
                    const isCreate = log.action.includes('CREATE') || log.action === 'CREATE_DOCUMENT';

                    let actionLabel = 'Action Logged';
                    let badgeColor = 'bg-slate-50 text-slate-700 border-slate-100';
                    if (isEdit) {
                      actionLabel = 'Document Edited';
                      badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    } else if (isDelete) {
                      actionLabel = 'Document Deleted';
                      badgeColor = 'bg-red-50 text-red-700 border-red-100';
                    } else if (isCreate) {
                      actionLabel = 'Document Created';
                      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    }

                    const reasonText = log.new_values?.edit_reason || log.new_values?.delete_reason || log.new_values?.reason || log.remarks;

                    return (
                      <div key={log.id || idx} className="relative">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                          isDelete ? 'border-red-500' : isEdit ? 'border-amber-500' : 'border-emerald-500'
                        }`} />
                        
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {log.user?.full_name || 'System / Officer'}
                            </span>
                            {log.user?.jawatan && (
                              <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {log.user.jawatan}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium ml-auto">
                              {new Date(log.created_at).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {actionLabel}
                            </span>
                          </div>

                          {reasonText && (
                            <p className="text-xs text-slate-650 bg-slate-50 border border-slate-100 rounded-xl p-2.5 mt-1.5 leading-relaxed font-semibold italic">
                              &ldquo;{reasonText}&rdquo;
                            </p>
                          )}

                          {renderLogChanges(log)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end p-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

