'use client';

import { useState } from 'react';
import UnitItemModal, { UnitDetails } from '@/components/UnitItemModal';

export default function UnitCatalogListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState<UnitDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for unit catalog list
  const unitCatalogData = [
    {
      id: 'UC-001',
      unitName: 'Main Store',
      unitCode: 'MS001',
      location: 'Ground Floor, Building A',
      responsiblePerson: 'Dr. Ahmad Rahman',
      contactNumber: '+60 12-345-6789',
      status: 'Active',
      lastUpdated: '2024-01-15',
      itemsCount: 1250
    },
    {
      id: 'UC-002',
      unitName: 'Operating Theater',
      unitCode: 'OT001',
      location: '2nd Floor, Building B',
      responsiblePerson: 'Nurse Lisa Chen',
      contactNumber: '+60 12-345-6790',
      status: 'Active',
      lastUpdated: '2024-01-14',
      itemsCount: 890
    },
    {
      id: 'UC-003',
      unitName: 'Emergency Department',
      unitCode: 'ED001',
      location: '1st Floor, Building A',
      responsiblePerson: 'Dr. Lim Wei Ming',
      contactNumber: '+60 12-345-6791',
      status: 'Active',
      lastUpdated: '2024-01-13',
      itemsCount: 675
    },
    {
      id: 'UC-004',
      unitName: 'ICU',
      unitCode: 'ICU001',
      location: '3rd Floor, Building B',
      responsiblePerson: 'Dr. Sarah Lee',
      contactNumber: '+60 12-345-6792',
      status: 'Active',
      lastUpdated: '2024-01-12',
      itemsCount: 420
    },
    {
      id: 'UC-005',
      unitName: 'Pediatric Ward',
      unitCode: 'PW001',
      location: '4th Floor, Building A',
      responsiblePerson: 'Nurse Ahmad Hassan',
      contactNumber: '+60 12-345-6793',
      status: 'Inactive',
      lastUpdated: '2024-01-10',
      itemsCount: 320
    }
  ];

  const filteredData = unitCatalogData.filter(unit => {
    const matchesSearch = unit.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || unit.status.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUnitClick = (unit: any) => {
    const unitDetails: UnitDetails = {
      id: unit.id,
      unitName: unit.unitName,
      unitCode: unit.unitCode,
      location: unit.location,
      responsiblePerson: unit.responsiblePerson,
      contactNumber: unit.contactNumber,
      status: unit.status,
      lastUpdated: unit.lastUpdated,
      itemsCount: unit.itemsCount
    };
    setSelectedUnit(unitDetails);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUnit(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unit Catalog List</h1>
          <p className="text-slate-600">Manage and maintain unit catalog information across the hospital</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Units</label>
              <input
                type="text"
                placeholder="Search by unit name, code, or responsible person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Add New Unit
              </button>
            </div>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Unit Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Responsible Person</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Items Count</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Last Updated</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((unit) => (
                  <tr 
                    key={unit.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 cursor-pointer"
                    onClick={() => handleUnitClick(unit)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{unit.unitName}</div>
                        <div className="text-sm text-slate-500">{unit.unitCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{unit.location}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{unit.responsiblePerson}</div>
                        <div className="text-sm text-slate-500">{unit.contactNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        unit.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{unit.itemsCount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{unit.lastUpdated}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(unit);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Items
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-slate-900">{unitCatalogData.length}</div>
            <div className="text-sm text-slate-600">Total Units</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-green-600">
              {unitCatalogData.filter(u => u.status === 'Active').length}
            </div>
            <div className="text-sm text-slate-600">Active Units</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-red-600">
              {unitCatalogData.filter(u => u.status === 'Inactive').length}
            </div>
            <div className="text-sm text-slate-600">Inactive Units</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-blue-600">
              {unitCatalogData.reduce((sum, unit) => sum + unit.itemsCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Total Items</div>
          </div>
        </div>

        {/* Unit Items Modal */}
        <UnitItemModal
          isOpen={isModalOpen}
          onClose={closeModal}
          unit={selectedUnit}
        />
      </div>
    </div>
  );
}
