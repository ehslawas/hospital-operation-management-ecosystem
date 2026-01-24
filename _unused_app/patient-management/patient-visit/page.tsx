"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Clock, CheckCircle, XCircle, Droplet, Stethoscope, CalendarClock } from "lucide-react";

export default function PatientVisitPage() {
  const router = useRouter();

  const handleViewPatient = (visitId: string) => {
    router.push(`/patient-management/patient-visit/${visitId}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Visit Management - General Ward</h1>
          <p className="text-slate-600">Track and manage patient visits, appointments, and consultations</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Day Care</span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Blood Transfusion</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">Medical Appointment</span>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search by patient name, IC, or visit ID..." 
                  className="pl-10 h-12 text-base"
                />
              </div>
              <select className="h-12 px-4 border-2 border-slate-300 rounded-lg font-semibold text-sm">
                <option value="">All Visit Types</option>
                <option value="day-care">Day Care</option>
                <option value="blood-transfusion">Blood Transfusion</option>
                <option value="medical-appointment">Medical Appointment</option>
              </select>
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white">
                <Calendar className="h-5 w-5 mr-2" />
                Today
              </Button>
              <Button variant="outline" className="h-12 px-6">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Visits Today</p>
                  <p className="text-3xl font-bold text-slate-900">42</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Visits</p>
                  <p className="text-3xl font-bold text-green-600">18</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">22</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600">2</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visit Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Day Care</p>
                  <p className="text-2xl font-bold text-blue-600">15</p>
                  <p className="text-xs text-slate-500 mt-1">8 Active • 7 Completed</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Blood Transfusion</p>
                  <p className="text-2xl font-bold text-red-600">12</p>
                  <p className="text-xs text-slate-500 mt-1">5 Active • 7 Completed</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Medical Appointment</p>
                  <p className="text-2xl font-bold text-purple-600">15</p>
                  <p className="text-xs text-slate-500 mt-1">5 Active • 8 Completed • 2 Cancelled</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CalendarClock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visits Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Recent Visits</h3>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                + New Visit
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Visit ID</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Patient Name</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">IC Number</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Visit Date</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Visit Type</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'V2025001', name: 'Ahmad bin Ali', ic: '950101-01-5678', date: '12/10/2025 08:30', type: 'Day Care', status: 'Active', color: 'blue' },
                    { id: 'V2025002', name: 'Siti Aminah', ic: '881215-03-4567', date: '12/10/2025 09:15', type: 'Blood Transfusion', status: 'Completed', color: 'red' },
                    { id: 'V2025003', name: 'Kumar Rajesh', ic: '920504-14-1234', date: '12/10/2025 10:00', type: 'Medical Appointment', status: 'Active', color: 'purple' },
                    { id: 'V2025004', name: 'Lee Mei Ling', ic: '890830-10-9876', date: '12/10/2025 10:45', type: 'Day Care', status: 'Active', color: 'blue' },
                    { id: 'V2025005', name: 'Fatimah Zahra', ic: '910203-06-5432', date: '12/10/2025 11:20', type: 'Medical Appointment', status: 'Completed', color: 'purple' },
                  ].map((visit, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-blue-600">{visit.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{visit.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{visit.ic}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{visit.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          visit.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          visit.color === 'red' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {visit.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          visit.status === 'Active' ? 'bg-green-100 text-green-700' :
                          visit.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewPatient(visit.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

