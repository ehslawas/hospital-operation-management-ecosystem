import React, { useState } from 'react';
import { Plus, Printer, FileText, Truck, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { OxygenReturnDocumentWithRelations, OxygenRequestDocumentWithRelations } from '@/types/pharmacy';

interface SupplierReturnsSectionProps {
  documents: OxygenReturnDocumentWithRelations[];
  requestDocuments?: OxygenRequestDocumentWithRelations[];
  onCreateClick: () => void;
  onCreateRequestClick?: () => void;
  onPrintClick: (docId: string) => void;
  onPrintRequestClick?: (docId: string) => void;
  isViewOnly: boolean;
  subTab: 'returns' | 'requests';
}

export const SupplierReturnsSection: React.FC<SupplierReturnsSectionProps> = ({
  documents,
  requestDocuments = [],
  onCreateClick,
  onCreateRequestClick = () => {},
  onPrintClick,
  onPrintRequestClick = () => {},
  isViewOnly,
  subTab,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page number when switching tabs
  React.useEffect(() => {
    setCurrentPage(1);
  }, [subTab]);

  // Compute pagination parameters
  const currentCollection = subTab === 'returns' ? documents : requestDocuments;
  const totalItems = currentCollection.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Paginated data slices
  const paginatedDocuments = documents.slice(startIndex, startIndex + itemsPerPage);
  const paginatedRequests = requestDocuments.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">

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
          <button
            onClick={onCreateClick}
            disabled={isViewOnly}
            title={isViewOnly ? 'View-only for Office Admin' : undefined}
            className={`group px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-2 border border-rose-400/20 ${
              isViewOnly ? 'opacity-60 grayscale cursor-not-allowed hover:scale-100 hover:shadow-lg' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Return Document</span>
          </button>
        ) : (
          <button
            onClick={onCreateRequestClick}
            disabled={isViewOnly}
            title={isViewOnly ? 'View-only for Office Admin' : undefined}
            className={`group px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-2 border border-blue-400/20 ${
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
        <div className="overflow-x-auto">
          {subTab === 'returns' ? (
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
                {paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      No return documents found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc) => {
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
          ) : (
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
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      No request documents found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((doc) => {
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
          )}
        </div>

        {/* Premium Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200/50 bg-slate-50/10 backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-800 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="text-slate-800 font-bold">{endIndex}</span> of{' '}
              <span className="text-slate-800 font-bold">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center border ${
                      currentPage === page
                        ? subTab === 'returns'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
