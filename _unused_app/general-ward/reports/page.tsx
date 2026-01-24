"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  Pill,
  ClipboardList,
  BarChart3,
  PieChart,
  LineChart,
  FileSpreadsheet,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";

export default function GeneralWardReportsPage() {
  const [dateFrom, setDateFrom] = useState("2025-10-01");
  const [dateTo, setDateTo] = useState("2025-10-12");
  const [selectedReport, setSelectedReport] = useState("patient-census");

  // Mock data for reports
  const patientCensusData = [
    { date: "2025-10-01", admissions: 12, discharges: 8, transfers: 3, currentCensus: 45 },
    { date: "2025-10-02", admissions: 15, discharges: 10, transfers: 2, currentCensus: 48 },
    { date: "2025-10-03", admissions: 10, discharges: 12, transfers: 1, currentCensus: 45 },
    { date: "2025-10-04", admissions: 14, discharges: 9, transfers: 4, currentCensus: 46 },
    { date: "2025-10-05", admissions: 11, discharges: 11, transfers: 2, currentCensus: 44 },
    { date: "2025-10-06", admissions: 13, discharges: 7, transfers: 3, currentCensus: 47 },
    { date: "2025-10-07", admissions: 16, discharges: 10, transfers: 1, currentCensus: 52 },
  ];

  const bedOccupancyData = {
    totalBeds: 60,
    occupiedBeds: 52,
    availableBeds: 8,
    occupancyRate: 86.7,
    averageLOS: 4.2,
    turnoverRate: 2.3,
  };

  const diagnosisData = [
    { diagnosis: "Pneumonia", count: 18, percentage: 23.1 },
    { diagnosis: "Diabetes Mellitus", count: 15, percentage: 19.2 },
    { diagnosis: "Hypertension", count: 12, percentage: 15.4 },
    { diagnosis: "Gastroenteritis", count: 10, percentage: 12.8 },
    { diagnosis: "UTI", count: 8, percentage: 10.3 },
    { diagnosis: "COPD", count: 7, percentage: 9.0 },
    { diagnosis: "Others", count: 8, percentage: 10.2 },
  ];

  const medicationUsageData = [
    { medication: "Paracetamol 500mg", quantity: 450, cost: "RM 135.00" },
    { medication: "Metformin 500mg", quantity: 380, cost: "RM 228.00" },
    { medication: "Amlodipine 5mg", quantity: 320, cost: "RM 192.00" },
    { medication: "Amoxicillin 500mg", quantity: 280, cost: "RM 336.00" },
    { medication: "Omeprazole 20mg", quantity: 250, cost: "RM 200.00" },
    { medication: "Aspirin 100mg", quantity: 220, cost: "RM 110.00" },
    { medication: "Insulin (Various)", quantity: 180, cost: "RM 540.00" },
    { medication: "Atorvastatin 20mg", quantity: 150, cost: "RM 180.00" },
  ];

  const nursingActivitiesData = [
    { activity: "Vital Signs Monitoring", frequency: 624, avgTime: "5 min" },
    { activity: "Medication Administration", frequency: 486, avgTime: "8 min" },
    { activity: "Wound Dressing", frequency: 156, avgTime: "15 min" },
    { activity: "Patient Education", frequency: 142, avgTime: "20 min" },
    { activity: "IV Line Management", frequency: 124, avgTime: "12 min" },
    { activity: "Blood Glucose Monitoring", frequency: 98, avgTime: "6 min" },
    { activity: "Patient Assessment", frequency: 78, avgTime: "25 min" },
    { activity: "Documentation", frequency: 312, avgTime: "10 min" },
  ];

  const adverseEventsData = [
    { event: "Medication Error", count: 2, severity: "Low", action: "Reviewed and documented" },
    { event: "Patient Fall", count: 1, severity: "Medium", action: "Safety protocol reinforced" },
    { event: "Pressure Ulcer", count: 1, severity: "Low", action: "Enhanced monitoring" },
    { event: "IV Infiltration", count: 3, severity: "Low", action: "Staff re-training" },
  ];

  const dischargeData = [
    { destination: "Home", count: 42, percentage: 60.0 },
    { destination: "Transfer to Specialist", count: 15, percentage: 21.4 },
    { destination: "Transfer to Rehab", count: 8, percentage: 11.4 },
    { destination: "Against Medical Advice", count: 3, percentage: 4.3 },
    { destination: "Deceased", count: 2, percentage: 2.9 },
  ];

  const readmissionData = [
    { condition: "Heart Failure", readmissions: 5, totalDischarges: 18, rate: 27.8 },
    { condition: "COPD", readmissions: 4, totalDischarges: 15, rate: 26.7 },
    { condition: "Pneumonia", readmissions: 3, totalDischarges: 22, rate: 13.6 },
    { condition: "Diabetes", readmissions: 2, totalDischarges: 20, rate: 10.0 },
  ];

  const staffingData = [
    { shift: "Morning (7AM-3PM)", nurses: 12, ratio: "1:4.3", patientLoad: 52 },
    { shift: "Evening (3PM-11PM)", nurses: 10, ratio: "1:5.2", patientLoad: 52 },
    { shift: "Night (11PM-7AM)", nurses: 8, ratio: "1:6.5", patientLoad: 52 },
  ];

  const laboratoryData = [
    { test: "Full Blood Count", count: 145, avgTAT: "2.3 hrs" },
    { test: "Renal Function Test", count: 98, avgTAT: "3.1 hrs" },
    { test: "Liver Function Test", count: 86, avgTAT: "3.2 hrs" },
    { test: "Blood Glucose", count: 234, avgTAT: "0.5 hrs" },
    { test: "Lipid Profile", count: 64, avgTAT: "4.2 hrs" },
    { test: "Electrolytes", count: 112, avgTAT: "2.8 hrs" },
  ];

  const infectionControlData = [
    { type: "Hand Hygiene Compliance", rate: 94.5, target: 95.0, status: "Near Target" },
    { type: "HAI Rate (per 1000 patient days)", rate: 2.1, target: 2.0, status: "Above Target" },
    { type: "Catheter-Associated UTI", rate: 0.8, target: 1.0, status: "On Target" },
    { type: "Surgical Site Infection", rate: 0.3, target: 0.5, status: "On Target" },
  ];

  const patientSatisfactionData = [
    { category: "Nursing Care", score: 4.6, responses: 78 },
    { category: "Medical Care", score: 4.5, responses: 78 },
    { category: "Cleanliness", score: 4.4, responses: 78 },
    { category: "Food Quality", score: 3.9, responses: 78 },
    { category: "Communication", score: 4.3, responses: 78 },
    { category: "Overall Satisfaction", score: 4.4, responses: 78 },
  ];

  const lengthOfStayData = [
    { losRange: "0-1 days", count: 8, percentage: 11.4 },
    { losRange: "2-3 days", count: 24, percentage: 34.3 },
    { losRange: "4-5 days", count: 18, percentage: 25.7 },
    { losRange: "6-7 days", count: 12, percentage: 17.1 },
    { losRange: "8-10 days", count: 6, percentage: 8.6 },
    { losRange: ">10 days", count: 2, percentage: 2.9 },
  ];

  const mortalityData = [
    { month: "July 2025", deaths: 3, admissions: 285, rate: 1.05 },
    { month: "August 2025", deaths: 2, admissions: 298, rate: 0.67 },
    { month: "September 2025", deaths: 4, admissions: 310, rate: 1.29 },
    { month: "October 2025 (YTD)", deaths: 2, admissions: 156, rate: 1.28 },
  ];

  const wardRoundData = [
    { date: "2025-10-12", mrRounds: 2, nurseRounds: 4, mdtRounds: 1, totalPatientsSeen: 52 },
    { date: "2025-10-11", mrRounds: 2, nurseRounds: 4, mdtRounds: 1, totalPatientsSeen: 50 },
    { date: "2025-10-10", mrRounds: 2, nurseRounds: 4, mdtRounds: 0, totalPatientsSeen: 48 },
    { date: "2025-10-09", mrRounds: 2, nurseRounds: 4, mdtRounds: 1, totalPatientsSeen: 47 },
  ];

  const reports = [
    { id: "patient-census", name: "Patient Census Report", icon: Users, color: "blue" },
    { id: "bed-occupancy", name: "Bed Occupancy & Utilization", icon: Activity, color: "green" },
    { id: "diagnosis", name: "Diagnosis Distribution", icon: ClipboardList, color: "purple" },
    { id: "medication-usage", name: "Medication Usage Report", icon: Pill, color: "orange" },
    { id: "nursing-activities", name: "Nursing Activities Log", icon: FileText, color: "teal" },
    { id: "adverse-events", name: "Adverse Events Report", icon: AlertTriangle, color: "red" },
    { id: "discharge-summary", name: "Discharge Summary Report", icon: TrendingUp, color: "indigo" },
    { id: "readmission", name: "30-Day Readmission Report", icon: RefreshCw, color: "pink" },
    { id: "staffing", name: "Staffing & Nurse-Patient Ratio", icon: Users, color: "cyan" },
    { id: "laboratory", name: "Laboratory Test Report", icon: FileSpreadsheet, color: "lime" },
    { id: "infection-control", name: "Infection Control Metrics", icon: AlertTriangle, color: "rose" },
    { id: "patient-satisfaction", name: "Patient Satisfaction Survey", icon: BarChart3, color: "amber" },
    { id: "length-of-stay", name: "Length of Stay Analysis", icon: LineChart, color: "emerald" },
    { id: "mortality", name: "Mortality Rate Report", icon: PieChart, color: "slate" },
    { id: "ward-rounds", name: "Ward Round Activity Report", icon: ClipboardList, color: "violet" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
      blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-500 to-blue-600" },
      green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", gradient: "from-green-500 to-green-600" },
      purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", gradient: "from-purple-500 to-purple-600" },
      orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", gradient: "from-orange-500 to-orange-600" },
      teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", gradient: "from-teal-500 to-teal-600" },
      red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", gradient: "from-red-500 to-red-600" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", gradient: "from-indigo-500 to-indigo-600" },
      pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", gradient: "from-pink-500 to-pink-600" },
      cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", gradient: "from-cyan-500 to-cyan-600" },
      lime: { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200", gradient: "from-lime-500 to-lime-600" },
      rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", gradient: "from-rose-500 to-rose-600" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-500 to-amber-600" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", gradient: "from-emerald-500 to-emerald-600" },
      slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", gradient: "from-slate-500 to-slate-600" },
      violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", gradient: "from-violet-500 to-violet-600" },
    };
    return colors[color] || colors.blue;
  };

  const currentReport = reports.find(r => r.id === selectedReport);
  const colorClasses = currentReport ? getColorClasses(currentReport.color) : getColorClasses("blue");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">General Ward Reports</h1>
            <p className="text-slate-600 mt-1">Comprehensive reporting and analytics dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-5 w-5 text-slate-500" />
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9"
                  />
                  <span className="text-slate-500">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <Button size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Report Selection Sidebar */}
        <div className="space-y-2">
          <Card className="border-0 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Available Reports</h3>
              </div>
              <div className="space-y-1">
                {reports.map((report) => {
                  const Icon = report.icon;
                  const isActive = selectedReport === report.id;
                  const colors = getColorClasses(report.color);
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all text-sm ${
                        isActive
                          ? `${colors.bg} ${colors.text} border ${colors.border} shadow-sm font-semibold`
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2">{report.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {/* Report Header */}
          <Card className={`border-0 shadow-lg bg-gradient-to-r ${colorClasses.gradient}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  {currentReport && (
                    <>
                      <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <currentReport.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{currentReport.name}</h2>
                        <p className="text-sm text-white/90 mt-1">
                          Period: {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content Based on Selection */}
          {selectedReport === "patient-census" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Daily Patient Census</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-200 bg-blue-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Date</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Admissions</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Discharges</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Transfers</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Current Census</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientCensusData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 text-sm text-slate-900">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700 font-bold">
                              {row.admissions}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-700 font-bold">
                              {row.discharges}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-bold">
                              {row.transfers}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold">
                              {row.currentCensus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Admissions</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">91</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Total Discharges</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">67</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Total Transfers</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">16</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Current Census</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">52</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "bed-occupancy" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Bed Occupancy Overview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                      <p className="text-sm font-semibold opacity-90">Total Beds</p>
                      <p className="text-4xl font-bold mt-2">{bedOccupancyData.totalBeds}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                      <p className="text-sm font-semibold opacity-90">Occupied Beds</p>
                      <p className="text-4xl font-bold mt-2">{bedOccupancyData.occupiedBeds}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                      <p className="text-sm font-semibold opacity-90">Available Beds</p>
                      <p className="text-4xl font-bold mt-2">{bedOccupancyData.availableBeds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Occupancy Rate</p>
                      <p className="text-3xl font-bold text-purple-700 mt-2">{bedOccupancyData.occupancyRate}%</p>
                      <div className="w-full h-2 bg-purple-200 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-purple-600" style={{ width: `${bedOccupancyData.occupancyRate}%` }}></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50">
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Average Length of Stay</p>
                      <p className="text-3xl font-bold text-teal-700 mt-2">{bedOccupancyData.averageLOS} days</p>
                    </div>
                    <div className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Turnover Rate</p>
                      <p className="text-3xl font-bold text-indigo-700 mt-2">{bedOccupancyData.turnoverRate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedReport === "diagnosis" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top Diagnosis Distribution</h3>
                <div className="space-y-3">
                  {diagnosisData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-semibold text-slate-700">{item.diagnosis}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end pr-3"
                              style={{ width: `${item.percentage}%` }}
                            >
                              <span className="text-xs font-bold text-white">{item.count}</span>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-sm font-bold text-purple-700">{item.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">
                    Total Patients Analyzed: <span className="text-xl">78</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "medication-usage" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top Medication Usage</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-orange-200 bg-orange-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Medication</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Quantity Dispensed</th>
                        <th className="text-right p-3 text-sm font-bold text-slate-900">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicationUsageData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-orange-50/50">
                          <td className="p-3 text-sm font-semibold text-slate-900">{item.medication}</td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right font-bold text-slate-900">{item.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-orange-100 border-t-2 border-orange-300">
                        <td className="p-3 text-sm font-bold text-slate-900">TOTAL</td>
                        <td className="p-3 text-sm text-center font-bold text-slate-900">2,230</td>
                        <td className="p-3 text-sm text-right font-bold text-orange-700">RM 1,921.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "nursing-activities" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Nursing Activities Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {nursingActivitiesData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 text-sm">{item.activity}</h4>
                        <span className="text-xs font-semibold text-teal-600">{item.avgTime}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-teal-700">{item.frequency}</span>
                        <span className="text-sm text-slate-600">times</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "adverse-events" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Adverse Events Report</h3>
                <div className="space-y-3">
                  {adverseEventsData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h4 className="font-bold text-slate-900">{item.event}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                            {item.count} {item.count === 1 ? 'incident' : 'incidents'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.severity === 'Low' ? 'bg-yellow-200 text-yellow-800' :
                            item.severity === 'Medium' ? 'bg-orange-200 text-orange-800' :
                            'bg-red-300 text-red-900'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 ml-8">
                        <strong>Action Taken:</strong> {item.action}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900">
                    ✓ Total Incidents: <span className="text-xl">7</span> | No major safety incidents reported
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "discharge-summary" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Discharge Destination Analysis</h3>
                <div className="space-y-3">
                  {dischargeData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-56 text-sm font-semibold text-slate-700">{item.destination}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-10 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-between px-3"
                              style={{ width: `${item.percentage}%` }}
                            >
                              <span className="text-sm font-bold text-white">{item.count} patients</span>
                              <span className="text-sm font-bold text-white">{item.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900">
                    Total Discharges: <span className="text-xl">70</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "readmission" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">30-Day Readmission Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-pink-200 bg-pink-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Condition</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Readmissions</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Total Discharges</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Readmission Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readmissionData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-pink-50/50">
                          <td className="p-3 text-sm font-semibold text-slate-900">{item.condition}</td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100 text-pink-700 font-bold">
                              {item.readmissions}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center font-semibold">{item.totalDischarges}</td>
                          <td className="p-3 text-sm text-center">
                            <span className={`px-3 py-1 rounded-full font-bold ${
                              item.rate > 20 ? 'bg-red-100 text-red-700' :
                              item.rate > 15 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {item.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <p className="text-sm font-semibold text-pink-900">
                    Overall 30-Day Readmission Rate: <span className="text-xl">18.7%</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "staffing" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Staffing & Nurse-Patient Ratio</h3>
                <div className="space-y-4">
                  {staffingData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{item.shift}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <p className="text-xs text-slate-600">Nurses on Duty</p>
                              <p className="text-2xl font-bold text-cyan-700">{item.nurses}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Patient Load</p>
                              <p className="text-2xl font-bold text-slate-700">{item.patientLoad}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600 mb-1">Nurse-Patient Ratio</p>
                          <div className={`px-4 py-2 rounded-lg font-bold text-xl ${
                            parseFloat(item.ratio.split(':')[1]) < 5 ? 'bg-green-200 text-green-800' :
                            parseFloat(item.ratio.split(':')[1]) < 6 ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {item.ratio}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "laboratory" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Laboratory Test Utilization</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-lime-200 bg-lime-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Test Type</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Total Tests</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Avg Turnaround Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laboratoryData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-lime-50/50">
                          <td className="p-3 text-sm font-semibold text-slate-900">{item.test}</td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-lime-100 text-lime-700 font-bold">
                              {item.count}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center font-semibold text-slate-700">{item.avgTAT}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-lime-100 border-t-2 border-lime-300">
                        <td className="p-3 text-sm font-bold text-slate-900">TOTAL</td>
                        <td className="p-3 text-sm text-center font-bold text-lime-700">739</td>
                        <td className="p-3 text-sm text-center"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "infection-control" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Infection Control Metrics</h3>
                <div className="space-y-4">
                  {infectionControlData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-rose-200 bg-rose-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{item.type}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === 'On Target' ? 'bg-green-200 text-green-800' :
                          item.status === 'Near Target' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-600">Current Rate</p>
                          <p className="text-2xl font-bold text-rose-700">{item.rate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Target</p>
                          <p className="text-2xl font-bold text-slate-700">{item.target}%</p>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                item.status === 'On Target' ? 'bg-green-500' :
                                item.status === 'Near Target' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${(item.rate / item.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "patient-satisfaction" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Satisfaction Survey Results</h3>
                <div className="space-y-4">
                  {patientSatisfactionData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{item.category}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(item.score) ? 'text-amber-500' : 'text-slate-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-2xl font-bold text-amber-700">{item.score}</span>
                          <span className="text-xs text-slate-600">({item.responses} responses)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900">
                    Overall Satisfaction Score: <span className="text-xl">4.4 / 5.0</span> (88%)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "length-of-stay" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Length of Stay Distribution</h3>
                <div className="space-y-3">
                  {lengthOfStayData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-semibold text-slate-700">{item.losRange}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-10 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-between px-3"
                              style={{ width: `${item.percentage}%` }}
                            >
                              <span className="text-sm font-bold text-white">{item.count} patients</span>
                              <span className="text-sm font-bold text-white">{item.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Average LOS</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">4.2 days</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Median LOS</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">3.5 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "mortality" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Mortality Rate Trend</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Period</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Deaths</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Admissions</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Mortality Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mortalityData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 text-sm font-semibold text-slate-900">{item.month}</td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-700 font-bold">
                              {item.deaths}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center font-semibold">{item.admissions}</td>
                          <td className="p-3 text-sm text-center">
                            <span className={`px-3 py-1 rounded-full font-bold ${
                              item.rate < 1 ? 'bg-green-100 text-green-700' :
                              item.rate < 1.5 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    Average Quarterly Mortality Rate: <span className="text-xl">1.07%</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport === "ward-rounds" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Ward Round Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-violet-200 bg-violet-50">
                        <th className="text-left p-3 text-sm font-bold text-slate-900">Date</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">MR Rounds</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Nurse Rounds</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">MDT Rounds</th>
                        <th className="text-center p-3 text-sm font-bold text-slate-900">Patients Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wardRoundData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-violet-50/50">
                          <td className="p-3 text-sm font-semibold text-slate-900">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-bold">
                              {item.mrRounds}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100 text-teal-700 font-bold">
                              {item.nurseRounds}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-700 font-bold">
                              {item.mdtRounds}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center font-bold text-slate-900">{item.totalPatientsSeen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold uppercase">Total MR Rounds</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">8</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <p className="text-xs text-teal-600 font-semibold uppercase">Total Nurse Rounds</p>
                    <p className="text-3xl font-bold text-teal-700 mt-2">16</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 font-semibold uppercase">Total MDT Rounds</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}




