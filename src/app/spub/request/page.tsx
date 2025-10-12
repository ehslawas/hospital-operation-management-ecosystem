'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Send, 
  Plus, 
  Mail, 
  FileText, 
  User, 
  Pill, 
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Eye
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { mockSPUBRequests, mockPatients } from '@/features/spub/mockData';
import { SPUBRequest } from '@/features/spub/types';

export default function SPUBRequestPage() {
  const [requests, setRequests] = useState<SPUBRequest[]>(mockSPUBRequests);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SPUBRequest | null>(null);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = 
      request.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.patient.nric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      sent: 'bg-blue-100 text-blue-700 border-blue-300',
      acknowledged: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      processing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      ready: 'bg-green-100 text-green-700 border-green-300',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      routine: 'bg-blue-50 text-blue-700 border-blue-200',
      urgent: 'bg-orange-50 text-orange-700 border-orange-200',
      emergency: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[priority] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleSendRequest = (requestId: string) => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'sent', emailSentDate: new Date().toISOString() }
        : req
    ));
  };

  const toggleExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
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
              <Send className="w-8 h-8 mr-3 text-blue-600" />
              SPUB Requests
            </h1>
            <p className="text-lg text-gray-600">
              Create and manage medication requests to facilities
            </p>
          </div>
          <Button onClick={() => setShowNewRequestDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by patient name, NRIC, or request number..."
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
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <p className="font-semibold">Total Requests: {filteredRequests.length}</p>
                  <p>Pending: {filteredRequests.filter(r => r.status === 'pending').length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{request.patient.name}</CardTitle>
                      <Badge className={getStatusColor(request.status)} variant="outline">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)} variant="outline">
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {request.requestNumber}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {request.patient.nric}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Expected: {new Date(request.expectedStartDate).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSendRequest(request.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Request
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(request.id)}
                    >
                      {expandedRequest === request.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Target Facility</p>
                      <p className="font-medium text-sm">{request.targetFacility}</p>
                      <p className="text-xs text-gray-500">{request.targetFacilityCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Medications</p>
                      <p className="font-medium text-sm">{request.totalItems} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Requested By</p>
                      <p className="font-medium text-sm">{request.requestedBy}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${request.requestDate ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium">Requested</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300" />
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${request.emailSentDate ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium">Sent</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300" />
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${request.acknowledgementDate ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium">Acknowledged</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300" />
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${request.status === 'ready' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium">Ready</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedRequest === request.id && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Patient Details */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">Patient Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Age</p>
                          <p className="font-medium">{request.patient.age} years</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Gender</p>
                          <p className="font-medium">{request.patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Contact</p>
                          <p className="font-medium">{request.patient.contactNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Home Clinic</p>
                          <p className="font-medium">{request.patient.homeClinic}</p>
                        </div>
                      </div>
                      {request.patient.chronicConditions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-gray-500 text-xs mb-1">Chronic Conditions</p>
                          <div className="flex flex-wrap gap-1">
                            {request.patient.chronicConditions.map((condition, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {request.patient.allergies.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-500 text-xs mb-1">Allergies</p>
                          <div className="flex flex-wrap gap-1">
                            {request.patient.allergies.map((allergy, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Medications */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">Medications</h4>
                      <div className="space-y-2">
                        {request.medications.map((med, idx) => (
                          <div key={med.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {idx + 1}. {med.drugName} {med.strength}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {med.form} • Code: {med.drugCode}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {med.quantity} {med.unit}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Dosage:</span>
                                <span className="ml-1 font-medium">{med.dosage}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Frequency:</span>
                                <span className="ml-1 font-medium">{med.frequency}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Route:</span>
                                <span className="ml-1 font-medium">{med.route}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <span className="ml-1 font-medium">{med.duration} days</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs">
                              <span className="text-gray-500">Instructions:</span>
                              <span className="ml-1 text-gray-700">{med.instructions}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{request.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Print Request
                      </Button>
                      {request.status === 'sent' && (
                        <Button variant="outline" size="sm" className="text-orange-600 border-orange-300">
                          Resend Email
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No requests found</p>
                <Button onClick={() => setShowNewRequestDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Request Dialog (Placeholder) */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New SPUB Request</DialogTitle>
            <DialogDescription>
              Create a medication request for a patient to be sent to their home facility
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Patient</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.nric})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected Start Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Enter any additional notes..." />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">Next Steps:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Add medications to the request</li>
                <li>Review patient information and medication list</li>
                <li>Send request email to the target facility</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowNewRequestDialog(false)}>
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




