'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Download,
  Calendar,
  ArrowLeft,
  TrendingUp,
  Users,
  Package,
  Clock,
  BarChart3,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockStatistics, mockSPUBRequests, mockDispenseRecords } from '@/features/spub/mockData';

export default function SPUBReportsPage() {
  const [reportType, setReportType] = useState<string>('summary');
  const [dateFrom, setDateFrom] = useState('2025-10-01');
  const [dateTo, setDateTo] = useState('2025-10-11');

  const reportTypes = [
    {
      id: 'summary',
      name: 'SPUB Summary Report',
      description: 'Overview of all SPUB activities and statistics',
      icon: BarChart3,
    },
    {
      id: 'requests',
      name: 'Request Report',
      description: 'Detailed report of all medication requests',
      icon: FileText,
    },
    {
      id: 'dispensing',
      name: 'Dispensing Report',
      description: 'Patient dispensing activities and counseling records',
      icon: Package,
    },
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Processing times, efficiency metrics, and trends',
      icon: TrendingUp,
    },
    {
      id: 'patient',
      name: 'Patient Report',
      description: 'Patient-specific medication history and compliance',
      icon: Users,
    },
  ];

  const stats = mockStatistics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/spub">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-indigo-600" />
              SPUB Reports
            </h1>
            <p className="text-lg text-gray-600">
              Generate comprehensive reports for SPUB activities and analytics
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Oct 2025</div>
              <p className="text-xs text-gray-500 mt-1">Last 11 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{mockSPUBRequests.length}</div>
              <p className="text-xs text-gray-500 mt-1">Medication requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dispensed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {mockDispenseRecords.filter(d => d.status === 'dispensed').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Patients served</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.averageProcessingTime} <span className="text-base">days</span></div>
              <p className="text-xs text-gray-500 mt-1">Request to dispense</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Select report type and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((type) => (
            <Card 
              key={type.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                reportType === type.id ? 'border-indigo-500 border-2 bg-indigo-50' : ''
              }`}
              onClick={() => setReportType(type.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${
                    reportType === type.id ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <type.icon className={`w-6 h-6 ${
                      reportType === type.id ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                  </div>
                  {reportType === type.id && (
                    <Badge className="bg-indigo-600">Selected</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{type.name}</CardTitle>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={reportType === type.id ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview - {reportTypes.find(t => t.id === reportType)?.name}</CardTitle>
            <CardDescription>
              Preview of report data based on selected parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Active Patients</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalActivePatients}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">Dispensed This Month</p>
                    <p className="text-2xl font-bold text-green-900">{stats.dispensedThisMonth}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">Pending Requests</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.pendingRequests}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 mb-1">Low Stock Alerts</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.lowStockAlerts}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Key Performance Indicators</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Processing Time</span>
                      <span className="font-medium">{stats.averageProcessingTime} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Request Completion Rate</span>
                      <span className="font-medium">
                        {Math.round((mockSPUBRequests.filter(r => r.status === 'completed').length / mockSPUBRequests.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Patient Compliance Rate</span>
                      <span className="font-medium">
                        {Math.round((mockDispenseRecords.filter(d => d.status !== 'missed').length / mockDispenseRecords.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'requests' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Showing {mockSPUBRequests.length} requests for the selected period
                </p>
                {mockSPUBRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="border-l-4 border-l-blue-500 bg-blue-50 p-3 rounded-r">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{request.requestNumber}</p>
                        <p className="text-sm text-gray-600">{request.patient.name} - {request.targetFacility}</p>
                      </div>
                      <Badge>{request.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportType === 'dispensing' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Showing {mockDispenseRecords.length} dispensing records
                </p>
                {mockDispenseRecords.map((record) => (
                  <div key={record.id} className="border-l-4 border-l-purple-500 bg-purple-50 p-3 rounded-r">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{record.patient.name}</p>
                        <p className="text-sm text-gray-600">
                          {record.medications.length} medications - {new Date(record.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{record.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportType === 'performance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-3xl font-bold text-blue-900">{stats.averageProcessingTime}</p>
                    <p className="text-sm text-blue-700 mt-1">Avg. Days to Process</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-3xl font-bold text-green-900">98%</p>
                    <p className="text-sm text-green-700 mt-1">Accuracy Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-3xl font-bold text-purple-900">2.8</p>
                    <p className="text-sm text-purple-700 mt-1">Requests per Patient</p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'patient' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Patient medication history and compliance data
                </p>
                <div className="border rounded-lg p-4">
                  <p className="font-medium mb-2">Sample Patient Data</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Active Patients:</span>
                      <span className="font-medium">{stats.totalActivePatients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compliant Patients:</span>
                      <span className="font-medium text-green-600">
                        {Math.round(stats.totalActivePatients * 0.92)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missed Appointments:</span>
                      <span className="font-medium text-orange-600">
                        {mockDispenseRecords.filter(d => d.status === 'missed').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Automatically generated reports sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Monthly Summary Report</p>
                    <p className="text-sm text-gray-500">Generated on the 1st of each month</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Weekly Performance Report</p>
                    <p className="text-sm text-gray-500">Generated every Monday</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              Configure Scheduled Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







