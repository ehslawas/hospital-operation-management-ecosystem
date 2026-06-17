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
  Heart,
} from 'lucide-react';

type Ward = 'Antenatal' | 'Postnatal' | 'Labour Room' | 'High-Risk Pregnancy';

export default function MaternityWardDashboard() {
  const [selectedWard, setSelectedWard] = useState<Ward>('Antenatal');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for ward statistics
  const wardStats = {
    'Antenatal': { total: 20, occupied: 15, available: 5, critical: 2, stable: 11, improving: 2 },
    'Postnatal': { total: 25, occupied: 18, available: 7, critical: 1, stable: 15, improving: 2 },
    'Labour Room': { total: 8, occupied: 5, available: 3, critical: 3, stable: 2, improving: 0 },
    'High-Risk Pregnancy': { total: 12, occupied: 9, available: 3, critical: 4, stable: 4, improving: 1 },
  };

  // Mock patient data
  const mockPatients = [
    { id: 'M001', name: 'Siti Aminah', age: 28, sex: 'F', ward: 'Antenatal', bed: 'AN-101', diagnosis: 'G2P1, 36 weeks, Normal Pregnancy', status: 'Stable', admissionDate: '2025-10-08', doctor: 'Dr. Nurul' },
    { id: 'M002', name: 'Fatimah binti Ahmad', age: 32, sex: 'F', ward: 'Antenatal', bed: 'AN-105', diagnosis: 'G1P0, 38 weeks, Gestational Diabetes', status: 'Stable', admissionDate: '2025-10-09', doctor: 'Dr. Nurul' },
    { id: 'M003', name: 'Mary Tan', age: 25, sex: 'F', ward: 'Postnatal', bed: 'PN-201', diagnosis: 'P1, Day 2 Post-SVD, Baby Well', status: 'Improving', admissionDate: '2025-10-09', doctor: 'Dr. Nurul' },
    { id: 'M004', name: 'Lisa Wong', age: 30, sex: 'F', ward: 'Postnatal', bed: 'PN-205', diagnosis: 'P1, Day 1 Post-LSCS, Baby in NICU', status: 'Stable', admissionDate: '2025-10-10', doctor: 'Dr. Sarah' },
    { id: 'M005', name: 'Aisha binti Ibrahim', age: 35, sex: 'F', ward: 'Labour Room', bed: 'LR-01', diagnosis: 'G3P2, In Active Labour, 8cm Dilated', status: 'Critical', admissionDate: '2025-10-10', doctor: 'Dr. Nurul' },
    { id: 'M006', name: 'Priya Kumar', age: 38, sex: 'F', ward: 'High-Risk Pregnancy', bed: 'HR-301', diagnosis: 'G2P1, 32 weeks, Pre-eclampsia', status: 'Critical', admissionDate: '2025-10-07', doctor: 'Dr. Sarah' },
  ];

  const filteredPatients = mockPatients.filter(
    p => p.ward === selectedWard && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.bed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentStats = wardStats[selectedWard];
  const occupancyRate = ((currentStats.occupied / currentStats.total) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-600/30">
                <Baby className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Maternity Ward Management</h1>
                <p className="text-slate-600 mt-1">Comprehensive maternal and newborn care system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white hover:from-pink-700 hover:to-pink-800">
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
            {(['Antenatal', 'Postnatal', 'Labour Room', 'High-Risk Pregnancy'] as Ward[]).map((ward) => {
              const stats = wardStats[ward];
              const rate = ((stats.occupied / stats.total) * 100).toFixed(0);
              const isSelected = selectedWard === ward;
              
              return (
                <button
                  key={ward}
                  onClick={() => setSelectedWard(ward)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-pink-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-pink-600' : 'bg-slate-200'
                    }`}>
                      <Heart className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${isSelected ? 'text-pink-900' : 'text-slate-900'}`}>
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
                <Bed className="h-8 w-8 text-pink-600" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Admission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
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
                        {patient.age}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/maternity-ward/patient/${patient.id}`}>
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


