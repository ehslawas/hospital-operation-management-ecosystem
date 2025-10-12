'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  User, 
  FileText, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Phone,
  Calendar,
  Pill,
  Activity,
  AlertTriangle,
  Printer,
  Save,
  Send,
  ChevronRight
} from 'lucide-react';

type VisitType = 'new_prescription' | 'collect_balance' | 'walk_in';
type QueueStatus = 'waiting' | 'in_progress' | 'completed';

interface QueueItem {
  id: string;
  patientMrn: string;
  patientName: string;
  patientNric: string;
  visitType: VisitType;
  status: QueueStatus;
  queueNumber: string;
  arrivalTime: string;
  registrationTime: Date;
  priority: 'normal' | 'urgent' | 'elderly';
}

interface PatientDetails {
  mrn: string;
  nric: string;
  name: string;
  dob: string;
  age: number;
  phone: string;
  address: string;
  allergies: string[];
  renalStatus: string;
  hepaticStatus: string;
}

interface PrescriptionItem {
  id: string;
  medicationCode: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: number;
  instructions: string;
  status: 'pending' | 'verified' | 'dispensed';
  batchNo?: string;
  expiryDate?: string;
}

interface MedicationHistory {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  facility: string;
}

export default function OutpatientCounter() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'screening' | 'dispensing' | 'counseling' | 'history'>('screening');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [currentPrescriptions, setCurrentPrescriptions] = useState<PrescriptionItem[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<MedicationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<PrescriptionItem | null>(null);
  const [interventionData, setInterventionData] = useState({
    reason: '',
    proposedDrug: '',
    proposedDosage: '',
    proposedFrequency: '',
    proposedQuantity: '',
    actionType: 'request' as 'request' | 'consent'
  });
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  const [prescriptionDispensed, setPrescriptionDispensed] = useState(false);
  const [counselingModalOpen, setCounselingModalOpen] = useState(false);
  const [selectedMedsForCounseling, setSelectedMedsForCounseling] = useState<string[]>([]);
  const [printLabelModalOpen, setPrintLabelModalOpen] = useState(false);
  const [labelLanguage, setLabelLanguage] = useState<'en' | 'bm'>('en');

  // Mock data - Replace with API calls
  useEffect(() => {
    const now = new Date();
    const mockQueue: QueueItem[] = [
      {
        id: '1',
        patientMrn: 'MRN001234',
        patientName: 'Ahmad bin Abdullah',
        patientNric: '850615-10-5234',
        visitType: 'new_prescription',
        status: 'waiting',
        queueNumber: 'A001',
        arrivalTime: '08:30 AM',
        registrationTime: new Date(now.getTime() - 90 * 60000),
        priority: 'normal'
      },
      {
        id: '2',
        patientMrn: 'MRN005678',
        patientName: 'Siti Nurhaliza binti Hassan',
        patientNric: '630412-08-7654',
        visitType: 'collect_balance',
        status: 'waiting',
        queueNumber: 'A002',
        arrivalTime: '08:45 AM',
        registrationTime: new Date(now.getTime() - 75 * 60000),
        priority: 'elderly'
      },
      {
        id: '3',
        patientMrn: 'MRN009012',
        patientName: 'Tan Mei Ling',
        patientNric: '920823-14-3456',
        visitType: 'walk_in',
        status: 'waiting',
        queueNumber: 'A003',
        arrivalTime: '09:00 AM',
        registrationTime: new Date(now.getTime() - 60 * 60000),
        priority: 'urgent'
      },
      {
        id: '4',
        patientMrn: 'MRN003456',
        patientName: 'Kumar s/o Rajan',
        patientNric: '880305-10-1234',
        visitType: 'new_prescription',
        status: 'waiting',
        queueNumber: 'A004',
        arrivalTime: '09:15 AM',
        registrationTime: new Date(now.getTime() - 45 * 60000),
        priority: 'normal'
      },
      {
        id: '5',
        patientMrn: 'MRN007890',
        patientName: 'Wong Li Hua',
        patientNric: '950918-07-2345',
        visitType: 'collect_balance',
        status: 'waiting',
        queueNumber: 'A005',
        arrivalTime: '09:30 AM',
        registrationTime: new Date(now.getTime() - 30 * 60000),
        priority: 'normal'
      },
      {
        id: '6',
        patientMrn: 'MRN012345',
        patientName: 'Raj Kumar a/l Suresh',
        patientNric: '900715-05-6789',
        visitType: 'new_prescription',
        status: 'waiting',
        queueNumber: 'A006',
        arrivalTime: '09:45 AM',
        registrationTime: new Date(now.getTime() - 15 * 60000),
        priority: 'normal'
      },
      {
        id: '7',
        patientMrn: 'MRN023456',
        patientName: 'Fatimah binti Ismail',
        patientNric: '601130-12-4567',
        visitType: 'collect_balance',
        status: 'waiting',
        queueNumber: 'A007',
        arrivalTime: '10:00 AM',
        registrationTime: new Date(now.getTime() - 5 * 60000),
        priority: 'elderly'
      },
      {
        id: '8',
        patientMrn: 'MRN034567',
        patientName: 'Lee Chong Wei',
        patientNric: '821020-14-5678',
        visitType: 'walk_in',
        status: 'waiting',
        queueNumber: 'A008',
        arrivalTime: '10:15 AM',
        registrationTime: new Date(now.getTime() - 2 * 60000),
        priority: 'normal'
      },
      {
        id: '9',
        patientMrn: 'MRN045678',
        patientName: 'Muthu a/l Govindasamy',
        patientNric: '870525-10-8901',
        visitType: 'new_prescription',
        status: 'waiting',
        queueNumber: 'A009',
        arrivalTime: '10:30 AM',
        registrationTime: new Date(now.getTime() - 1 * 60000),
        priority: 'urgent'
      },
      {
        id: '10',
        patientMrn: 'MRN056789',
        patientName: 'Nurul Ain binti Ahmad',
        patientNric: '991205-11-2345',
        visitType: 'collect_balance',
        status: 'waiting',
        queueNumber: 'A010',
        arrivalTime: '10:45 AM',
        registrationTime: new Date(now.getTime() - 0.5 * 60000),
        priority: 'normal'
      },
    ];
    setQueue(mockQueue);
  }, []);

  const loadPatientData = async (patientMrn: string, patientName: string) => {
    setLoading(true);
    // Mock patient details
    const mockPatient: PatientDetails = {
      mrn: patientMrn,
      nric: '850615-10-5234',
      name: patientName,
      dob: '1985-06-15',
      age: 38,
      phone: '012-3456789',
      address: 'No. 123, Jalan Merdeka, Taman Setia, 50000 Kuala Lumpur',
      allergies: ['Penicillin', 'Aspirin'],
      renalStatus: 'Normal (eGFR: 95 mL/min)',
      hepaticStatus: 'Normal'
    };

    const mockPrescriptions: PrescriptionItem[] = [
      {
        id: 'rx1',
        medicationCode: 'TAB001',
        medicationName: 'Tab. Metformin 500 mg',
        dosage: '1000 mg',
        frequency: 'BD (Twice daily)',
        route: 'PO (Oral)',
        duration: '30 days',
        quantity: 60,
        instructions: 'Take with meals',
        status: 'pending',
        batchNo: 'MET2024A001',
        expiryDate: '12/2025'
      },
      {
        id: 'rx2',
        medicationCode: 'TAB045',
        medicationName: 'Tab. Amlodipine 5 mg',
        dosage: '5 mg',
        frequency: 'OD (Once daily)',
        route: 'PO (Oral)',
        duration: '30 days',
        quantity: 30,
        instructions: 'Take in the morning',
        status: 'pending',
        batchNo: 'AML2024B023',
        expiryDate: '03/2026'
      },
      {
        id: 'rx3',
        medicationCode: 'TAB089',
        medicationName: 'Tab. Simvastatin 20 mg',
        dosage: '20 mg',
        frequency: 'ON (Once at night)',
        route: 'PO (Oral)',
        duration: '30 days',
        quantity: 30,
        instructions: 'Take at bedtime',
        status: 'pending',
        batchNo: 'SIM2024C015',
        expiryDate: '08/2025'
      },
      {
        id: 'rx4',
        medicationCode: 'TAB125',
        medicationName: 'Tab. Aspirin 100 mg (Cardio)',
        dosage: '100 mg',
        frequency: 'OD (Once daily)',
        route: 'PO (Oral)',
        duration: '30 days',
        quantity: 30,
        instructions: 'Take after meal',
        status: 'pending',
        batchNo: 'ASP2024D042',
        expiryDate: '11/2025'
      },
    ];

    const mockHistory: MedicationHistory[] = [
      {
        id: 'h1',
        date: '2024-09-15',
        medication: 'Tab. Metformin 500 mg',
        dosage: '1000 mg BD',
        frequency: 'BD',
        prescriber: 'Dr. Lim Wei Ming',
        facility: 'Hospital Kuala Lumpur'
      },
      {
        id: 'h2',
        date: '2024-09-15',
        medication: 'Tab. Amlodipine 5 mg',
        dosage: '5 mg OD',
        frequency: 'OD',
        prescriber: 'Dr. Lim Wei Ming',
        facility: 'Hospital Kuala Lumpur'
      },
      {
        id: 'h3',
        date: '2024-08-15',
        medication: 'Tab. Metformin 500 mg',
        dosage: '500 mg BD',
        frequency: 'BD',
        prescriber: 'Dr. Lim Wei Ming',
        facility: 'Hospital Kuala Lumpur'
      },
      {
        id: 'h4',
        date: '2024-08-15',
        medication: 'Tab. Amlodipine 5 mg',
        dosage: '5 mg OD',
        frequency: 'OD',
        prescriber: 'Dr. Lim Wei Ming',
        facility: 'Hospital Kuala Lumpur'
      },
      {
        id: 'h5',
        date: '2024-07-15',
        medication: 'Tab. Metformin 500 mg',
        dosage: '500 mg BD',
        frequency: 'BD',
        prescriber: 'Dr. Ahmad Rahman',
        facility: 'Klinik Kesihatan Setapak'
      },
    ];

    setPatientDetails(mockPatient);
    setCurrentPrescriptions(mockPrescriptions);
    setMedicationHistory(mockHistory);
    setLoading(false);
  };

  const calculateWaitingDuration = (registrationTime: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - registrationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return language === 'en' ? '< 1 min' : '< 1 min';
    } else if (diffMins < 60) {
      return `${diffMins} ${language === 'en' ? 'mins' : 'min'}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const handlePatientClick = (patientId: string) => {
    setSelectedPatient(patientId);
    setPrescriptionVerified(false);
    setPrescriptionDispensed(false);
    setActiveTab('screening');
    const patient = queue.find(q => q.id === patientId);
    if (patient) {
      loadPatientData(patient.patientMrn, patient.patientName);
      // Update queue status
      setQueue(queue.map(q => 
        q.id === patientId ? { ...q, status: 'in_progress' } : q
      ));
    }
  };

  const getVisitTypeBadge = (type: VisitType) => {
    const badges = {
      new_prescription: { 
        label: language === 'en' ? 'New RX' : 'RX Baru', 
        color: 'bg-blue-100 text-blue-700 border border-blue-300' 
      },
      collect_balance: { 
        label: language === 'en' ? 'Collect' : 'Ambil', 
        color: 'bg-green-100 text-green-700 border border-green-300' 
      },
      walk_in: { 
        label: language === 'en' ? 'Walk-in' : 'Walk-in', 
        color: 'bg-purple-100 text-purple-700 border border-purple-300' 
      }
    };
    return badges[type];
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      urgent: { label: language === 'en' ? 'Urgent' : 'Segera', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      elderly: { label: language === 'en' ? 'Elderly' : 'Warga Emas', color: 'bg-orange-100 text-orange-700', icon: User },
      normal: { label: '', color: '', icon: null }
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  const handleOpenIntervention = (medication: PrescriptionItem) => {
    setSelectedMedication(medication);
    setInterventionData({
      reason: '',
      proposedDrug: medication.medicationName,
      proposedDosage: medication.dosage,
      proposedFrequency: medication.frequency,
      proposedQuantity: String(medication.quantity),
      actionType: 'request'
    });
    setInterventionModalOpen(true);
  };

  const handleSubmitIntervention = () => {
    // In real app, this would send to backend and notify MO
    console.log('Intervention submitted:', {
      medication: selectedMedication,
      intervention: interventionData
    });
    
    alert(
      interventionData.actionType === 'request'
        ? language === 'en'
          ? 'Intervention request sent to MO for approval'
          : 'Permintaan intervensi dihantar kepada MO untuk kelulusan'
        : language === 'en'
          ? 'Changes made with MO consent. MO will be notified.'
          : 'Perubahan dibuat dengan persetujuan MO. MO akan dimaklumkan.'
    );
    
    setInterventionModalOpen(false);
  };

  const handleVerifyProceed = () => {
    setPrescriptionVerified(true);
    setActiveTab('dispensing');
  };

  const handleModify = () => {
    setPrescriptionVerified(false);
    setActiveTab('screening');
  };

  const handleDispense = () => {
    setPrescriptionDispensed(true);
    alert(
      language === 'en'
        ? 'Prescription dispensed successfully!'
        : 'Preskripsi telah dikeluarkan dengan jayanya!'
    );
  };

  const handleOpenCounselingModal = () => {
    setCounselingModalOpen(true);
    setSelectedMedsForCounseling([]);
  };

  const handleToggleMedForCounseling = (medId: string) => {
    if (selectedMedsForCounseling.includes(medId)) {
      setSelectedMedsForCounseling(selectedMedsForCounseling.filter(id => id !== medId));
    } else {
      setSelectedMedsForCounseling([...selectedMedsForCounseling, medId]);
    }
  };

  const handleProceedToCounseling = () => {
    if (selectedMedsForCounseling.length === 0) {
      alert(
        language === 'en'
          ? 'Please select at least one medication for counseling.'
          : 'Sila pilih sekurang-kurangnya satu ubat untuk kaunseling.'
      );
      return;
    }
    setCounselingModalOpen(false);
    setActiveTab('counseling');
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-white">
      {!selectedPatient ? (
        /* Patient Queue Table View */
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {language === 'en' ? 'Outpatient Counter' : 'Kaunter Pesakit Luar'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {language === 'en' ? 'Patient Queue Management' : 'Pengurusan Barisan Pesakit'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{queue.length}</div>
                <div className="text-blue-100 text-sm">{language === 'en' ? 'Patients Waiting' : 'Pesakit Menunggu'}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Queue No.' : 'No. Giliran'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Patient Name' : 'Nama Pesakit'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      MRN
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'IC No' : 'No. KP'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Visit Type' : 'Jenis Lawatan'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Waiting Duration' : 'Tempoh Menunggu'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Status' : 'Status'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">
                      {language === 'en' ? 'Action' : 'Tindakan'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {queue.map((item) => {
                    const visitBadge = getVisitTypeBadge(item.visitType);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-blue-600">{item.queueNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{item.patientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-mono">{item.patientMrn}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-mono">{item.patientNric}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${visitBadge.color}`}>
                            {visitBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {calculateWaitingDuration(item.registrationTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'waiting' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              {language === 'en' ? 'Waiting' : 'Menunggu'}
                            </span>
                          )}
                          {item.status === 'in_progress' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                              <Activity className="w-3.5 h-3.5" />
                              {language === 'en' ? 'In Progress' : 'Dalam Proses'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handlePatientClick(item.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {language === 'en' ? 'View' : 'Lihat'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Patient View */
        <div className="h-full flex flex-col">
          {patientDetails && (
          <>
            {/* Back Button & Patient Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setPrescriptionVerified(false);
                  setPrescriptionDispensed(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                {language === 'en' ? 'Back to Queue' : 'Kembali ke Barisan'}
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {patientDetails.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{patientDetails.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{patientDetails.mrn}</span>
                    <span>{patientDetails.nric}</span>
                    <span>{patientDetails.age} {language === 'en' ? 'y/o' : 'thn'}</span>
                    <span>{patientDetails.phone}</span>
                  </div>
                </div>
              </div>

              {/* Critical Alerts - More Prominent */}
              <div className="grid grid-cols-3 gap-3">
                {patientDetails.allergies.length > 0 && (
                  <div className="col-span-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <span className="font-bold text-red-900 text-sm uppercase">{language === 'en' ? 'Drug Allergies' : 'Alahan Ubat'}</span>
                        <p className="text-red-700 font-semibold text-base mt-0.5">{patientDetails.allergies.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700 font-medium">{language === 'en' ? 'Renal' : 'Buah Pinggang'}</p>
                      <p className="text-sm text-blue-900 font-semibold mt-0.5">{patientDetails.renalStatus}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700 font-medium">{language === 'en' ? 'Hepatic' : 'Hati'}</p>
                      <p className="text-sm text-blue-900 font-semibold mt-0.5">{patientDetails.hepaticStatus}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex px-6 gap-2">
                {[
                  { id: 'screening', label: language === 'en' ? 'Current Prescription' : 'Preskripsi Semasa', icon: Pill },
                  { id: 'history', label: language === 'en' ? 'Visit History' : 'Sejarah Lawatan', icon: Clock },
                  { id: 'dispensing', label: language === 'en' ? 'Dispensing' : 'Pengeluaran', icon: Package },
                  { id: 'counseling', label: language === 'en' ? 'Counseling' : 'Kaunseling', icon: User }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {activeTab === 'screening' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                      {language === 'en' ? 'Current Prescriptions' : 'Preskripsi Semasa'}
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-base">Dr. Lim Wei Ming</h3>
                            <p className="text-blue-100 text-xs">MMC-12345 • {language === 'en' ? 'Internal Medicine' : 'Perubatan Dalaman'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-100 text-xs">{language === 'en' ? 'Prescription Date' : 'Tarikh Preskripsi'}</p>
                          <p className="text-white font-semibold text-sm">{new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'ms-MY')}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">{language === 'en' ? 'Dept. Phone' : 'Tel. Jabatan'}</p>
                              <p className="text-sm font-semibold text-gray-900">03-2615 5555 ext. 2234</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">{language === 'en' ? 'Personal Phone' : 'Tel. Peribadi'}</p>
                              <p className="text-sm font-semibold text-gray-900">012-345 6789</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Activity className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">{language === 'en' ? 'Diagnosis' : 'Diagnosis'}</p>
                              <p className="text-sm font-semibold text-gray-900">{language === 'en' ? 'Type 2 DM, HTN' : 'Kencing Manis Jenis 2, HTN'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prescriptions Table */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Medication' : 'Ubat'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Dosage' : 'Dos'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Frequency' : 'Kekerapan'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Route' : 'Laluan'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Duration' : 'Tempoh'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Qty' : 'Kuantiti'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Status' : 'Status'}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Action' : 'Tindakan'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentPrescriptions.map((rx, index) => (
                          <tr key={rx.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{rx.medicationName}</p>
                                <p className="text-xs text-gray-500 font-mono">Code: {rx.medicationCode}</p>
                                {rx.batchNo && rx.expiryDate && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <span className="font-semibold">{language === 'en' ? 'Batch:' : 'Kelompok:'}</span> <span className="font-mono">{rx.batchNo}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-semibold">{language === 'en' ? 'Expiry:' : 'Luput:'}</span> {rx.expiryDate}
                                  </p>
                                )}
                                {rx.instructions && (
                                  <p className="text-xs text-blue-600 mt-1">💡 {rx.instructions}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{rx.dosage}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">{rx.frequency}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{rx.route}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{rx.duration}</td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-600">{rx.quantity}</td>
                            <td className="px-4 py-3">
                              {rx.status === 'pending' && (
                                <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                                  {language === 'en' ? 'Pending' : 'Menunggu'}
                                </span>
                              )}
                              {rx.status === 'verified' && (
                                <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  {language === 'en' ? 'Verified' : 'Disahkan'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleOpenIntervention(rx)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-semibold transition-colors"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {language === 'en' ? 'Intervention' : 'Intervensi'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Summary */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Items:' : 'Jumlah Item:'}</span>
                          <span className="ml-2 font-bold text-gray-900">{currentPrescriptions.length}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Duration:' : 'Jumlah Tempoh:'}</span>
                          <span className="ml-2 font-bold text-blue-600">{currentPrescriptions[0]?.duration || '30 days'}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Price:' : 'Jumlah Harga:'}</span>
                          <span className="ml-2 font-bold text-green-600">RM 0.00</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium">
                          <Save className="w-4 h-4" />
                          {language === 'en' ? 'Save' : 'Simpan'}
                        </button>
                        {!prescriptionVerified ? (
                          <button 
                            onClick={handleVerifyProceed}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {language === 'en' ? 'Verify & Proceed' : 'Sahkan & Teruskan'}
                          </button>
                        ) : (
                          <button 
                            onClick={handleModify}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            {language === 'en' ? 'Modify' : 'Ubah Suai'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dispensing' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {language === 'en' ? 'Dispensing & Labelling' : 'Pengeluaran & Pelabelan'}
                    </h2>
                    {prescriptionVerified && !prescriptionDispensed && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                        {language === 'en' ? 'Verified - Ready to Dispense' : 'Disahkan - Bersedia untuk Dikeluarkan'}
                      </span>
                    )}
                    {prescriptionDispensed && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'en' ? 'Dispensed' : 'Telah Dikeluarkan'}
                      </span>
                    )}
                  </div>

                  {/* Prescriptions for Dispensing */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Medication' : 'Ubat'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Dosage' : 'Dos'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Frequency' : 'Kekerapan'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Quantity' : 'Kuantiti'}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                            {language === 'en' ? 'Status' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentPrescriptions.map((rx, index) => (
                          <tr key={rx.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{rx.medicationName}</p>
                                <p className="text-xs text-gray-500 font-mono">Code: {rx.medicationCode}</p>
                                {rx.batchNo && rx.expiryDate && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <span className="font-semibold">{language === 'en' ? 'Batch:' : 'Kelompok:'}</span> <span className="font-mono">{rx.batchNo}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-semibold">{language === 'en' ? 'Expiry:' : 'Luput:'}</span> {rx.expiryDate}
                                  </p>
                                )}
                                {rx.instructions && (
                                  <p className="text-xs text-blue-600 mt-1">💡 {rx.instructions}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{rx.dosage}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">{rx.frequency}</td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-600">{rx.quantity}</td>
                            <td className="px-4 py-3 text-center">
                              {prescriptionDispensed ? (
                                <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  {language === 'en' ? 'Dispensed' : 'Dikeluarkan'}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                                  {language === 'en' ? 'Ready' : 'Bersedia'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer with Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Items:' : 'Jumlah Item:'}</span>
                          <span className="ml-2 font-bold text-gray-900">{currentPrescriptions.length}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Duration:' : 'Jumlah Tempoh:'}</span>
                          <span className="ml-2 font-bold text-blue-600">{currentPrescriptions[0]?.duration || '30 days'}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">{language === 'en' ? 'Total Price:' : 'Jumlah Harga:'}</span>
                          <span className="ml-2 font-bold text-green-600">RM 0.00</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        {!prescriptionDispensed ? (
                          <>
                            {/* Left Side - Secondary Actions */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleModify}
                                className="px-4 py-2.5 bg-white border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 text-sm font-semibold"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                {language === 'en' ? 'Modify Prescription' : 'Ubah Preskripsi'}
                              </button>
                            <button 
                              onClick={() => setPrintLabelModalOpen(true)}
                              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <Printer className="w-4 h-4" />
                              {language === 'en' ? 'Print Labels' : 'Cetak Label'}
                            </button>
                            </div>

                            {/* Right Side - Primary Actions */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleOpenCounselingModal}
                                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
                              >
                                <User className="w-4 h-4" />
                                {language === 'en' ? 'Counseling Required?' : 'Perlukan Kaunseling?'}
                              </button>
                              <button 
                                onClick={handleDispense}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {language === 'en' ? 'Mark as Dispensed' : 'Tandakan Dikeluarkan'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-semibold">
                              {language === 'en' ? 'Prescription completed successfully' : 'Preskripsi selesai dengan jayanya'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'counseling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {language === 'en' ? 'Patient Counseling' : 'Kaunseling Pesakit'}
                    </h2>
                    {selectedMedsForCounseling.length > 0 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
                        {selectedMedsForCounseling.length} {language === 'en' ? 'medication(s) for counseling' : 'ubat untuk kaunseling'}
                      </span>
                    )}
                  </div>

                  {selectedMedsForCounseling.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-10 h-10 text-purple-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {language === 'en' ? 'No Medications Selected for Counseling' : 'Tiada Ubat Dipilih untuk Kaunseling'}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        {language === 'en' 
                          ? 'Go to Dispensing tab and click "Counseling Required?" to select medications.' 
                          : 'Pergi ke tab Pengeluaran dan klik "Perlukan Kaunseling?" untuk memilih ubat.'}
                      </p>
                      <button
                        onClick={() => setActiveTab('dispensing')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                      >
                        {language === 'en' ? 'Go to Dispensing' : 'Pergi ke Pengeluaran'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected Medications for Counseling */}
                      {currentPrescriptions
                        .filter(rx => selectedMedsForCounseling.includes(rx.id))
                        .map((rx, index) => (
                          <div key={rx.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {/* Medication Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h3 className="text-base font-bold text-gray-900">{rx.medicationName}</h3>
                                    <p className="text-xs text-gray-500 font-mono">Code: {rx.medicationCode}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedMedsForCounseling(selectedMedsForCounseling.filter(id => id !== rx.id))}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title={language === 'en' ? 'Remove from counseling' : 'Buang dari kaunseling'}
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Medication Details */}
                              <div className="grid grid-cols-5 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-600 text-xs">{language === 'en' ? 'Dosage' : 'Dos'}</span>
                                  <p className="font-semibold text-gray-900">{rx.dosage}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-xs">{language === 'en' ? 'Frequency' : 'Kekerapan'}</span>
                                  <p className="font-semibold text-blue-600">{rx.frequency}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-xs">{language === 'en' ? 'Route' : 'Laluan'}</span>
                                  <p className="font-semibold text-gray-900">{rx.route}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-xs">{language === 'en' ? 'Duration' : 'Tempoh'}</span>
                                  <p className="font-semibold text-gray-900">{rx.duration}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-xs">{language === 'en' ? 'Quantity' : 'Kuantiti'}</span>
                                  <p className="font-semibold text-blue-600">{rx.quantity}</p>
                                </div>
                              </div>

                              {rx.instructions && (
                                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-800 flex items-center gap-1">
                                    <span>💡</span>
                                    <span className="font-medium">{rx.instructions}</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Counseling Form */}
                            <div className="px-6 py-4 space-y-4">
                              {/* Counseling Topics */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  {language === 'en' ? 'Topics Covered' : 'Topik yang Dibincangkan'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { en: 'Purpose & Indication', bm: 'Tujuan & Petunjuk' },
                                    { en: 'Dosage & Administration', bm: 'Dos & Pentadbiran' },
                                    { en: 'Side Effects', bm: 'Kesan Sampingan' },
                                    { en: 'Drug Interactions', bm: 'Interaksi Ubat' },
                                    { en: 'Storage Instructions', bm: 'Arahan Penyimpanan' },
                                    { en: 'Missed Dose Instructions', bm: 'Arahan Dos Tertinggal' }
                                  ].map((topic, i) => (
                                    <label key={i} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                      <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                                      <span className="text-sm text-gray-700">{language === 'en' ? topic.en : topic.bm}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Teach-Back Assessment */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  {language === 'en' ? 'Teach-Back Assessment' : 'Penilaian Teach-Back'}
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`teachback-${rx.id}`} className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Passed ✓' : 'Lulus ✓'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`teachback-${rx.id}`} className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Needs Reinforcement' : 'Perlu Pengukuhan'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`teachback-${rx.id}`} className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Not Applicable' : 'Tidak Berkaitan'}</span>
                                  </label>
                                </div>
                              </div>

                              {/* Counseling Notes */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  {language === 'en' ? 'Counseling Notes' : 'Nota Kaunseling'}
                                </label>
                                <textarea
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  placeholder={language === 'en' 
                                    ? 'Enter any additional notes, concerns, or follow-up required...' 
                                    : 'Masukkan sebarang nota tambahan, kebimbangan, atau susulan yang diperlukan...'}
                                />
                              </div>

                              {/* Patient Materials */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  {language === 'en' ? 'Patient Materials Provided' : 'Bahan Pesakit yang Diberikan'}
                                </label>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Information Leaflet' : 'Risalah Maklumat'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Medication Diary' : 'Diari Ubat'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                                    <span className="text-sm text-gray-700">{language === 'en' ? 'Device Training' : 'Latihan Peranti'}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Footer Actions */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center justify-between">
                        <button
                          onClick={handleOpenCounselingModal}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          {language === 'en' ? 'Add More Medications' : 'Tambah Ubat Lagi'}
                        </button>
                        <div className="flex items-center gap-3">
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium">
                            <Save className="w-4 h-4" />
                            {language === 'en' ? 'Save Draft' : 'Simpan Draf'}
                          </button>
                          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            {language === 'en' ? 'Complete Counseling' : 'Selesaikan Kaunseling'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {language === 'en' ? 'Visit History & Prescriptions' : 'Sejarah Lawatan & Preskripsi'}
                  </h2>

                  {/* Visit History List */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Current Visit */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedPrescription(expandedPrescription === 'current' ? null : 'current')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900">
                                {language === 'en' ? 'Current Visit' : 'Lawatan Semasa'}
                              </h3>
                              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-semibold">
                                {language === 'en' ? 'Active' : 'Aktif'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'ms-MY')} • Dr. Lim Wei Ming • {currentPrescriptions.length} {language === 'en' ? 'meds' : 'ubat'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPrescription === 'current' ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedPrescription === 'current' && (
                        <div className="px-4 pb-4 bg-gray-50">
                          {/* MO Plan/Notes */}
                          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 mb-1">{language === 'en' ? "MO's Plan / Notes" : 'Pelan / Nota MO'}</h4>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {language === 'en' 
                                    ? 'Continue current medications for diabetes and hypertension management. Monitor blood glucose and blood pressure. Patient advised on lifestyle modifications including diet control and regular exercise. Follow-up in 1 month or earlier if symptoms worsen. Check HbA1c and lipid profile on next visit.'
                                    : 'Teruskan ubat semasa untuk pengurusan kencing manis dan tekanan darah tinggi. Pantau paras gula dalam darah dan tekanan darah. Pesakit dinasihatkan tentang pengubahsuaian gaya hidup termasuk kawalan diet dan senaman berkala. Susulan dalam 1 bulan atau lebih awal jika simptom bertambah teruk. Periksa HbA1c dan profil lipid pada lawatan seterusnya.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Medications Table */}
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{language === 'en' ? 'Prescribed Medications' : 'Ubat yang Ditetapkan'}</h4>
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-300">
                              <tr className="text-xs text-gray-600">
                                <th className="py-2 text-left font-semibold">#</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Medication' : 'Ubat'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Dose' : 'Dos'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Freq' : 'Kekerapan'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Duration' : 'Tempoh'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Qty' : 'Kuantiti'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {currentPrescriptions.map((rx, index) => (
                                <tr key={rx.id} className="hover:bg-white">
                                  <td className="py-2 font-semibold text-gray-900">{index + 1}</td>
                                  <td className="py-2">
                                    <p className="font-semibold text-gray-900">{rx.medicationName}</p>
                                    {rx.instructions && <p className="text-xs text-blue-600">💡 {rx.instructions}</p>}
                                  </td>
                                  <td className="py-2 font-semibold text-gray-900">{rx.dosage}</td>
                                  <td className="py-2 font-semibold text-blue-600">{rx.frequency}</td>
                                  <td className="py-2 text-gray-900">{rx.duration}</td>
                                  <td className="py-2 font-bold text-blue-600">{rx.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Previous Visit 1 */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedPrescription(expandedPrescription === 'visit1' ? null : 'visit1')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900">15/09/2024</h3>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                {language === 'en' ? 'Completed' : 'Selesai'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Dr. Lim Wei Ming • 3 {language === 'en' ? 'meds' : 'ubat'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPrescription === 'visit1' ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedPrescription === 'visit1' && (
                        <div className="px-4 pb-4 bg-gray-50">
                          {/* MO Plan/Notes */}
                          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 mb-1">{language === 'en' ? "MO's Plan / Notes" : 'Pelan / Nota MO'}</h4>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {language === 'en' 
                                    ? 'Continue diabetes and hypertension management. Blood glucose levels improving. Blood pressure within target range. Patient compliance good. Continue same medications. Advised to maintain diet and exercise regimen. Follow-up in 1 month.'
                                    : 'Teruskan pengurusan kencing manis dan hipertensi. Paras gula darah bertambah baik. Tekanan darah dalam julat sasaran. Pematuhan pesakit baik. Teruskan ubat yang sama. Dinasihatkan untuk mengekalkan rejim diet dan senaman. Susulan dalam 1 bulan.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Medications Table */}
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{language === 'en' ? 'Prescribed Medications' : 'Ubat yang Ditetapkan'}</h4>
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-300">
                              <tr className="text-xs text-gray-600">
                                <th className="py-2 text-left font-semibold">#</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Medication' : 'Ubat'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Dose' : 'Dos'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Frequency' : 'Kekerapan'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {medicationHistory.slice(0, 3).map((history, index) => (
                                <tr key={history.id} className="hover:bg-white">
                                  <td className="py-2 font-semibold text-gray-900">{index + 1}</td>
                                  <td className="py-2 font-semibold text-gray-900">{history.medication}</td>
                                  <td className="py-2 text-gray-900">{history.dosage}</td>
                                  <td className="py-2 font-semibold text-gray-900">{history.frequency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Previous Visit 2 */}
                    <div>
                      <button
                        onClick={() => setExpandedPrescription(expandedPrescription === 'visit2' ? null : 'visit2')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900">15/08/2024</h3>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                {language === 'en' ? 'Completed' : 'Selesai'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Dr. Lim Wei Ming • 2 {language === 'en' ? 'meds' : 'ubat'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPrescription === 'visit2' ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedPrescription === 'visit2' && (
                        <div className="px-4 pb-4 bg-gray-50">
                          {/* MO Plan/Notes */}
                          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 mb-1">{language === 'en' ? "MO's Plan / Notes" : 'Pelan / Nota MO'}</h4>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {language === 'en' 
                                    ? 'Initial assessment for diabetes and hypertension. Started on Metformin 500mg and Amlodipine 5mg. Patient educated on disease management, medication compliance, and lifestyle modifications. Blood glucose monitoring advised. Follow-up in 2 weeks to assess response to treatment.'
                                    : 'Penilaian awal untuk kencing manis dan hipertensi. Dimulakan dengan Metformin 500mg dan Amlodipine 5mg. Pesakit dididik tentang pengurusan penyakit, pematuhan ubat, dan pengubahsuaian gaya hidup. Pemantauan glukosa darah dinasihatkan. Susulan dalam 2 minggu untuk menilai tindak balas kepada rawatan.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Medications Table */}
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{language === 'en' ? 'Prescribed Medications' : 'Ubat yang Ditetapkan'}</h4>
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-300">
                              <tr className="text-xs text-gray-600">
                                <th className="py-2 text-left font-semibold">#</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Medication' : 'Ubat'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Dose' : 'Dos'}</th>
                                <th className="py-2 text-left font-semibold">{language === 'en' ? 'Frequency' : 'Kekerapan'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {medicationHistory.slice(3, 5).map((history, index) => (
                                <tr key={history.id} className="hover:bg-white">
                                  <td className="py-2 font-semibold text-gray-900">{index + 1}</td>
                                  <td className="py-2 font-semibold text-gray-900">{history.medication}</td>
                                  <td className="py-2 text-gray-900">{history.dosage}</td>
                                  <td className="py-2 font-semibold text-gray-900">{history.frequency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
          )}
        </div>
      )}

        {/* Print Labels Modal */}
        {printLabelModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {language === 'en' ? 'Print Medication Labels' : 'Cetak Label Ubat'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Select language and print labels' : 'Pilih bahasa dan cetak label'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPrintLabelModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Language Selector */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:hidden">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {language === 'en' ? 'Label Language' : 'Bahasa Label'}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLabelLanguage('en')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      labelLanguage === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLabelLanguage('bm')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      labelLanguage === 'bm'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bahasa Malaysia
                  </button>
                </div>
              </div>

              {/* Labels Preview */}
              <div className="p-6 space-y-6">
                {currentPrescriptions.map((rx, index) => (
                  <div key={rx.id} className="border-2 border-black bg-white print:page-break-after-always max-w-lg mx-auto">
                    {/* Header - Simple black border */}
                    <div className="border-b-2 border-black px-3 py-1.5">
                      <h1 className="text-sm font-bold text-black text-center uppercase">
                        {labelLanguage === 'en' ? 'HOSPITAL LAWAS (Tel: 085 283 781)' : 'HOSPITAL LAWAS (Tel: 085 283 781)'}
                      </h1>
                    </div>

                    {/* Body */}
                    <div className="p-3">
                      {/* Patient Info & Rx - Simple text */}
                      <div className="text-xs mb-2 pb-2 border-b border-black">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-black">{patientDetails?.name || 'Ahmad bin Abdullah'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-black">{patientDetails?.nric || '850615-10-5234'}</p>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="font-bold">RX{String(index + 25).padStart(5, '0')}</span>
                          <span className="ml-4">{labelLanguage === 'en' ? 'Pharmacy Counter' : 'Kaunter Farmasi'}</span>
                        </div>
                      </div>

                      {/* Medication Name - Bold and large */}
                      <div className="mb-3">
                        <h2 className="text-base font-bold text-black uppercase">{rx.medicationName}</h2>
                      </div>

                      {/* Dosing Instructions - Simple text like real label */}
                      <div className="mb-3 text-sm">
                        <p className="font-bold text-black">
                          {labelLanguage === 'en' ? 'Take' : 'Ambil'}{' '}
                          <span className="text-base">
                            {rx.dosage.includes('1000') ? '2' : 
                             rx.dosage.includes('500') ? '1' : 
                             rx.dosage.includes('20') ? '1' : 
                             rx.dosage.includes('100') ? '1' : 
                             rx.dosage.includes('5') ? '1' : '1'}
                          </span>{' '}
                          {labelLanguage === 'en' ? 'tablet' : 'biji'}{' '}
                          <span className="text-base">
                            {rx.frequency.includes('OD') || rx.frequency.includes('ON') 
                              ? (rx.frequency.includes('ON') 
                                  ? (labelLanguage === 'en' ? 'Every night' : 'Setiap malam')
                                  : (labelLanguage === 'en' ? 'Once daily' : 'Sekali sehari'))
                              : rx.frequency.includes('BD') 
                                ? (labelLanguage === 'en' ? 'Twice daily' : 'Dua kali sehari')
                                : rx.frequency.includes('TDS')
                                  ? (labelLanguage === 'en' ? 'Three times daily' : 'Tiga kali sehari')
                                  : rx.frequency.includes('QID')
                                    ? (labelLanguage === 'en' ? 'Four times daily' : 'Empat kali sehari')
                                    : rx.frequency}
                          </span>
                        </p>
                      </div>

                      {/* Meal Timing Instructions - Text box like real label */}
                      <div className="border border-black p-2 mb-3 text-xs">
                        <p className="font-semibold text-black">
                          {rx.instructions?.toLowerCase().includes('before') && (
                            labelLanguage === 'en' ? 'Can be taken BEFORE meal' : 'Boleh diambil SEBELUM makan'
                          )}
                          {rx.instructions?.toLowerCase().includes('after') && (
                            labelLanguage === 'en' ? 'Can be taken AFTER meal' : 'Boleh diambil SELEPAS makan'
                          )}
                          {(rx.instructions?.toLowerCase().includes('with') || rx.instructions?.toLowerCase().includes('meal')) && (
                            labelLanguage === 'en' ? 'Can be taken BEFORE OR AFTER meal' : 'Boleh diambil SEBELUM ATAU SELEPAS makan'
                          )}
                          {!rx.instructions && (labelLanguage === 'en' ? 'Take as directed' : 'Ambil mengikut arahan')}
                        </p>
                        <p className="mt-1 text-black">
                          {labelLanguage === 'en' 
                            ? 'Complete the course as directed by doctor/pharmacist. Do not stop without advice.'
                            : 'Ambil dos ubat mengikut arahan doktor/ahli farmasi. Jangan berhenti ambil ubat ini tanpa nasihat doktor.'}
                        </p>
                      </div>

                      {/* Duration and Quantity - Simple text */}
                      <div className="border-t border-black pt-2 mb-2">
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="font-bold text-black">{labelLanguage === 'en' ? 'Duration' : 'Tempoh'}</p>
                            <p className="text-black">{rx.duration} [{rx.quantity} {labelLanguage === 'en' ? 'tablets' : 'biji'}]</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-black">{rx.quantity} {labelLanguage === 'en' ? 'tablets' : 'biji'}</p>
                            <p className="text-black">RM 0.00</p>
                          </div>
                        </div>
                        <p className="text-xs mt-1 text-black">
                          <span className="font-bold">{labelLanguage === 'en' ? 'Batch:' : 'B/N:'}</span> {rx.batchNo} | 
                          <span className="font-bold ml-2">{labelLanguage === 'en' ? 'Expiry:' : 'Exp:'}</span> {rx.expiryDate}
                        </p>
                      </div>

                      {/* Bottom Warning - Like real label */}
                      <div className="border-t-2 border-black pt-2">
                        <p className="text-xs font-bold text-black uppercase text-center">
                          {labelLanguage === 'en' 
                            ? 'KEEP MEDICINE AWAY FROM CHILDREN'
                            : 'UBAT TERKAWAL JAUHI DARIPADA KANAK-KANAK'}
                        </p>
                        <p className="text-xs text-black text-right mt-1">
                          {new Date().toLocaleDateString(labelLanguage === 'en' ? 'en-GB' : 'ms-MY', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date().toLocaleTimeString(labelLanguage === 'en' ? 'en-GB' : 'ms-MY', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between print:hidden">
                <p className="text-sm text-gray-600">
                  {currentPrescriptions.length} {language === 'en' ? 'label(s) ready to print' : 'label bersedia untuk dicetak'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrintLabelModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                  >
                    {language === 'en' ? 'Cancel' : 'Batal'}
                  </button>
                  <button
                    onClick={handlePrintLabels}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    {language === 'en' ? 'Print Labels' : 'Cetak Label'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Counseling Selection Modal */}
        {counselingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {language === 'en' ? 'Select Medications for Counseling' : 'Pilih Ubat untuk Kaunseling'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {language === 'en' ? 'Choose which medications require patient counseling' : 'Pilih ubat yang memerlukan kaunseling pesakit'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCounselingModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                <div className="space-y-2">
                  {currentPrescriptions.map((rx, index) => (
                    <div
                      key={rx.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedMedsForCounseling.includes(rx.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                      onClick={() => handleToggleMedForCounseling(rx.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={selectedMedsForCounseling.includes(rx.id)}
                            onChange={() => handleToggleMedForCounseling(rx.id)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                                  {index + 1}
                                </span>
                                <h3 className="text-base font-bold text-gray-900">{rx.medicationName}</h3>
                              </div>
                              <p className="text-xs text-gray-500 font-mono mt-1">Code: {rx.medicationCode}</p>
                              {rx.instructions && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <span>💡</span>
                                  <span>{rx.instructions}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                            <div>
                              <span className="text-gray-600 text-xs">{language === 'en' ? 'Dosage:' : 'Dos:'}</span>
                              <p className="font-semibold text-gray-900">{rx.dosage}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 text-xs">{language === 'en' ? 'Frequency:' : 'Kekerapan:'}</span>
                              <p className="font-semibold text-blue-600">{rx.frequency}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 text-xs">{language === 'en' ? 'Duration:' : 'Tempoh:'}</span>
                              <p className="font-semibold text-gray-900">{rx.duration}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 text-xs">{language === 'en' ? 'Quantity:' : 'Kuantiti:'}</span>
                              <p className="font-semibold text-blue-600">{rx.quantity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Count */}
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <span className="font-bold">{selectedMedsForCounseling.length}</span> {language === 'en' ? 'medication(s) selected for counseling' : 'ubat dipilih untuk kaunseling'}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCounselingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  onClick={handleProceedToCounseling}
                  disabled={selectedMedsForCounseling.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {language === 'en' ? 'Proceed to Counseling' : 'Teruskan ke Kaunseling'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intervention Modal */}
        {interventionModalOpen && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {language === 'en' ? 'Pharmaceutical Intervention' : 'Intervensi Farmaseutikal'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Request change or modify with MO consent' : 'Minta perubahan atau ubah dengan persetujuan MO'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInterventionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Current Medication */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  {language === 'en' ? 'Current Prescription' : 'Preskripsi Semasa'}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">{language === 'en' ? 'Medication:' : 'Ubat:'}</span>
                    <p className="font-semibold text-gray-900">{selectedMedication.medicationName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{language === 'en' ? 'Dosage:' : 'Dos:'}</span>
                    <p className="font-semibold text-gray-900">{selectedMedication.dosage}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{language === 'en' ? 'Frequency:' : 'Kekerapan:'}</span>
                    <p className="font-semibold text-gray-900">{selectedMedication.frequency}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{language === 'en' ? 'Quantity:' : 'Kuantiti:'}</span>
                    <p className="font-semibold text-gray-900">{selectedMedication.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Intervention Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'en' ? 'Reason for Intervention *' : 'Sebab Intervensi *'}
                </label>
                <textarea
                  value={interventionData.reason}
                  onChange={(e) => setInterventionData({ ...interventionData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder={language === 'en' ? 'e.g., Drug interaction, contraindication, dosage adjustment needed...' : 'cth: Interaksi ubat, kontraindikasi, penyesuaian dos diperlukan...'}
                />
              </div>

              {/* Proposed Changes */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'en' ? 'Proposed Changes' : 'Perubahan Dicadangkan'}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'en' ? 'Medication' : 'Ubat'}
                  </label>
                  <input
                    type="text"
                    value={interventionData.proposedDrug}
                    onChange={(e) => setInterventionData({ ...interventionData, proposedDrug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Dosage' : 'Dos'}
                    </label>
                    <input
                      type="text"
                      value={interventionData.proposedDosage}
                      onChange={(e) => setInterventionData({ ...interventionData, proposedDosage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Frequency' : 'Kekerapan'}
                    </label>
                    <select
                      value={interventionData.proposedFrequency}
                      onChange={(e) => setInterventionData({ ...interventionData, proposedFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="OD">OD</option>
                      <option value="BD">BD</option>
                      <option value="TDS">TDS</option>
                      <option value="QID">QID</option>
                      <option value="ON">ON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Quantity' : 'Kuantiti'}
                    </label>
                    <input
                      type="number"
                      value={interventionData.proposedQuantity}
                      onChange={(e) => setInterventionData({ ...interventionData, proposedQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Type */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {language === 'en' ? 'Intervention Type' : 'Jenis Intervensi'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="actionType"
                      value="request"
                      checked={interventionData.actionType === 'request'}
                      onChange={(e) => setInterventionData({ ...interventionData, actionType: e.target.value as 'request' | 'consent' })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {language === 'en' ? 'Request Change to MO' : 'Minta Perubahan kepada MO'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {language === 'en' 
                          ? 'Send intervention request to MO for approval. Wait for response before proceeding.' 
                          : 'Hantar permintaan intervensi kepada MO untuk kelulusan. Tunggu respons sebelum meneruskan.'}
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="actionType"
                      value="consent"
                      checked={interventionData.actionType === 'consent'}
                      onChange={(e) => setInterventionData({ ...interventionData, actionType: e.target.value as 'request' | 'consent' })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {language === 'en' ? 'Change with MO Consent' : 'Ubah dengan Persetujuan MO'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {language === 'en' 
                          ? 'Make changes immediately with verbal/written MO consent. MO will be notified.' 
                          : 'Buat perubahan segera dengan persetujuan lisan/bertulis MO. MO akan dimaklumkan.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setInterventionModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={handleSubmitIntervention}
                disabled={!interventionData.reason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {interventionData.actionType === 'request'
                  ? (language === 'en' ? 'Send Request' : 'Hantar Permintaan')
                  : (language === 'en' ? 'Submit Changes' : 'Hantar Perubahan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
