'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Bed,
  Activity,
  UserPlus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Stethoscope,
  ClipboardList,
  Baby,
  Smile,
} from 'lucide-react';

type Ward = 'Neonatal ICU' | 'Paediatric ICU' | 'General Paediatric' | 'Isolation';

export default function PaediatricWardDashboard() {
  const [selectedWard, setSelectedWard] = useState<Ward>('General Paediatric');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for ward statistics
  const wardStats = {
    'Neonatal ICU': { total: 12, occupied: 10, available: 2, critical: 5, stable: 4, improving: 1 },
    'Paediatric ICU': { total: 10, occupied: 8, available: 2, critical: 4, stable: 3, improving: 1 },
    'General Paediatric': { total: 30, occupied: 22, available: 8, critical: 2, stable: 16, improving: 4 },
    'Isolation': { total: 8, occupied: 5, available: 3, critical: 1, stable: 3, improving: 1 },
  };

  // Mock patient data
  const mockPatients = [
    { id: 'PED001', name: 'Muhammad Arif', age: 8, sex: 'M', ward: 'General Paediatric', bed: 'GP-101', diagnosis: 'Bronchopneumonia', status: 'Improving', admissionDate: '2025-10-07', doctor: 'Dr. Salmah', parent: 'Ahmad bin Ali' },
    { id: 'PED002', name: 'Alicia Wong', age: 5, sex: 'F', ward: 'General Paediatric', bed: 'GP-105', diagnosis: 'Viral Fever, URTI', status: 'Stable', admissionDate: '2025-10-09', doctor: 'Dr. Salmah', parent: 'Mary Wong' },
    { id: 'PED003', name: 'Baby Raj', age: 0.1, sex: 'M', ward: 'Neonatal ICU', bed: 'NICU-03', diagnosis: 'Preterm, RDS', status: 'Critical', admissionDate: '2025-10-05', doctor: 'Dr. Kumar', parent: 'Priya Raj' },
    { id: 'PED004', name: 'Aisha Fatimah', age: 3, sex: 'F', ward: 'General Paediatric', bed: 'GP-110', diagnosis: 'Acute Gastroenteritis', status: 'Improving', admissionDate: '2025-10-08', doctor: 'Dr. Salmah', parent: 'Siti Aminah' },
    { id: 'PED005', name: 'Daniel Lim', age: 12, sex: 'M', ward: 'Paediatric ICU', bed: 'PICU-02', diagnosis: 'Status Epilepticus', status: 'Critical', admissionDate: '2025-10-09', doctor: 'Dr. Kumar', parent: 'David Lim' },
    { id: 'PED006', name: 'Sarah binti Omar', age: 7, sex: 'F', ward: 'Isolation', bed: 'ISO-01', diagnosis: 'Dengue Fever with Warning Signs', status: 'Stable', admissionDate: '2025-10-08', doctor: 'Dr. Salmah', parent: 'Fatimah Osman' },
  ];

  const filteredPatients = mockPatients.filter(
    p => p.ward === selectedWard && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.bed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentStats = wardStats[selectedWard];
  const occupancyRate = ((currentStats.occupied / currentStats.total) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Smile className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Paediatric Ward Management</h1>
                <p className="text-slate-600 mt-1">Comprehensive child and infant care system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800">
                <UserPlus className="h-4 w-4" />
                New Admission
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Ward Selection Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ward Sections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['Neonatal ICU', 'Paediatric ICU', 'General Paediatric', 'Isolation'] as Ward[]).map((ward) => {
              const stats = wardStats[ward];
              const rate = ((stats.occupied / stats.total) * 100).toFixed(0);
              const isSelected = selectedWard === ward;
              
              return (
                <button
                  key={ward}
                  onClick={() => setSelectedWard(ward)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-purple-600' : 'bg-slate-200'
                    }`}>
                      <Baby className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold text-sm ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                        {ward}
                      </div>
                      <div className="text-xs text-slate-500">{stats.total} beds</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Occupied:</span>
                      <span className="font-semibold text-slate-900">{stats.occupied}/{stats.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseInt(rate) > 90 ? 'bg-red-500' : parseInt(rate) > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-slate-600">{rate}% occupancy</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Total Beds</span>
                <Bed className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{currentStats.total}</div>
              <div className="text-xs text-slate-600 mt-1">In {selectedWard}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-700">Occupied</span>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">{currentStats.occupied}</div>
              <div className="text-xs text-green-700 mt-1">{occupancyRate}% occupancy</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-700">Available</span>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">{currentStats.available}</div>
              <div className="text-xs text-blue-700 mt-1">Ready for admission</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-700">Critical</span>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-900">{currentStats.critical}</div>
              <div className="text-xs text-red-700 mt-1">Require close monitoring</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-emerald-700">Improving</span>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-900">{currentStats.improving}</div>
              <div className="text-xs text-emerald-700 mt-1">Positive progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Patients in {selectedWard}</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Age/Sex</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Admission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Parent/Guardian</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 text-slate-400 mr-2" />
                          <span className="text-sm font-bold text-slate-900">{patient.bed}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{patient.name}</div>
                        <div className="text-xs text-slate-500">{patient.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {patient.age < 1 ? `${Math.round(patient.age * 365)}d` : `${patient.age}y`} / {patient.sex}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{patient.diagnosis}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                          patient.status === 'Improving' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {patient.admissionDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {patient.doctor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {patient.parent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/paediatric-ward/patient/${patient.id}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <ClipboardList className="h-3 w-3" />
                            View Chart
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium">No patients found</p>
                <p className="text-slate-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


