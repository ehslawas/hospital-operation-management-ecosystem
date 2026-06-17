'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Baby, TrendingUp, Activity, AlertCircle, Users, FileText, Stethoscope, Shield } from 'lucide-react';

export default function PaediatricWardReports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 mt-16">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Paediatric Ward Reports</h1>
              <p className="text-slate-600 mt-1">Comprehensive child and infant care analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Baby className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Admission Statistics</h3>
              </div>
              <p className="text-sm text-slate-600">Track paediatric admissions by age and diagnosis</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Common Diagnoses</h3>
              </div>
              <p className="text-sm text-slate-600">Monitor prevalent conditions and trends</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Recovery Rates</h3>
              </div>
              <p className="text-sm text-slate-600">Track patient outcomes and recovery times</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">NICU/PICU Reports</h3>
              </div>
              <p className="text-sm text-slate-600">Monitor critical care unit performance</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Vaccination Coverage</h3>
              </div>
              <p className="text-sm text-slate-600">Track immunization rates and schedules</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Monthly Summary</h3>
              </div>
              <p className="text-sm text-slate-600">Comprehensive monthly performance overview</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Bed Occupancy</h3>
              </div>
              <p className="text-sm text-slate-600">Track ward utilization and capacity</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Parent Satisfaction</h3>
              </div>
              <p className="text-sm text-slate-600">Monitor family feedback and satisfaction</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


