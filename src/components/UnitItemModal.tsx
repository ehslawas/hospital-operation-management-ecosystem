// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';

export interface UnitItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: 'Drug' | 'Non-drug';
  currentStock: number;
  maxRequestQuantity: number;
  minRequestQuantity: number;
  unit: string;
  isActive: boolean;
  lastRequested?: string;
  description?: string;
}

export interface UnitDetails {
  id: string;
  unitName: string;
  unitCode: string;
  location: string;
  responsiblePerson: string;
  contactNumber: string;
  status: string;
  lastUpdated: string;
  itemsCount: number;
}

interface UnitItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitDetails | null;
}

export default function UnitItemModal({ isOpen, onClose, unit }: UnitItemModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Drug' | 'Non-drug'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<UnitItem | null>(null);
  const [editForm, setEditForm] = useState({
    itemName: '',
    itemCode: '',
    maxRequestQuantity: 0,
    minRequestQuantity: 0,
    unit: '',
    description: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for unit items
  const generateUnitItems = (unitId: string): UnitItem[] => {
    const drugItems = [
      { name: 'Paracetamol 500mg', code: 'DRG-001', category: 'Drug' as const },
      { name: 'Ibuprofen 400mg', code: 'DRG-002', category: 'Drug' as const },
      { name: 'Amoxicillin 250mg', code: 'DRG-003', category: 'Drug' as const },
      { name: 'Metformin 500mg', code: 'DRG-004', category: 'Drug' as const },
      { name: 'Aspirin 100mg', code: 'DRG-005', category: 'Drug' as const },
      { name: 'Insulin Glargine', code: 'DRG-006', category: 'Drug' as const },
      { name: 'Morphine 10mg', code: 'DRG-007', category: 'Drug' as const },
      { name: 'Furosemide 40mg', code: 'DRG-008', category: 'Drug' as const },
    ];

    const nonDrugItems = [
      { name: 'Surgical Gloves', code: 'NDG-001', category: 'Non-drug' as const },
      { name: 'Syringe 5ml', code: 'NDG-002', category: 'Non-drug' as const },
      { name: 'Bandage Roll', code: 'NDG-003', category: 'Non-drug' as const },
      { name: 'Gauze Pads', code: 'NDG-004', category: 'Non-drug' as const },
      { name: 'Alcohol Swabs', code: 'NDG-005', category: 'Non-drug' as const },
      { name: 'IV Drip Set', code: 'NDG-006', category: 'Non-drug' as const },
      { name: 'Thermometer', code: 'NDG-007', category: 'Non-drug' as const },
      { name: 'Blood Pressure Cuff', code: 'NDG-008', category: 'Non-drug' as const },
    ];

    const allItems = [...drugItems, ...nonDrugItems];
    
    return allItems.map((item, index) => ({
      id: `${unitId}-${item.code}`,
      itemName: item.name,
      itemCode: item.code,
      category: item.category,
      currentStock: Math.floor(Math.random() * 1000) + 100,
      maxRequestQuantity: Math.floor(Math.random() * 50) + 10,
      minRequestQuantity: Math.floor(Math.random() * 5) + 1,
      unit: item.category === 'Drug' ? 'tablets' : 'pieces',
      isActive: Math.random() > 0.2, // 80% active
      lastRequested: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      description: `${item.category} item for ${unit?.unitName || 'unit'} operations`
    }));
  };

  const [unitItems, setUnitItems] = useState<UnitItem[]>([]);

  useEffect(() => {
    if (unit) {
      setUnitItems(generateUnitItems(unit.id));
    }
  }, [unit]);

  const toggleItemStatus = (itemId: string) => {
    setUnitItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, isActive: !item.isActive }
          : item
      )
    );
  };

  const startEdit = (item: UnitItem) => {
    console.log('Starting edit for item:', item);
    setEditingItem(item);
    setEditForm({
      itemName: item.itemName,
      itemCode: item.itemCode,
      maxRequestQuantity: item.maxRequestQuantity,
      minRequestQuantity: item.minRequestQuantity,
      unit: item.unit,
      description: item.description || ''
    });
  };

  const saveEdit = () => {
    console.log('Saving edit for item:', editingItem, 'with form data:', editForm);
    if (editingItem) {
      setUnitItems(prev => 
        prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                itemName: editForm.itemName,
                itemCode: editForm.itemCode,
                maxRequestQuantity: editForm.maxRequestQuantity,
                minRequestQuantity: editForm.minRequestQuantity,
                unit: editForm.unit,
                description: editForm.description
              }
            : item
        )
      );
      setEditingItem(null);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      itemName: '',
      itemCode: '',
      maxRequestQuantity: 0,
      minRequestQuantity: 0,
      unit: '',
      description: ''
    });
  };

  const filteredItems = unitItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && item.isActive) ||
                         (activeFilter === 'inactive' && !item.isActive);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesActive && matchesCategory;
  });

  if (!mounted || !isOpen || !unit) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Unit Items - {unit.unitName}</h2>
                <p className="text-blue-100 text-sm">Manage requestable items for {unit.unitCode}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Unit Info */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                <p className="text-slate-900">{unit.location}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Responsible Person</label>
                <p className="text-slate-900">{unit.responsiblePerson}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact</label>
                <p className="text-slate-900">{unit.contactNumber}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-white border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Search Items</label>
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Drug">Drug</option>
                  <option value="Non-drug">Non-drug</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200">
                  Add New Item
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item Details</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Request Limits</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Last Requested</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.itemName}</div>
                        <div className="text-sm text-slate-500">{item.itemCode}</div>
                        <div className="text-xs text-slate-400">{item.unit}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.category === 'Drug' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-700">
                          Min: {item.minRequestQuantity} {item.unit}
                        </div>
                        <div className="text-sm text-slate-700">
                          Max: {item.maxRequestQuantity} {item.unit}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleItemStatus(item.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            item.isActive ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${
                          item.isActive ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.lastRequested || 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => startEdit(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{unitItems.length}</div>
                <div className="text-sm text-slate-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {unitItems.filter(item => item.isActive).length}
                </div>
                <div className="text-sm text-slate-600">Active Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {unitItems.filter(item => !item.isActive).length}
                </div>
                <div className="text-sm text-slate-600">Inactive Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {unitItems.filter(item => item.category === 'Drug').length}
                </div>
                <div className="text-sm text-slate-600">Drug Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelEdit}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Edit Item - {editingItem.itemName}</h3>
                    <button
                      onClick={cancelEdit}
                      className="text-white hover:text-blue-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
                      <input
                        type="text"
                        value={editForm.itemName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, itemName: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Item Code</label>
                      <input
                        type="text"
                        value={editForm.itemCode}
                        onChange={(e) => setEditForm(prev => ({ ...prev, itemCode: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Min Request Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.minRequestQuantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, minRequestQuantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Max Request Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.maxRequestQuantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxRequestQuantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                      <select
                        value={editForm.unit}
                        onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="tablets">Tablets</option>
                        <option value="pieces">Pieces</option>
                        <option value="vials">Vials</option>
                        <option value="bottles">Bottles</option>
                        <option value="boxes">Boxes</option>
                        <option value="packs">Packs</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter item description..."
                    />
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
