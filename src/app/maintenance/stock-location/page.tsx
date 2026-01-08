'use client';

import { useState } from 'react';

export default function DrugLocationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data for drug/non-drug item locations
  const drugLocationData = [
    {
      id: 'DL-001',
      itemName: 'Paracetamol 500mg',
      itemCode: 'PAR-500',
      category: 'DRUG',
      section: 'Section A',
      cabinet: 'Cabinet C',
      level: 'Level 3',
      position: 'No 29',
      capacity: 1000,
      currentStock: 750,
      utilizationRate: 75,
      status: 'Active',
      lastAudit: '2024-01-15',
      responsiblePerson: 'Ahmad Rahman'
    },
    {
      id: 'DL-002',
      itemName: 'Ibuprofen 400mg',
      itemCode: 'IBU-400',
      category: 'DRUG',
      section: 'Section A',
      cabinet: 'Cabinet C',
      level: 'Level 2',
      position: 'No 15',
      capacity: 1000,
      currentStock: 920,
      utilizationRate: 92,
      status: 'Active',
      lastAudit: '2024-01-14',
      responsiblePerson: 'Ahmad Rahman'
    },
    {
      id: 'DL-003',
      itemName: 'Gauze Pad 4x4',
      itemCode: 'GAU-4X4',
      category: 'NON_DRUG',
      section: 'Section B',
      cabinet: 'Cabinet A',
      level: 'Level 1',
      position: 'No 8',
      capacity: 500,
      currentStock: 320,
      utilizationRate: 64,
      status: 'Active',
      lastAudit: '2024-01-13',
      responsiblePerson: 'Lisa Chen'
    },
    {
      id: 'DL-004',
      itemName: 'Surgical Gloves',
      itemCode: 'GLO-SURG',
      category: 'NON_DRUG',
      section: 'Section B',
      cabinet: 'Cabinet B',
      level: 'Level 2',
      position: 'No 12',
      capacity: 300,
      currentStock: 280,
      utilizationRate: 93,
      status: 'Active',
      lastAudit: '2024-01-12',
      responsiblePerson: 'Lim Wei Ming'
    },
    {
      id: 'DL-005',
      itemName: 'Amoxicillin 250mg',
      itemCode: 'AMX-250',
      category: 'DRUG',
      section: 'Section C',
      cabinet: 'Cabinet D',
      level: 'Level 4',
      position: 'No 5',
      capacity: 200,
      currentStock: 45,
      utilizationRate: 23,
      status: 'Maintenance',
      lastAudit: '2024-01-10',
      responsiblePerson: 'Sarah Lee'
    },
    {
      id: 'DL-006',
      itemName: 'Syringe 5ml',
      itemCode: 'SYR-5ML',
      category: 'NON_DRUG',
      section: 'Section C',
      cabinet: 'Cabinet E',
      level: 'Level 1',
      position: 'No 3',
      capacity: 150,
      currentStock: 0,
      utilizationRate: 0,
      status: 'Inactive',
      lastAudit: '2024-01-08',
      responsiblePerson: 'Ahmad Hassan'
    },
    {
      id: 'DL-007',
      itemName: 'Metformin 500mg',
      itemCode: 'MET-500',
      category: 'DRUG',
      section: 'Section A',
      cabinet: 'Cabinet A',
      level: 'Level 2',
      position: 'No 18',
      capacity: 800,
      currentStock: 650,
      utilizationRate: 81,
      status: 'Active',
      lastAudit: '2024-01-16',
      responsiblePerson: 'Maria Tan'
    },
    {
      id: 'DL-008',
      itemName: 'Bandage Roll',
      itemCode: 'BAN-ROLL',
      category: 'NON_DRUG',
      section: 'Section B',
      cabinet: 'Cabinet F',
      level: 'Level 3',
      position: 'No 22',
      capacity: 400,
      currentStock: 180,
      utilizationRate: 45,
      status: 'Active',
      lastAudit: '2024-01-14',
      responsiblePerson: 'John Lim'
    }
  ];

  const filteredData = drugLocationData.filter(location => {
    const matchesSearch = location.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.cabinet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'all' || location.section === selectedSection;
    const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || location.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesSection && matchesCategory && matchesStatus;
  });

  const sections = ['all', ...Array.from(new Set(drugLocationData.map(loc => loc.section)))];
  const categories = ['all', ...Array.from(new Set(drugLocationData.map(loc => loc.category)))];
  const statuses = ['all', ...Array.from(new Set(drugLocationData.map(loc => loc.status)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Drug & Non-Drug Location Management</h1>
          <p className="text-slate-600">Monitor and manage item locations with hierarchical structure (Section → Cabinet → Level → Position)</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Items</label>
              <input
                type="text"
                placeholder="Search by item name, code, section, cabinet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Section Filter</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                {sections.map(section => (
                  <option key={section} value={section}>
                    {section === 'all' ? 'All Sections' : section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Add New Location
              </button>
            </div>
          </div>
        </div>

        {/* Drug Locations Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Location Hierarchy</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Capacity & Utilization</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Responsible</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((location) => (
                  <tr key={location.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{location.itemName}</div>
                        <div className="text-sm text-slate-500">{location.itemCode} • {location.category}</div>
                        <div className="text-xs text-slate-400">ID: {location.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900">{location.section}</div>
                        <div className="text-sm text-slate-700">{location.cabinet}</div>
                        <div className="text-sm text-slate-600">{location.level}</div>
                        <div className="text-sm text-slate-500">{location.position}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {location.currentStock.toLocaleString()} / {location.capacity.toLocaleString()}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              location.utilizationRate >= 90 ? 'bg-red-500' :
                              location.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${location.utilizationRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{location.utilizationRate}% utilized</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        location.status === 'Active' ? 'bg-green-100 text-green-800' :
                        location.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {location.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{location.responsiblePerson}</div>
                        <div className="text-sm text-slate-500">Last audit: {location.lastAudit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">Audit</button>
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-slate-900">{drugLocationData.length}</div>
            <div className="text-sm text-slate-600">Total Items</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-blue-600">
              {drugLocationData.filter(l => l.category === 'DRUG').length}
            </div>
            <div className="text-sm text-slate-600">Drug Items</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-green-600">
              {drugLocationData.filter(l => l.category === 'NON_DRUG').length}
            </div>
            <div className="text-sm text-slate-600">Non-Drug Items</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-emerald-600">
              {drugLocationData.filter(l => l.status === 'Active').length}
            </div>
            <div className="text-sm text-slate-600">Active Locations</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-yellow-600">
              {drugLocationData.filter(l => l.status === 'Maintenance').length}
            </div>
            <div className="text-sm text-slate-600">Under Maintenance</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(drugLocationData.reduce((sum, loc) => sum + loc.utilizationRate, 0) / drugLocationData.length)}%
            </div>
            <div className="text-sm text-slate-600">Avg Utilization</div>
          </div>
        </div>
      </div>
    </div>
  );
}
