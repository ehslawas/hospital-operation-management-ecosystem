'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Baby, TrendingUp, Activity, AlertCircle, Users, FileText } from 'lucide-react';

export default function MaternityWardReports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 mt-16">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-600/30">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Maternity Ward Reports</h1>
              <p className="text-slate-600 mt-1">Comprehensive maternal and newborn care analytics</p>
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
                <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Baby className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delivery Statistics</h3>
              </div>
              <p className="text-sm text-slate-600">Track normal deliveries, C-sections, and outcomes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Antenatal Care</h3>
              </div>
              <p className="text-sm text-slate-600">Monitor antenatal visits and high-risk pregnancies</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Postnatal Monitoring</h3>
              </div>
              <p className="text-sm text-slate-600">Track mother and baby health post-delivery</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Complications Report</h3>
              </div>
              <p className="text-sm text-slate-600">Monitor maternal and neonatal complications</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Labour Room Activity</h3>
              </div>
              <p className="text-sm text-slate-600">Track labour room utilization and turnover</p>
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
        </div>
      </div>
    </div>
  );
}


