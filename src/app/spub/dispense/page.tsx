'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Pill, 
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  MessageSquare,
  Printer,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { mockDispenseRecords } from '@/features/spub/mockData';
import { DispenseRecord } from '@/features/spub/types';

export default function SPUBDispensePage() {
  const [dispenseRecords, setDispenseRecords] = useState<DispenseRecord[]>(mockDispenseRecords);
  const [expandedDispense, setExpandedDispense] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [selectedDispense, setSelectedDispense] = useState<DispenseRecord | null>(null);
  const [counselingChecklist, setCounselingChecklist] = useState({
    medicationPurpose: false,
    dosageInstructions: false,
    sideEffects: false,
    storage: false,
    followUp: false,
  });

  const filteredRecords = dispenseRecords.filter((record) => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesSearch = 
      record.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patient.nric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group by date
  const today = new Date().toDateString();
  const todayRecords = filteredRecords.filter(r => 
    new Date(r.scheduledDate).toDateString() === today
  );
  const upcomingRecords = filteredRecords.filter(r => 
    new Date(r.scheduledDate) > new Date() && 
    new Date(r.scheduledDate).toDateString() !== today
  );
  const pastRecords = filteredRecords.filter(r => 
    new Date(r.scheduledDate) < new Date() && 
    new Date(r.scheduledDate).toDateString() !== today
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
      ready: 'bg-green-100 text-green-700 border-green-300',
      dispensed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      missed: 'bg-red-100 text-red-700 border-red-300',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const toggleExpand = (dispenseId: string) => {
    setExpandedDispense(expandedDispense === dispenseId ? null : dispenseId);
  };

  const handleStartDispensing = (record: DispenseRecord) => {
    setSelectedDispense(record);
    setShowDispenseDialog(true);
    setCounselingChecklist({
      medicationPurpose: false,
      dosageInstructions: false,
      sideEffects: false,
      storage: false,
      followUp: false,
    });
  };

  const handleCompleteDispensing = () => {
    if (selectedDispense) {
      const allChecked = Object.values(counselingChecklist).every(v => v);
      if (!allChecked) {
        alert('Please complete all counseling points before dispensing');
        return;
      }

      setDispenseRecords(dispenseRecords.map(record => 
        record.id === selectedDispense.id 
          ? { 
              ...record, 
              status: 'dispensed',
              dispensedDate: new Date().toISOString(),
              dispensedBy: 'Pharmacist Sarah Lee',
              counselingCompleted: true,
              nextVisitDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          : record
      ));
      setShowDispenseDialog(false);
      setSelectedDispense(null);
    }
  };

  const DispenseCard = ({ record }: { record: DispenseRecord }) => (
    <Card key={record.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className={`${
        record.status === 'ready' ? 'bg-green-50' :
        record.status === 'dispensed' ? 'bg-emerald-50' :
        record.status === 'missed' ? 'bg-red-50' :
        'bg-gray-50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">{record.patient.name}</CardTitle>
              <Badge className={getStatusColor(record.status)} variant="outline">
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Badge>
              {record.counselingCompleted && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Counseled
                </Badge>
              )}
            </div>
            <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {record.patient.nric}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(record.scheduledDate).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                {record.patient.contactNumber}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {(record.status === 'ready' || record.status === 'scheduled') && (
              <Button 
                size="sm" 
                onClick={() => handleStartDispensing(record)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Pill className="w-4 h-4 mr-2" />
                Dispense
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleExpand(record.id)}
            >
              {expandedDispense === record.id ? (
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
            <Pill className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Medications</p>
              <p className="font-medium text-sm">{record.medications.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Home Clinic</p>
              <p className="font-medium text-sm">{record.patient.homeClinic}</p>
            </div>
          </div>
          {record.dispensedDate && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Dispensed By</p>
                <p className="font-medium text-sm">{record.dispensedBy}</p>
                <p className="text-xs text-gray-500">
                  {new Date(record.dispensedDate).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {expandedDispense === record.id && (
          <div className="space-y-4 pt-4 border-t">
            {/* Patient Info */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">Patient Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Age</p>
                  <p className="font-medium">{record.patient.age} years</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Gender</p>
                  <p className="font-medium">{record.patient.gender}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="font-medium text-xs">{record.patient.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Facility Code</p>
                  <p className="font-medium">{record.patient.homeFacilityCode}</p>
                </div>
              </div>
              {record.patient.chronicConditions.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-500 text-xs mb-1">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {record.patient.chronicConditions.map((condition, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {record.patient.allergies.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-900 font-semibold text-sm flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Allergies
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {record.patient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medications */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">Medication List</h4>
              <div className="space-y-2">
                {record.medications.map((med, idx) => (
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
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
                    <div className="bg-blue-50 rounded p-2 text-xs">
                      <span className="font-medium text-blue-900">Instructions: </span>
                      <span className="text-blue-800">{med.instructions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Visit */}
            {record.nextVisitDate && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-sm font-medium text-green-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Next Visit Scheduled
                </p>
                <p className="text-sm text-green-800 mt-1">
                  {new Date(record.nextVisitDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            {/* Notes */}
            {record.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Dispensing Notes</p>
                <p className="text-sm text-gray-700">{record.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-2" />
                SMS Reminder
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
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
              <Pill className="w-8 h-8 mr-3 text-purple-600" />
              SPUB Dispense
            </h1>
            <p className="text-lg text-gray-600">
              Dispense medications to patients with proper counseling
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ready to Dispense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dispenseRecords.filter(r => r.status === 'ready').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Medications received</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {todayRecords.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Patients expected</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dispensed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dispenseRecords.filter(r => 
                  r.status === 'dispensed' && 
                  r.dispensedDate &&
                  new Date(r.dispensedDate).toDateString() === today
                ).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Missed Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dispenseRecords.filter(r => r.status === 'missed').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need follow-up</p>
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
                  placeholder="Search by patient name or NRIC..."
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="dispensed">Dispensed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dispensing Records Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today ({todayRecords.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingRecords.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Past ({pastRecords.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayRecords.length > 0 ? (
              todayRecords.map(record => <DispenseCard key={record.id} record={record} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No patients scheduled for today</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingRecords.length > 0 ? (
              upcomingRecords.map(record => <DispenseCard key={record.id} record={record} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming appointments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastRecords.length > 0 ? (
              pastRecords.map(record => <DispenseCard key={record.id} record={record} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No past records</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dispensing Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispense Medications</DialogTitle>
            <DialogDescription>
              Complete medication counseling and dispense to patient
            </DialogDescription>
          </DialogHeader>
          {selectedDispense && (
            <div className="space-y-4 py-4">
              {/* Patient Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Name: </span>
                    <span className="font-medium">{selectedDispense.patient.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">NRIC: </span>
                    <span className="font-medium">{selectedDispense.patient.nric}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Age: </span>
                    <span className="font-medium">{selectedDispense.patient.age} years</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Gender: </span>
                    <span className="font-medium">{selectedDispense.patient.gender}</span>
                  </div>
                </div>
                {selectedDispense.patient.allergies.length > 0 && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <p className="text-red-900 font-semibold text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Allergies: {selectedDispense.patient.allergies.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <h3 className="font-semibold mb-2">Medications to Dispense</h3>
                <div className="space-y-2">
                  {selectedDispense.medications.map((med, idx) => (
                    <div key={med.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{med.drugName} {med.strength}</p>
                        <Badge>{med.quantity} {med.unit}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                      <p className="text-xs text-blue-700 mt-1">{med.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counseling Checklist */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Counseling Checklist
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'medicationPurpose', label: 'Explained purpose of each medication' },
                    { key: 'dosageInstructions', label: 'Reviewed dosage and timing instructions' },
                    { key: 'sideEffects', label: 'Discussed potential side effects and what to watch for' },
                    { key: 'storage', label: 'Provided storage instructions' },
                    { key: 'followUp', label: 'Confirmed next visit date and follow-up plan' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={counselingChecklist[item.key as keyof typeof counselingChecklist]}
                        onCheckedChange={(checked) => 
                          setCounselingChecklist({
                            ...counselingChecklist,
                            [item.key]: checked
                          })
                        }
                      />
                      <label
                        htmlFor={item.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Dispensing Notes (Optional)</Label>
                <Textarea 
                  placeholder="Enter any additional notes or patient concerns..."
                  rows={3}
                />
              </div>

              {/* Next Visit */}
              <div className="space-y-2">
                <Label>Schedule Next Visit</Label>
                <Input type="date" defaultValue={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteDispensing}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!Object.values(counselingChecklist).every(v => v)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Dispensing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




