'use client';

import { useState, useEffect } from 'react';
import type { DrugItem } from '../types/DrugItem';

interface DrugEditModalProps {
  drug: DrugItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDrug: DrugItem) => void;
}

export default function DrugEditModal({ drug, isOpen, onClose, onSave }: DrugEditModalProps) {
  const [formData, setFormData] = useState<Partial<DrugItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (drug) {
      setFormData({
        id: drug.id,
        drugCode: drug.drugCode,
        drugName: drug.drugName,
        dosageForm: drug.dosageForm,
        sku: drug.sku,
        category: drug.category,
        supplier: drug.supplier,
        budgetSource: drug.budgetSource,
        unitPrice: drug.unitPrice,
        stockLevel: drug.stockLevel,
        minLevel: drug.minLevel,
        maxLevel: drug.maxLevel,
        status: drug.status,
        createdAt: drug.createdAt,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }
  }, [drug]);

  const handleInputChange = (field: keyof DrugItem, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.drugCode?.trim()) newErrors.drugCode = 'Drug Code is required';
    if (!formData.drugName?.trim()) newErrors.drugName = 'Drug Name is required';
    if (!formData.dosageForm?.trim()) newErrors.dosageForm = 'Dosage Form is required';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category?.trim()) newErrors.category = 'Category is required';
    if (!formData.supplier?.trim()) newErrors.supplier = 'Supplier is required';
    if (!formData.budgetSource?.trim()) newErrors.budgetSource = 'Budget Source is required';
    
    if (formData.unitPrice !== undefined && formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit Price must be positive';
    }
    if (formData.stockLevel !== undefined && formData.stockLevel < 0) {
      newErrors.stockLevel = 'Stock Level must be positive';
    }
    if (formData.minLevel !== undefined && formData.minLevel < 0) {
      newErrors.minLevel = 'Min Level must be positive';
    }
    if (formData.maxLevel !== undefined && formData.maxLevel < 0) {
      newErrors.maxLevel = 'Max Level must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm() && formData.id) {
      onSave(formData as DrugItem);
      onClose();
    }
  };

  const handleStatusChange = (status: 'Active' | 'Inactive' | 'Discontinued') => {
    setFormData(prev => ({ ...prev, status }));
  };

  if (!isOpen || !drug) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Drug Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Drug Code *</label>
              <input
                type="text"
                value={formData.drugCode || ''}
                onChange={(e) => handleInputChange('drugCode', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.drugCode ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter drug code"
              />
              {errors.drugCode && <p className="text-red-500 text-sm mt-1">{errors.drugCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Drug Name *</label>
              <input
                type="text"
                value={formData.drugName || ''}
                onChange={(e) => handleInputChange('drugName', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.drugName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter drug name"
              />
              {errors.drugName && <p className="text-red-500 text-sm mt-1">{errors.drugName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage Form *</label>
              <select
                value={formData.dosageForm || ''}
                onChange={(e) => handleInputChange('dosageForm', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.dosageForm ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select dosage form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Eye Drops">Eye Drops</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Shampoo">Shampoo</option>
                <option value="Gel">Gel</option>
              </select>
              {errors.dosageForm && <p className="text-red-500 text-sm mt-1">{errors.dosageForm}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SKU/PKU *</label>
              <input
                type="text"
                value={formData.sku || ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.sku ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter SKU/PKU"
              />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.category ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select category</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Pain Management">Pain Management</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
                <option value="Central Nervous System">Central Nervous System</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Hematology">Hematology</option>
                <option value="Urology">Urology</option>
                <option value="Oncology">Oncology</option>
                <option value="Rheumatology">Rheumatology</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
              <select
                value={formData.supplier || ''}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.supplier ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select supplier</option>
                <option value="PharmaCorp Malaysia">PharmaCorp Malaysia</option>
                <option value="MediSupply Sdn Bhd">MediSupply Sdn Bhd</option>
                <option value="BioPharm Solutions">BioPharm Solutions</option>
                <option value="Global Medical">Global Medical</option>
                <option value="Prime Health Corp">Prime Health Corp</option>
                <option value="MediCare Solutions">MediCare Solutions</option>
              </select>
              {errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Source *</label>
              <select
                value={formData.budgetSource || ''}
                onChange={(e) => handleInputChange('budgetSource', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.budgetSource ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select budget source</option>
                <option value="APPL">APPL</option>
                <option value="CC/DP">CC/DP</option>
                <option value="LP">LP</option>
              </select>
              {errors.budgetSource && <p className="text-red-500 text-sm mt-1">{errors.budgetSource}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={() => handleStatusChange('Active')}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={() => handleStatusChange('Inactive')}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Inactive</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Discontinued"
                    checked={formData.status === 'Discontinued'}
                    onChange={() => handleStatusChange('Discontinued')}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Discontinued</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing and Inventory */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice || ''}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.unitPrice ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="0.00"
                />
                {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockLevel || ''}
                  onChange={(e) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.stockLevel ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="0"
                />
                {errors.stockLevel && <p className="text-red-500 text-sm mt-1">{errors.stockLevel}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minLevel || ''}
                  onChange={(e) => handleInputChange('minLevel', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.minLevel ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="0"
                />
                {errors.minLevel && <p className="text-red-500 text-sm mt-1">{errors.minLevel}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxLevel || ''}
                  onChange={(e) => handleInputChange('maxLevel', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.maxLevel ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="0"
                />
                {errors.maxLevel && <p className="text-red-500 text-sm mt-1">{errors.maxLevel}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-3xl flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
