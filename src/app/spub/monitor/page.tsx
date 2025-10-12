'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Pill,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  Eye
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { mockMedicationBalances } from '@/features/spub/mockData';
import { MedicationBalance } from '@/features/spub/types';

export default function SPUBMonitorPage() {
  const [balances, setBalances] = useState<MedicationBalance[]>(mockMedicationBalances);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPatient, setFilterPatient] = useState<string>('all');

  const uniquePatients = Array.from(new Set(balances.map(b => b.patientId)))
    .map(id => balances.find(b => b.patientId === id))
    .filter(Boolean) as MedicationBalance[];

  const filteredBalances = balances.filter((balance) => {
    const matchesSearch = 
      balance.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      balance.drugName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || balance.status === filterStatus;
    const matchesPatient = filterPatient === 'all' || balance.patientId === filterPatient;
    return matchesSearch && matchesStatus && matchesPatient;
  });

  // Statistics
  const stats = {
    totalMedications: balances.length,
    adequate: balances.filter(b => b.status === 'adequate').length,
    low: balances.filter(b => b.status === 'low').length,
    critical: balances.filter(b => b.status === 'critical').length,
    expired: balances.filter(b => b.status === 'expired').length,
  };

  // Group balances by patient
  const byPatient = filteredBalances.reduce((acc, balance) => {
    if (!acc[balance.patientId]) {
      acc[balance.patientId] = {
        patientName: balance.patientName,
        patientId: balance.patientId,
        medications: [],
      };
    }
    acc[balance.patientId].medications.push(balance);
    return acc;
  }, {} as Record<string, { patientName: string; patientId: string; medications: MedicationBalance[] }>);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      adequate: 'bg-green-100 text-green-700 border-green-300',
      low: 'bg-orange-100 text-orange-700 border-orange-300',
      critical: 'bg-red-100 text-red-700 border-red-300',
      expired: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adequate':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBalancePercentage = (balance: MedicationBalance) => {
    if (balance.totalReceived === 0) return 0;
    return Math.round((balance.balance / balance.totalReceived) * 100);
  };

  const isExpiringWoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
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
              <BarChart3 className="w-8 h-8 mr-3 text-orange-600" />
              SPUB Monitor
            </h1>
            <p className="text-lg text-gray-600">
              Track medication balances and stock levels for all patients
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Total Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMedications}</div>
              <p className="text-xs text-gray-500 mt-1">Being monitored</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Adequate Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.adequate}</div>
              <p className="text-xs text-gray-500 mt-1">{Math.round((stats.adequate / stats.totalMedications) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.low}</div>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-gray-500 mt-1">Urgent action needed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{stats.expired}</div>
              <p className="text-xs text-gray-500 mt-1">Remove from stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {(stats.critical > 0 || stats.expired > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">Urgent Attention Required</p>
                  <div className="space-y-1 text-sm text-red-800">
                    {stats.critical > 0 && (
                      <p>• {stats.critical} medication{stats.critical > 1 ? 's' : ''} at critical stock levels</p>
                    )}
                    {stats.expired > 0 && (
                      <p>• {stats.expired} medication{stats.expired > 1 ? 's' : ''} expired or expiring soon</p>
                    )}
                  </div>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  Take Action
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by patient or medication..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="adequate">Adequate</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by Patient</Label>
                <Select value={filterPatient} onValueChange={setFilterPatient}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    {uniquePatients.map((patient) => (
                      <SelectItem key={patient.patientId} value={patient.patientId}>
                        {patient.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterPatient('all');
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Views */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="patient">By Patient</TabsTrigger>
          </TabsList>

          {/* Table View */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Medication Balance Overview</CardTitle>
                <CardDescription>
                  Complete inventory of all patient medications with stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Status</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Dispensed</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Next Visit</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBalances.length > 0 ? (
                        filteredBalances.map((balance) => (
                          <TableRow key={balance.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(balance.status)}
                                <Badge className={getStatusColor(balance.status)} variant="outline">
                                  {balance.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{balance.patientName}</p>
                                <p className="text-xs text-gray-500">{balance.patientId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{balance.drugName}</p>
                                <p className="text-xs text-gray-500">{balance.strength}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{balance.totalReceived}</span>
                              <span className="text-xs text-gray-500 ml-1">{balance.unit}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{balance.totalDispensed}</span>
                              <span className="text-xs text-gray-500 ml-1">{balance.unit}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold ${
                                balance.status === 'critical' ? 'text-red-600' :
                                balance.status === 'low' ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {balance.balance}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">{balance.unit}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      getBalancePercentage(balance) < 25 ? 'bg-red-500' :
                                      getBalancePercentage(balance) < 50 ? 'bg-orange-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${getBalancePercentage(balance)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-10 text-right">
                                  {getBalancePercentage(balance)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className={`text-sm ${
                                  isExpiringWoon(balance.expiryDate) ? 'text-orange-600 font-medium' : ''
                                }`}>
                                  {new Date(balance.expiryDate).toLocaleDateString()}
                                </p>
                                {isExpiringWoon(balance.expiryDate) && (
                                  <p className="text-xs text-orange-600">Expiring soon</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {balance.nextScheduledDate ? (
                                <p className="text-sm">
                                  {new Date(balance.nextScheduledDate).toLocaleDateString()}
                                </p>
                              ) : (
                                <span className="text-xs text-gray-400">Not scheduled</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {balance.status === 'low' || balance.status === 'critical' && (
                                  <Button variant="ghost" size="sm" className="text-orange-600">
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                            No medication balances found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Patient View */}
          <TabsContent value="patient" className="space-y-4">
            {Object.values(byPatient).map((patient) => {
              const lowCount = patient.medications.filter(m => m.status === 'low' || m.status === 'critical').length;
              const adequateCount = patient.medications.filter(m => m.status === 'adequate').length;
              
              return (
                <Card key={patient.patientId}>
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-600" />
                          {patient.patientName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Patient ID: {patient.patientId} • {patient.medications.length} medication{patient.medications.length > 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {adequateCount > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {adequateCount} Adequate
                          </Badge>
                        )}
                        {lowCount > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {lowCount} Low
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {patient.medications.map((med) => (
                        <div 
                          key={med.id} 
                          className={`border rounded-lg p-4 ${
                            med.status === 'critical' ? 'bg-red-50 border-red-200' :
                            med.status === 'low' ? 'bg-orange-50 border-orange-200' :
                            'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{med.drugName}</p>
                                <Badge className={getStatusColor(med.status)} variant="outline">
                                  {med.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{med.strength}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${
                                med.status === 'critical' ? 'text-red-600' :
                                med.status === 'low' ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {med.balance}
                              </p>
                              <p className="text-xs text-gray-500">{med.unit} remaining</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Received</p>
                              <p className="font-medium">{med.totalReceived} {med.unit}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Dispensed</p>
                              <p className="font-medium">{med.totalDispensed} {med.unit}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Expiry Date</p>
                              <p className={`font-medium ${
                                isExpiringWoon(med.expiryDate) ? 'text-orange-600' : ''
                              }`}>
                                {new Date(med.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Next Visit</p>
                              <p className="font-medium">
                                {med.nextScheduledDate ? 
                                  new Date(med.nextScheduledDate).toLocaleDateString() : 
                                  'Not set'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Stock Level</span>
                              <span className="text-xs font-semibold">{getBalancePercentage(med)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  getBalancePercentage(med) < 25 ? 'bg-red-500' :
                                  getBalancePercentage(med) < 50 ? 'bg-orange-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${getBalancePercentage(med)}%` }}
                              />
                            </div>
                          </div>

                          {(med.status === 'low' || med.status === 'critical') && (
                            <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded">
                              <p className="text-xs font-medium text-orange-900 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Action Required: Request refill from home facility
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {Object.keys(byPatient).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No patient medication balances found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



