'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Send, 
  PackageCheck, 
  Pill, 
  BarChart3, 
  Users, 
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockStatistics, mockSPUBRequests, mockDispenseRecords } from '@/features/spub/mockData';

export default function SPUBDashboard() {
  const stats = mockStatistics;
  const recentRequests = mockSPUBRequests.slice(0, 3);
  const upcomingDispensing = mockDispenseRecords.filter(d => d.status === 'ready' || d.status === 'scheduled').slice(0, 3);

  const workflowSteps = [
    {
      title: 'Request',
      description: 'Create medication requests for patients',
      icon: Send,
      href: '/spub/request',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: stats.pendingRequests,
      countLabel: 'Pending',
    },
    {
      title: 'Receive',
      description: 'Receive and verify medications from facilities',
      icon: PackageCheck,
      href: '/spub/receive',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: stats.awaitingReceipt,
      countLabel: 'Awaiting',
    },
    {
      title: 'Dispense',
      description: 'Dispense medications to patients',
      icon: Pill,
      href: '/spub/dispense',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: stats.readyToDispense,
      countLabel: 'Ready',
    },
    {
      title: 'Monitor',
      description: 'Track medication balances and stock levels',
      icon: BarChart3,
      href: '/spub/monitor',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: stats.lowStockAlerts,
      countLabel: 'Low Stock',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      acknowledged: 'bg-indigo-100 text-indigo-700',
      processing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-emerald-100 text-emerald-700',
      scheduled: 'bg-purple-100 text-purple-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              SPUB & VAS
            </h1>
            <p className="text-lg text-gray-600">
              Integrated Dispensing System - Inter-facility medication transfers with balance tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/spub/reports">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Active Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalActivePatients}</div>
              <p className="text-xs text-gray-500 mt-1">Currently enrolled in SPUB</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Dispensed This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.dispensedThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">Total dispensing sessions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Requests This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.requestsThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">Medication requests sent</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Avg Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.averageProcessingTime} <span className="text-lg">days</span></div>
              <p className="text-xs text-gray-500 mt-1">From request to dispense</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Steps */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Workflow Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step, index) => (
              <Link key={index} href={step.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full border-2 hover:border-gray-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${step.bgColor}`}>
                        <step.icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <Badge variant="secondary" className="text-lg font-semibold">
                        {step.count}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4">{step.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{step.countLabel}</span>
                      <Button variant="ghost" size="sm" className="h-8">
                        View ?
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Requests & Upcoming Dispensing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2 text-blue-600" />
                Recent Requests
              </CardTitle>
              <CardDescription>Latest medication requests to facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{request.patient.name}</p>
                        <p className="text-sm text-gray-500">{request.requestNumber}</p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {request.totalItems} medication{request.totalItems > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-500">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      ? {request.targetFacility}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/spub/request">View All Requests</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Dispensing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="w-5 h-5 mr-2 text-purple-600" />
                Upcoming Dispensing
              </CardTitle>
              <CardDescription>Patients scheduled for medication collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDispensing.map((dispense) => (
                  <div key={dispense.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{dispense.patient.name}</p>
                        <p className="text-sm text-gray-500">{dispense.patient.nric}</p>
                      </div>
                      <Badge className={getStatusColor(dispense.status)}>
                        {dispense.status.charAt(0).toUpperCase() + dispense.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {dispense.medications.length} medication{dispense.medications.length > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-purple-600">
                        {new Date(dispense.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/spub/dispense">View All Dispensing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.lowStockAlerts > 0 && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800">
                You have {stats.lowStockAlerts} medication{stats.lowStockAlerts > 1 ? 's' : ''} with low stock levels. 
                <Link href="/spub/monitor" className="font-semibold underline ml-1">
                  Review now
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





