'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ambulance,
  Stethoscope,
  BedDouble,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

// Mock data for dashboard
const DEPARTMENT_STATS = {
  totalPatients: 42,
  waitingPatients: 18,
  inTreatment: 15,
  critical: 3,
  discharged: 6,
  avgWaitTime: "23 min",
  bedOccupancy: 85,
  totalBeds: 20,
  occupiedBeds: 17,
  staffOnDuty: 12,
};

const PATIENT_QUEUE = [
  { id: "P-001", name: "Ahmad bin Ali", acuity: "Red", complaint: "Chest pain", waitTime: "5m", status: "Waiting" },
  { id: "P-002", name: "Siti Aminah", acuity: "Yellow", complaint: "Abdominal pain", waitTime: "12m", status: "In Treatment" },
  { id: "P-003", name: "John Tan", acuity: "Green", complaint: "Minor laceration", waitTime: "18m", status: "Waiting" },
  { id: "P-004", name: "Mary Wong", acuity: "Orange", complaint: "Difficulty breathing", waitTime: "8m", status: "In Treatment" },
  { id: "P-005", name: "Kumar Raj", acuity: "Red", complaint: "Severe trauma", waitTime: "2m", status: "Critical" },
  { id: "P-006", name: "Lisa Chen", acuity: "Yellow", complaint: "High fever", waitTime: "25m", status: "Waiting" },
  { id: "P-007", name: "David Lee", acuity: "Green", complaint: "Sprained ankle", waitTime: "32m", status: "Waiting" },
  { id: "P-008", name: "Sarah Lim", acuity: "Orange", complaint: "Severe headache", waitTime: "15m", status: "In Treatment" },
];

const RECENT_ACTIVITIES = [
  { time: "2 min ago", action: "Patient P-005 admitted - Severe trauma", type: "critical" },
  { time: "5 min ago", action: "Patient P-001 moved to Critical Care", type: "warning" },
  { time: "12 min ago", action: "Patient P-010 discharged", type: "success" },
  { time: "18 min ago", action: "New ambulance arrival expected in 5 min", type: "info" },
  { time: "25 min ago", action: "Dr. Sarah started shift", type: "info" },
  { time: "32 min ago", action: "Bed 12 now available", type: "success" },
];

const BED_STATUS = [
  { id: "Bed 01", status: "occupied", patient: "P-001", type: "Critical" },
  { id: "Bed 02", status: "occupied", patient: "P-002", type: "Standard" },
  { id: "Bed 03", status: "available", patient: null, type: "Standard" },
  { id: "Bed 04", status: "occupied", patient: "P-004", type: "Critical" },
  { id: "Bed 05", status: "occupied", patient: "P-005", type: "Critical" },
  { id: "Bed 06", status: "available", patient: null, type: "Standard" },
  { id: "Bed 07", status: "occupied", patient: "P-007", type: "Standard" },
  { id: "Bed 08", status: "occupied", patient: "P-008", type: "Standard" },
  { id: "Bed 09", status: "cleaning", patient: null, type: "Standard" },
  { id: "Bed 10", status: "available", patient: null, type: "Standard" },
  { id: "Bed 11", status: "occupied", patient: "P-011", type: "Critical" },
  { id: "Bed 12", status: "occupied", patient: "P-012", type: "Standard" },
];

const ACUITY_COLORS: Record<string, string> = {
  Red: "bg-red-500",
  Orange: "bg-orange-500",
  Yellow: "bg-yellow-500",
  Green: "bg-green-500",
  Blue: "bg-blue-500",
};

export default function ETUDashboard() {
  const [selectedView, setSelectedView] = useState<"overview" | "patients" | "beds">("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = useMemo(() => {
    return PATIENT_QUEUE.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.complaint.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm mt-16">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white grid place-items-center shadow-lg shadow-blue-600/30">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency & Trauma Unit</h1>
                <p className="text-sm text-slate-600 font-medium">Real-time department overview</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all">
                <UserPlus className="h-4 w-4" />
                New Patient
              </Button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-3 mt-6 border-b border-slate-200">
            <button
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                selectedView === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedView("overview")}
            >
              Overview
              {selectedView === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                selectedView === "patients"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedView("patients")}
            >
              Patient Queue
              {selectedView === "patients" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                selectedView === "beds"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedView("beds")}
            >
              Bed Management
              {selectedView === "beds" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {selectedView === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Patients */}
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Total Patients</p>
                      <h3 className="text-4xl font-bold mt-3 bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">{DEPARTMENT_STATS.totalPatients}</h3>
                      <div className="flex items-center gap-1 mt-3 text-emerald-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="text-sm font-semibold">+12%</span>
                        <span className="text-xs text-slate-500">from yesterday</span>
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 grid place-items-center shadow-lg shadow-blue-600/30">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700" />
              </Card>

              {/* Critical Cases */}
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Critical Cases</p>
                      <h3 className="text-4xl font-bold mt-3 bg-gradient-to-br from-red-600 to-red-700 bg-clip-text text-transparent">{DEPARTMENT_STATS.critical}</h3>
                      <div className="flex items-center gap-1 mt-3 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Immediate</span>
                        <span className="text-xs text-slate-500">attention</span>
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 grid place-items-center shadow-lg shadow-red-600/30">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-gradient-to-r from-red-600 to-red-700" />
              </Card>

              {/* Avg Wait Time */}
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Avg Wait Time</p>
                      <h3 className="text-4xl font-bold mt-3 bg-gradient-to-br from-orange-600 to-orange-700 bg-clip-text text-transparent">{DEPARTMENT_STATS.avgWaitTime}</h3>
                      <div className="flex items-center gap-1 mt-3 text-emerald-600">
                        <ArrowDownRight className="h-4 w-4" />
                        <span className="text-sm font-semibold">-5 min</span>
                        <span className="text-xs text-slate-500">from average</span>
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 grid place-items-center shadow-lg shadow-orange-600/30">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-700" />
              </Card>

              {/* Bed Occupancy */}
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Bed Occupancy</p>
                      <h3 className="text-4xl font-bold mt-3 bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">{DEPARTMENT_STATS.bedOccupancy}%</h3>
                      <div className="flex items-center gap-1 mt-3 text-slate-600">
                        <BedDouble className="h-4 w-4" />
                        <span className="text-sm font-semibold">{DEPARTMENT_STATS.occupiedBeds}/{DEPARTMENT_STATS.totalBeds}</span>
                        <span className="text-xs text-slate-500">occupied</span>
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 grid place-items-center shadow-lg shadow-green-600/30">
                      <BedDouble className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-gradient-to-r from-green-600 to-green-700" />
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Patient Distribution */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Patient Distribution by Status</h3>
                    <span className="text-sm text-slate-500 font-medium">Live Updates</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-600 grid place-items-center">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Waiting</p>
                          <p className="text-sm text-slate-600">In queue for assessment</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">{DEPARTMENT_STATS.waitingPatients}</div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-600 grid place-items-center">
                          <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">In Treatment</p>
                          <p className="text-sm text-slate-600">Currently being treated</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{DEPARTMENT_STATS.inTreatment}</div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-600 grid place-items-center">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Critical</p>
                          <p className="text-sm text-slate-600">Requires immediate care</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-red-600">{DEPARTMENT_STATS.critical}</div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-600 grid place-items-center">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Discharged Today</p>
                          <p className="text-sm text-slate-600">Completed treatment</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-600">{DEPARTMENT_STATS.discharged}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activities</h3>
                  <div className="space-y-3">
                    {RECENT_ACTIVITIES.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`h-8 w-8 rounded-full grid place-items-center flex-shrink-0 ${
                          activity.type === 'critical' ? 'bg-red-100' :
                          activity.type === 'warning' ? 'bg-orange-100' :
                          activity.type === 'success' ? 'bg-green-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.type === 'critical' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           activity.type === 'warning' ? <Activity className="h-4 w-4 text-orange-600" /> :
                           activity.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                           <Calendar className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">{activity.action}</p>
                          <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedView === "patients" && (
          <div className="space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, or complaint..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Patient List */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Patient ID</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Name</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Acuity</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Chief Complaint</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Wait Time</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Status</th>
                        <th className="text-left px-6 py-4 font-bold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{patient.id}</td>
                          <td className="px-6 py-4 text-slate-700">{patient.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${ACUITY_COLORS[patient.acuity]}`} />
                              <span className="font-medium">{patient.acuity}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{patient.complaint}</td>
                          <td className="px-6 py-4 text-slate-700">{patient.waitTime}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              patient.status === 'Critical' ? 'bg-red-100 text-red-700' :
                              patient.status === 'In Treatment' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/emergency/assessment?patientId=${patient.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedView === "beds" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Bed Status Overview</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-green-500" />
                      <span className="text-sm text-slate-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-blue-500" />
                      <span className="text-sm text-slate-600">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-orange-500" />
                      <span className="text-sm text-slate-600">Cleaning</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {BED_STATUS.map((bed, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 ${
                        bed.status === 'available' ? 'bg-green-50 border-green-200' :
                        bed.status === 'cleaning' ? 'bg-orange-50 border-orange-200' :
                        bed.type === 'Critical' ? 'bg-red-50 border-red-300' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">{bed.id}</span>
                        {bed.type === 'Critical' && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm">
                        {bed.status === 'occupied' ? (
                          <>
                            <p className="text-slate-600">Patient: {bed.patient}</p>
                            <p className="text-xs text-slate-500 mt-1">{bed.type}</p>
                          </>
                        ) : bed.status === 'cleaning' ? (
                          <p className="text-orange-600 font-medium">Cleaning in progress</p>
                        ) : (
                          <p className="text-green-600 font-medium">Available</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}


