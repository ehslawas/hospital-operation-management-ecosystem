'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PackageCheck, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  FileText,
  User,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Scan,
  Save,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { mockSPUBReceives, mockSPUBRequests } from '@/features/spub/mockData';
import { SPUBReceive, ReceivedMedication } from '@/features/spub/types';

export default function SPUBReceivePage() {
  const [receives, setReceives] = useState<SPUBReceive[]>(mockSPUBReceives);
  const [expandedReceive, setExpandedReceive] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');

  // Get pending requests (sent but not yet received)
  const pendingRequests = mockSPUBRequests.filter(
    req => ['sent', 'acknowledged', 'ready'].includes(req.status) && 
    !receives.some(rcv => rcv.requestId === req.id)
  );

  const filteredReceives = receives.filter((receive) => {
    const matchesStatus = filterStatus === 'all' || receive.status === filterStatus;
    const matchesSearch = 
      receive.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receive.receiveNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receive.requestNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      partial: 'bg-orange-100 text-orange-700 border-orange-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      discrepancy: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const toggleExpand = (receiveId: string) => {
    setExpandedReceive(expandedReceive === receiveId ? null : receiveId);
  };

  const getCompletionPercentage = (receive: SPUBReceive) => {
    if (receive.totalItemsExpected === 0) return 0;
    const completedItems = receive.medications.filter(m => m.status === 'completed').length;
    return Math.round((completedItems / receive.totalItemsExpected) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
              <PackageCheck className="w-8 h-8 mr-3 text-green-600" />
              SPUB Receive
            </h1>
            <p className="text-lg text-gray-600">
              Receive and verify medications from facilities
            </p>
          </div>
          <Button 
            onClick={() => setShowReceiveDialog(true)} 
            className="bg-green-600 hover:bg-green-700"
            disabled={pendingRequests.length === 0}
          >
            <Package className="w-4 h-4 mr-2" />
            Receive Medications
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Awaiting Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
              <p className="text-xs text-gray-500 mt-1">Requests sent to facilities</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {receives.filter(r => r.status === 'completed').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Fully received</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Partial Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {receives.filter(r => r.status === 'partial').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Incomplete deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Discrepancies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {receives.filter(r => r.discrepancies).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by patient name, receive number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="discrepancy">Discrepancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    {pendingRequests.length} Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Receipt
                  </p>
                  <p className="text-sm text-blue-700">
                    The following requests have been sent to facilities and are awaiting receipt:
                  </p>
                  <div className="mt-2 space-y-1">
                    {pendingRequests.slice(0, 3).map(req => (
                      <p key={req.id} className="text-sm text-blue-800">
                        • {req.requestNumber} - {req.patient.name} ({req.targetFacility})
                      </p>
                    ))}
                    {pendingRequests.length > 3 && (
                      <p className="text-sm text-blue-800">
                        ... and {pendingRequests.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => setShowReceiveDialog(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Receive
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receives List */}
        <div className="space-y-4">
          {filteredReceives.map((receive) => (
            <Card key={receive.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{receive.patient.name}</CardTitle>
                      <Badge className={getStatusColor(receive.status)} variant="outline">
                        {receive.status.charAt(0).toUpperCase() + receive.status.slice(1)}
                      </Badge>
                      {receive.discrepancies && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Discrepancy
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {receive.receiveNumber}
                      </span>
                      <span className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        Request: {receive.requestNumber}
                      </span>
                      {receive.receivedDate && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(receive.receivedDate).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpand(receive.id)}
                  >
                    {expandedReceive === receive.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Source Facility</p>
                      <p className="font-medium text-sm">{receive.sourceFacility}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Items Expected</p>
                      <p className="font-medium text-sm">{receive.totalItemsExpected} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Items Received</p>
                      <p className="font-medium text-sm">{receive.totalItemsReceived} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Received By</p>
                      <p className="font-medium text-sm">{receive.receivedBy || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completion</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {getCompletionPercentage(receive)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        receive.status === 'completed' ? 'bg-green-600' : 
                        receive.status === 'partial' ? 'bg-orange-600' : 
                        'bg-yellow-600'
                      }`}
                      style={{ width: `${getCompletionPercentage(receive)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedReceive === receive.id && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Medications */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">Received Medications</h4>
                      <div className="space-y-2">
                        {receive.medications.map((med, idx) => {
                          // Find the medication details from the request
                          const request = mockSPUBRequests.find(r => r.id === receive.requestId);
                          const medDetails = request?.medications.find(m => m.id === med.medicationId);
                          
                          return (
                            <div 
                              key={idx} 
                              className={`border rounded-lg p-3 ${
                                med.status === 'completed' ? 'bg-green-50 border-green-200' :
                                med.status === 'partial' ? 'bg-orange-50 border-orange-200' :
                                'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">
                                      {medDetails?.drugName} {medDetails?.strength}
                                    </p>
                                    <Badge 
                                      className={
                                        med.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        med.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                      }
                                      variant="outline"
                                    >
                                      {med.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {medDetails?.form}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                                <div>
                                  <p className="text-xs text-gray-500">Expected</p>
                                  <p className="font-medium text-sm">{med.expectedQuantity} {medDetails?.unit}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Received</p>
                                  <p className={`font-medium text-sm ${
                                    med.receivedQuantity < med.expectedQuantity ? 'text-orange-600' : 'text-green-600'
                                  }`}>
                                    {med.receivedQuantity} {medDetails?.unit}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Batch Number</p>
                                  <p className="font-medium text-sm">{med.batchNumber}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Expiry Date</p>
                                  <p className="font-medium text-sm">
                                    {new Date(med.expiryDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {med.receivedDate && (
                                <div className="text-xs text-gray-600 mb-1">
                                  Received on {new Date(med.receivedDate).toLocaleString()} by {med.receivedBy}
                                </div>
                              )}

                              {med.discrepancyReason && (
                                <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-200">
                                  <p className="text-xs font-medium text-orange-900 flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Discrepancy Note
                                  </p>
                                  <p className="text-xs text-orange-800 mt-1">{med.discrepancyReason}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    {receive.notes && (
                      <div className={`rounded-lg p-3 ${
                        receive.discrepancies ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50'
                      }`}>
                        <p className="text-xs text-gray-500 mb-1">Receiving Notes</p>
                        <p className="text-sm text-gray-700">{receive.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Print Receipt
                      </Button>
                      {receive.status === 'partial' && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Follow Up
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredReceives.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No received medications found</p>
                {pendingRequests.length > 0 && (
                  <Button 
                    onClick={() => setShowReceiveDialog(true)} 
                    className="mt-4"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Receive Medications
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Medications</DialogTitle>
            <DialogDescription>
              Select a request and enter received medication details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Request</Label>
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pending request" />
                </SelectTrigger>
                <SelectContent>
                  {pendingRequests.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.requestNumber} - {req.patient.name} ({req.targetFacility})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRequestId && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Request Details</p>
                  {(() => {
                    const selectedRequest = pendingRequests.find(r => r.id === selectedRequestId);
                    return selectedRequest ? (
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>Patient: {selectedRequest.patient.name}</p>
                        <p>Facility: {selectedRequest.targetFacility}</p>
                        <p>Items: {selectedRequest.totalItems} medications</p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-3">
                  <Label>Scan/Enter Batch Numbers</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    {mockSPUBRequests.find(r => r.id === selectedRequestId)?.medications.map((med, idx) => (
                      <div key={med.id} className="border-b pb-3 last:border-b-0">
                        <p className="font-medium text-sm mb-2">{med.drugName} {med.strength}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Quantity Received</Label>
                            <Input 
                              type="number" 
                              placeholder={`Expected: ${med.quantity}`}
                              defaultValue={med.quantity}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Batch Number</Label>
                            <Input placeholder="Scan or enter" />
                          </div>
                          <div>
                            <Label className="text-xs">Expiry Date</Label>
                            <Input type="date" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Receiving Notes</Label>
                  <Textarea placeholder="Enter any notes about the receipt..." />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowReceiveDialog(false)}
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedRequestId}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




