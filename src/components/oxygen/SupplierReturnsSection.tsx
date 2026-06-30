import React, { useState } from 'react';
import { Plus, Printer, FileText, Truck, FileCheck } from 'lucide-react';
import type { OxygenReturnDocumentWithRelations, OxygenRequestDocumentWithRelations } from '@/types/pharmacy';

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
}) => {
  const [localSubTab, setLocalSubTab] = useState<'returns' | 'requests'>('returns');
  const subTab = propSubTab !== undefined ? propSubTab : localSubTab;
  const setSubTab = onSubTabChange !== undefined ? onSubTabChange : setLocalSubTab;

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
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 inline-flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          {doc.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                          <div className="text-xs text-slate-600 font-semibold">
                            {new Date(doc.returned_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cylinders Returned</span>
                          <div className="text-xs font-bold text-slate-850">{itemsCount}</div>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</span>
                        <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {doc.supplier?.company_name || 'Linde Malaysia'}
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => onPrintClick(doc.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm transition-all duration-300"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Document</span>
                        </button>
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
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 inline-flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => onPrintClick(doc.id)}
                              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-2xl bg-white/40 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm transition-all duration-300"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Document</span>
                            </button>
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 inline-flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          {doc.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                          <div className="text-xs text-slate-600 font-semibold">
                            {new Date(doc.requested_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cylinders Requested</span>
                          <div className="text-xs font-bold text-slate-850">{totalQty}</div>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</span>
                        <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {doc.supplier?.company_name || 'Linde Malaysia'}
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => onPrintRequestClick(doc.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition-all duration-300"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Document</span>
                        </button>
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
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 inline-flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => onPrintRequestClick(doc.id)}
                              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-2xl bg-white/40 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition-all duration-300"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Document</span>
                            </button>
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
    </div>
  );
};
