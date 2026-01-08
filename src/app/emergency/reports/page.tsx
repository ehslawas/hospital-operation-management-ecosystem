'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Users,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  Pill,
  DollarSign,
  UserCheck,
  ClipboardCheck,
  Download,
  Filter,
  Search,
  ChevronRight,
  BarChart3,
  Heart,
  Ambulance,
  Stethoscope,
  Package,
} from 'lucide-react';

export default function EmergencyReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const reportCategories = [
    {
      id: 'patient-flow',
      name: 'Patient Flow & Triage',
      icon: Users,
      color: 'bg-blue-500',
      reports: 3,
    },
    {
      id: 'clinical-performance',
      name: 'Clinical Performance',
      icon: Activity,
      color: 'bg-green-500',
      reports: 2,
    },
    {
      id: 'resource-utilization',
      name: 'Resource Utilization',
      icon: BarChart3,
      color: 'bg-purple-500',
      reports: 2,
    },
    {
      id: 'emergency-response',
      name: 'Emergency Response',
      icon: AlertTriangle,
      color: 'bg-red-500',
      reports: 1,
    },
    {
      id: 'medication-treatment',
      name: 'Medication & Treatment',
      icon: Pill,
      color: 'bg-orange-500',
      reports: 1,
    },
    {
      id: 'quality-safety',
      name: 'Quality & Safety',
      icon: ClipboardCheck,
      color: 'bg-yellow-500',
      reports: 1,
    },
  ];

  const reports = {
    'patient-flow': [
      {
        id: 'triage-distribution',
        name: 'Triage Distribution Report',
        description: 'Patient distribution by triage category and acuity levels',
      },
      {
        id: 'patient-volume',
        name: 'Patient Volume Analysis',
        description: 'Daily, weekly, and monthly patient volume trends',
      },
      {
        id: 'waiting-time',
        name: 'Waiting Time Report',
        description: 'Average waiting times and time-to-treatment metrics',
      },
    ],
    'clinical-performance': [
      {
        id: 'treatment-outcomes',
        name: 'Treatment Outcomes Report',
        description: 'Patient outcomes, disposition, and mortality rates',
      },
      {
        id: 'clinical-protocols',
        name: 'Clinical Protocol Adherence',
        description: 'Compliance with emergency treatment protocols',
      },
    ],
    'resource-utilization': [
      {
        id: 'bed-occupancy',
        name: 'Bed Occupancy Report',
        description: 'Emergency bed utilization and availability',
      },
      {
        id: 'equipment-usage',
        name: 'Equipment Usage Report',
        description: 'Critical equipment utilization and availability',
      },
    ],
    'emergency-response': [
      {
        id: 'trauma-cases',
        name: 'Trauma Cases Report',
        description: 'Trauma case analysis including severity and outcomes',
      },
    ],
    'medication-treatment': [
      {
        id: 'emergency-medications',
        name: 'Emergency Medications Report',
        description: 'Critical medication usage and stock levels',
      },
    ],
    'quality-safety': [
      {
        id: 'adverse-events',
        name: 'Adverse Events Report',
        description: 'Patient safety incidents and near-miss events',
      },
    ],
  };

  const renderTriageDistributionReport = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Triage Distribution Report</h2>
          <p className="text-slate-600 mt-1">Patient distribution by triage category - Last 30 days</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-700">Red (Critical)</span>
              <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-900">142</div>
            <div className="text-xs text-red-700 mt-1">18.5% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-orange-700">Orange (Urgent)</span>
              <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-900">236</div>
            <div className="text-xs text-orange-700 mt-1">30.7% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-700">Yellow (Semi-Urgent)</span>
              <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-900">198</div>
            <div className="text-xs text-yellow-700 mt-1">25.8% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-green-700">Green (Non-Urgent)</span>
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-900">156</div>
            <div className="text-xs text-green-700 mt-1">20.3% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Total Patients</span>
              <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">768</div>
            <div className="text-xs text-slate-700 mt-1">Last 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Chief Complaints by Triage Level</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chief Complaint</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Red</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Orange</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Yellow</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Green</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Chest Pain</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">45</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">32</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">12</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">8</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">97</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Difficulty Breathing</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">38</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">28</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">15</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">5</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">86</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Abdominal Pain</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">12</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">56</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">42</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">18</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">128</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Trauma (MVA/Fall)</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">29</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">45</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">34</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">22</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">130</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Headache/Migraine</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">8</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">25</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">38</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">42</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">113</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Fever</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">5</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">18</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">32</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">35</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">90</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Minor Laceration/Wound</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">2</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">12</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">15</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">18</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">47</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">Others</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-semibold">3</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600">20</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600">10</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600">8</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">77</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">TOTAL</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600 font-bold">142</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600 font-bold">236</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600 font-bold">198</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-bold">156</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">768</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Time Distribution */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Arrival Pattern by Time of Day</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 font-semibold">Night (00:00 - 06:00)</div>
              <div className="text-2xl font-bold text-blue-900 mt-2">98 patients</div>
              <div className="text-xs text-blue-600 mt-1">12.8% of total</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 font-semibold">Morning (06:00 - 12:00)</div>
              <div className="text-2xl font-bold text-yellow-900 mt-2">245 patients</div>
              <div className="text-xs text-yellow-600 mt-1">31.9% of total</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700 font-semibold">Afternoon (12:00 - 18:00)</div>
              <div className="text-2xl font-bold text-orange-900 mt-2">282 patients</div>
              <div className="text-xs text-orange-600 mt-1">36.7% of total</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-700 font-semibold">Evening (18:00 - 00:00)</div>
              <div className="text-2xl font-bold text-purple-900 mt-2">143 patients</div>
              <div className="text-xs text-purple-600 mt-1">18.6% of total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatientVolumeReport = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Volume Analysis</h2>
          <p className="text-slate-600 mt-1">Daily, weekly, and monthly trends - Last 90 days</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Daily Average</span>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">26 patients</div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +8.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Weekly Total</span>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">182 patients</div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% from last week
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Monthly Total</span>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">768 patients</div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +5.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Peak Hour</span>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">14:00</div>
            <div className="text-xs text-slate-600 mt-1">Average 4.8 patients/hour</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Day</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">This Week</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Last Week</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr><td className="px-6 py-4 text-sm font-medium">Monday</td><td className="px-6 py-4 text-sm text-center">28</td><td className="px-6 py-4 text-sm text-center">24</td><td className="px-6 py-4 text-sm text-center text-green-600">+16.7%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Tuesday</td><td className="px-6 py-4 text-sm text-center">32</td><td className="px-6 py-4 text-sm text-center">28</td><td className="px-6 py-4 text-sm text-center text-green-600">+14.3%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Wednesday</td><td className="px-6 py-4 text-sm text-center">26</td><td className="px-6 py-4 text-sm text-center">30</td><td className="px-6 py-4 text-sm text-center text-red-600">-13.3%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Thursday</td><td className="px-6 py-4 text-sm text-center">24</td><td className="px-6 py-4 text-sm text-center">22</td><td className="px-6 py-4 text-sm text-center text-green-600">+9.1%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Friday</td><td className="px-6 py-4 text-sm text-center">29</td><td className="px-6 py-4 text-sm text-center">26</td><td className="px-6 py-4 text-sm text-center text-green-600">+11.5%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Saturday</td><td className="px-6 py-4 text-sm text-center">22</td><td className="px-6 py-4 text-sm text-center">19</td><td className="px-6 py-4 text-sm text-center text-green-600">+15.8%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Sunday</td><td className="px-6 py-4 text-sm text-center">21</td><td className="px-6 py-4 text-sm text-center">18</td><td className="px-6 py-4 text-sm text-center text-green-600">+16.7%</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWaitingTimeReport = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Waiting Time Report</h2>
          <p className="text-slate-600 mt-1">Average waiting times and time-to-treatment metrics</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-red-700 mb-2">Red (Critical)</div>
            <div className="text-3xl font-bold text-red-900">4 min</div>
            <div className="text-xs text-red-700 mt-1">Avg wait time</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-orange-700 mb-2">Orange (Urgent)</div>
            <div className="text-3xl font-bold text-orange-900">18 min</div>
            <div className="text-xs text-orange-700 mt-1">Avg wait time</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-yellow-700 mb-2">Yellow (Semi-Urgent)</div>
            <div className="text-3xl font-bold text-yellow-900">45 min</div>
            <div className="text-xs text-yellow-700 mt-1">Avg wait time</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-green-700 mb-2">Green (Non-Urgent)</div>
            <div className="text-3xl font-bold text-green-900">82 min</div>
            <div className="text-xs text-green-700 mt-1">Avg wait time</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Time Metrics by Triage Level</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Triage Level</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Wait Time</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Assessment Time</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Treatment Time</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total Time in ED</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Target Met</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">Red (Critical)</td>
                  <td className="px-6 py-4 text-sm text-center">4 min</td>
                  <td className="px-6 py-4 text-sm text-center">8 min</td>
                  <td className="px-6 py-4 text-sm text-center">42 min</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">54 min</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">98%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">Orange (Urgent)</td>
                  <td className="px-6 py-4 text-sm text-center">18 min</td>
                  <td className="px-6 py-4 text-sm text-center">12 min</td>
                  <td className="px-6 py-4 text-sm text-center">68 min</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">98 min</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">92%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-yellow-600">Yellow (Semi-Urgent)</td>
                  <td className="px-6 py-4 text-sm text-center">45 min</td>
                  <td className="px-6 py-4 text-sm text-center">15 min</td>
                  <td className="px-6 py-4 text-sm text-center">82 min</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">142 min</td>
                  <td className="px-6 py-4 text-sm text-center text-yellow-600 font-semibold">78%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">Green (Non-Urgent)</td>
                  <td className="px-6 py-4 text-sm text-center">82 min</td>
                  <td className="px-6 py-4 text-sm text-center">18 min</td>
                  <td className="px-6 py-4 text-sm text-center">65 min</td>
                  <td className="px-6 py-4 text-sm text-center font-bold">165 min</td>
                  <td className="px-6 py-4 text-sm text-center text-orange-600 font-semibold">65%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTreatmentOutcomesReport = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treatment Outcomes Report</h2>
          <p className="text-slate-600 mt-1">Patient outcomes and disposition analysis</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Discharged Home</div>
            <div className="text-3xl font-bold text-green-900">445</div>
            <div className="text-xs text-slate-600 mt-1">57.9% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Admitted</div>
            <div className="text-3xl font-bold text-blue-900">198</div>
            <div className="text-xs text-slate-600 mt-1">25.8% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Transferred</div>
            <div className="text-3xl font-bold text-purple-900">82</div>
            <div className="text-xs text-slate-600 mt-1">10.7% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Left AMA</div>
            <div className="text-3xl font-bold text-orange-900">35</div>
            <div className="text-xs text-slate-600 mt-1">4.6% of total</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Deceased</div>
            <div className="text-3xl font-bold text-red-900">8</div>
            <div className="text-xs text-slate-600 mt-1">1.0% of total</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Admission Rates by Chief Complaint</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chief Complaint</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total Cases</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Admitted</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Admission Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr><td className="px-6 py-4 text-sm font-medium">Chest Pain</td><td className="px-6 py-4 text-sm text-center">97</td><td className="px-6 py-4 text-sm text-center">42</td><td className="px-6 py-4 text-sm text-center font-semibold">43.3%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Difficulty Breathing</td><td className="px-6 py-4 text-sm text-center">86</td><td className="px-6 py-4 text-sm text-center">38</td><td className="px-6 py-4 text-sm text-center font-semibold">44.2%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Abdominal Pain</td><td className="px-6 py-4 text-sm text-center">128</td><td className="px-6 py-4 text-sm text-center">35</td><td className="px-6 py-4 text-sm text-center font-semibold">27.3%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Trauma (MVA/Fall)</td><td className="px-6 py-4 text-sm text-center">130</td><td className="px-6 py-4 text-sm text-center">48</td><td className="px-6 py-4 text-sm text-center font-semibold">36.9%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Headache/Migraine</td><td className="px-6 py-4 text-sm text-center">113</td><td className="px-6 py-4 text-sm text-center">12</td><td className="px-6 py-4 text-sm text-center font-semibold">10.6%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Fever</td><td className="px-6 py-4 text-sm text-center">90</td><td className="px-6 py-4 text-sm text-center">15</td><td className="px-6 py-4 text-sm text-center font-semibold">16.7%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Minor Laceration/Wound</td><td className="px-6 py-4 text-sm text-center">47</td><td className="px-6 py-4 text-sm text-center">3</td><td className="px-6 py-4 text-sm text-center font-semibold">6.4%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Others</td><td className="px-6 py-4 text-sm text-center">77</td><td className="px-6 py-4 text-sm text-center">5</td><td className="px-6 py-4 text-sm text-center font-semibold">6.5%</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTraumaCasesReport = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trauma Cases Report</h2>
          <p className="text-slate-600 mt-1">Comprehensive trauma case analysis - Last 30 days</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-700">Major Trauma</span>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-900">42</div>
            <div className="text-xs text-red-700 mt-1">ISS &gt; 15</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-orange-700">Moderate Trauma</span>
              <Ambulance className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-900">58</div>
            <div className="text-xs text-orange-700 mt-1">ISS 9-15</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-700">Minor Trauma</span>
              <Heart className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-900">30</div>
            <div className="text-xs text-yellow-700 mt-1">ISS &lt; 9</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Total Trauma</span>
              <Activity className="h-8 w-8 text-slate-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">130</div>
            <div className="text-xs text-slate-700 mt-1">All severity levels</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Trauma Mechanism Distribution</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mechanism</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Cases</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Major</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Moderate</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Minor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Mortality</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr><td className="px-6 py-4 text-sm font-medium">Motor Vehicle Accident</td><td className="px-6 py-4 text-sm text-center font-bold">58</td><td className="px-6 py-4 text-sm text-center">22</td><td className="px-6 py-4 text-sm text-center">28</td><td className="px-6 py-4 text-sm text-center">8</td><td className="px-6 py-4 text-sm text-center text-red-600">3.4%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Fall from Height</td><td className="px-6 py-4 text-sm text-center font-bold">32</td><td className="px-6 py-4 text-sm text-center">12</td><td className="px-6 py-4 text-sm text-center">15</td><td className="px-6 py-4 text-sm text-center">5</td><td className="px-6 py-4 text-sm text-center text-red-600">6.3%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Motorcycle Accident</td><td className="px-6 py-4 text-sm text-center font-bold">18</td><td className="px-6 py-4 text-sm text-center">5</td><td className="px-6 py-4 text-sm text-center">10</td><td className="px-6 py-4 text-sm text-center">3</td><td className="px-6 py-4 text-sm text-center text-red-600">5.6%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Assault/Violence</td><td className="px-6 py-4 text-sm text-center font-bold">12</td><td className="px-6 py-4 text-sm text-center">2</td><td className="px-6 py-4 text-sm text-center">7</td><td className="px-6 py-4 text-sm text-center">3</td><td className="px-6 py-4 text-sm text-center text-green-600">0%</td></tr>
                <tr><td className="px-6 py-4 text-sm font-medium">Pedestrian vs Vehicle</td><td className="px-6 py-4 text-sm text-center font-bold">10</td><td className="px-6 py-4 text-sm text-center">1</td><td className="px-6 py-4 text-sm text-center">5</td><td className="px-6 py-4 text-sm text-center">4</td><td className="px-6 py-4 text-sm text-center text-red-600">10%</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    if (!selectedReport) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-24 w-24 text-slate-300 mb-6" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Select a Report</h3>
          <p className="text-slate-600 max-w-md">
            Choose a report category from the left sidebar, then select a specific report to view detailed analytics and data.
          </p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'triage-distribution':
        return renderTriageDistributionReport();
      case 'patient-volume':
        return renderPatientVolumeReport();
      case 'waiting-time':
        return renderWaitingTimeReport();
      case 'treatment-outcomes':
        return renderTreatmentOutcomesReport();
      case 'trauma-cases':
        return renderTraumaCasesReport();
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BarChart3 className="h-24 w-24 text-blue-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Report Coming Soon</h3>
            <p className="text-slate-600 max-w-md">
              This report is currently being developed and will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Emergency & Trauma Reports</h1>
              <p className="text-slate-600 mt-1">Comprehensive reporting and analytics dashboard</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 min-h-screen p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Report Categories</h3>
          <div className="space-y-2">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <div key={category.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(isActive ? null : category.id);
                      setSelectedReport(null);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg ${isActive ? 'bg-white/20' : category.color} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{category.name}</div>
                      <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                        {category.reports} reports
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Sub Reports */}
                  {isActive && reports[category.id as keyof typeof reports] && (
                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-200 pl-4">
                      {reports[category.id as keyof typeof reports].map((report) => (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReport(report.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedReport === report.id
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="font-medium text-sm">{report.name}</div>
                          <div className="text-xs text-slate-500 mt-1">{report.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 p-8">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}


