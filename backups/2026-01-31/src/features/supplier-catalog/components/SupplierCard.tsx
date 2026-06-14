'use client';

import type { Supplier } from '../types/Supplier';

type SupplierCardProps = {
  supplier: Supplier;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplierId: string) => void;
};

export default function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pharmaceutical':
        return 'from-blue-500 to-indigo-600';
      case 'Medical Equipment':
        return 'from-green-500 to-emerald-600';
      case 'Healthcare Services':
        return 'from-purple-500 to-pink-600';
      case 'Laboratory':
        return 'from-amber-500 to-orange-600';
      case 'Surgical':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPhone = (phone: string) => {
    // Format Malaysian phone numbers
    if (phone.startsWith('+60')) {
      return phone.replace('+60', '+60 ').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone;
  };

  return (
    <div 
      className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden cursor-pointer"
      onClick={() => onEdit?.(supplier)}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(supplier.category)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
      
      {/* Content */}
      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Company Logo Placeholder */}
            <div className={`relative group/icon`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(supplier.category)} rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300`}></div>
              <div className={`relative h-16 w-16 bg-gradient-to-br ${getCategoryColor(supplier.category)} rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300`}>
                <span className="text-2xl font-bold text-white">
                  {supplier.companyName.charAt(0)}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 mb-2">
                {supplier.companyName}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(supplier.status)}`}>
                  {supplier.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getCategoryColor(supplier.category)} text-white`}>
                  {supplier.category}
                </span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-1">
                {supplier.rating}
              </span>
            </div>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 mb-6">
          {/* Address */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200 leading-relaxed">
                {supplier.address}
              </p>
            </div>
          </div>

          {/* Email */}
          {supplier.email && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <a
                href={`mailto:${supplier.email}`}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 break-all"
                title={supplier.email}
              >
                {supplier.email}
              </a>
            </div>
          )}

          {/* Phone */}
          {supplier.phone && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <a
                href={`tel:${supplier.phone}`}
                className="text-sm text-green-600 hover:text-green-800 transition-colors duration-200 break-all"
                title={supplier.phone}
              >
                {formatPhone(supplier.phone)}
              </a>
            </div>
          )}

          {/* Website */}
          {supplier.website && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <a
                href={`https://${supplier.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:text-purple-800 transition-colors duration-200 break-all"
                title={supplier.website}
              >
                {supplier.website}
              </a>
            </div>
          )}
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Specialties</h4>
          <div className="flex flex-wrap gap-2">
            {supplier.specialties.map((specialty, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(supplier.category)} text-white`}
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900 truncate">{supplier.totalOrders}</div>
            <div className="text-xs text-gray-500">Total Orders</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-lg font-bold text-gray-900 truncate" title={formatCurrency(supplier.totalValue)}>
              {formatCurrency(supplier.totalValue)}
            </div>
            <div className="text-xs text-gray-500">Total Value</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-sm font-bold text-gray-900 truncate">{supplier.lastContact}</div>
            <div className="text-xs text-gray-500">Last Contact</div>
          </div>
        </div>

        {/* Contact Person */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {supplier.contactPerson ? supplier.contactPerson.split(' ').map(n => n[0]).join('') : 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{supplier.contactPerson || 'Not Available'}</p>
              <p className="text-xs text-gray-600">Contact Person</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 truncate">
            Created: {new Date(supplier.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(supplier);
                }}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                title="Edit supplier"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(supplier.id);
                }}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                title="Delete supplier"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
}
