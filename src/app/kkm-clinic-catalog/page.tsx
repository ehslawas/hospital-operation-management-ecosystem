'use client';

import { useState } from 'react';
import { IconBeaker, IconSearch, IconFilter, IconPlus, IconEdit, IconTrash, IconEye } from '@/components/ui/Icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KKMClinic {
  id: string;
  clinicCode: string;
  clinicName: string;
  state: string;
  district: string;
  clinicType: 'Klinik Kesihatan' | 'Klinik Kesihatan Bandar' | 'Klinik Kesihatan Luar Bandar' | 'Klinik Kesihatan Ibu dan Anak';
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  registrationDate: string;
  lastUpdated: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  operatingHours: {
    weekdays: string;
    weekends: string;
    publicHolidays: string;
  };
}

const mockClinics: KKMClinic[] = [
  {
    id: '1',
    clinicCode: 'KKM-CL001',
    clinicName: 'Klinik Kesihatan Bandar Kuala Lumpur',
    state: 'Kuala Lumpur',
    district: 'Kuala Lumpur',
    clinicType: 'Klinik Kesihatan Bandar',
    status: 'Active',
    registrationDate: '2020-01-15',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Siti Nurhaliza',
    phone: '+603-26912000',
    email: 'admin@kkbkl.gov.my',
    address: 'Jalan Raja Laut, 50350 Kuala Lumpur',
    coordinates: { latitude: 3.1390, longitude: 101.6869 },
    services: ['General Consultation', 'Maternal & Child Health', 'Immunization', 'Chronic Disease Management'],
    operatingHours: {
      weekdays: '8:00 AM - 5:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  },
  {
    id: '2',
    clinicCode: 'KKM-CL002',
    clinicName: 'Klinik Kesihatan Petaling Jaya',
    state: 'Selangor',
    district: 'Petaling',
    clinicType: 'Klinik Kesihatan Bandar',
    status: 'Active',
    registrationDate: '2020-03-20',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+603-79542000',
    email: 'admin@kkpj.gov.my',
    address: 'Jalan SS 2/61, 47300 Petaling Jaya, Selangor',
    coordinates: { latitude: 3.1073, longitude: 101.6133 },
    services: ['General Consultation', 'Family Planning', 'Health Screening', 'Mental Health Services'],
    operatingHours: {
      weekdays: '8:00 AM - 5:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  },
  {
    id: '3',
    clinicCode: 'KKM-CL003',
    clinicName: 'Klinik Kesihatan Johor Bahru',
    state: 'Johor',
    district: 'Johor Bahru',
    clinicType: 'Klinik Kesihatan Bandar',
    status: 'Active',
    registrationDate: '2019-11-10',
    lastUpdated: '2024-01-05',
    contactPerson: 'Dr. Lim Siew Choo',
    phone: '+607-2231000',
    email: 'admin@kkjb.gov.my',
    address: 'Jalan Tun Abdul Razak, 80000 Johor Bahru, Johor',
    coordinates: { latitude: 1.4927, longitude: 103.7414 },
    services: ['General Consultation', 'Maternal & Child Health', 'Immunization', 'Dental Services'],
    operatingHours: {
      weekdays: '8:00 AM - 5:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  },
  {
    id: '4',
    clinicCode: 'KKM-CL004',
    clinicName: 'Klinik Kesihatan Luar Bandar Ipoh',
    state: 'Perak',
    district: 'Kinta',
    clinicType: 'Klinik Kesihatan Luar Bandar',
    status: 'Active',
    registrationDate: '2020-06-15',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Rajeswari',
    phone: '+605-2551000',
    email: 'admin@kklbipoh.gov.my',
    address: 'Jalan Raja Musa Aziz, 30000 Ipoh, Perak',
    coordinates: { latitude: 4.5841, longitude: 101.0829 },
    services: ['General Consultation', 'Maternal & Child Health', 'Immunization', 'Health Education'],
    operatingHours: {
      weekdays: '8:00 AM - 4:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  },
  {
    id: '5',
    clinicCode: 'KKM-CL005',
    clinicName: 'Klinik Kesihatan Ibu dan Anak Georgetown',
    state: 'Pulau Pinang',
    district: 'Timur Laut',
    clinicType: 'Klinik Kesihatan Ibu dan Anak',
    status: 'Under Maintenance',
    registrationDate: '2021-02-28',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Norazlina',
    phone: '+604-2621000',
    email: 'admin@kkiapg.gov.my',
    address: 'Jalan Macalister, 10400 Georgetown, Pulau Pinang',
    coordinates: { latitude: 5.4161, longitude: 100.3327 },
    services: ['Maternal & Child Health', 'Immunization', 'Family Planning', 'Nutrition Counseling'],
    operatingHours: {
      weekdays: '8:00 AM - 5:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  },
  {
    id: '6',
    clinicCode: 'KKM-CL006',
    clinicName: 'Klinik Kesihatan Kota Kinabalu',
    state: 'Sabah',
    district: 'Kota Kinabalu',
    clinicType: 'Klinik Kesihatan Bandar',
    status: 'Active',
    registrationDate: '2020-08-10',
    lastUpdated: '2024-01-14',
    contactPerson: 'Dr. Mohd Azlan',
    phone: '+6088-212100',
    email: 'admin@kkkk.gov.my',
    address: 'Jalan Lintas, 88300 Kota Kinabalu, Sabah',
    coordinates: { latitude: 5.9804, longitude: 116.0735 },
    services: ['General Consultation', 'Maternal & Child Health', 'Immunization', 'Health Screening'],
    operatingHours: {
      weekdays: '8:00 AM - 5:00 PM',
      weekends: '8:00 AM - 12:00 PM',
      publicHolidays: 'Emergency Only'
    }
  }
];

export default function KKMClinicCatalogPage() {
  const [clinics, setClinics] = useState<KKMClinic[]>(mockClinics);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<KKMClinic | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.clinicCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || clinic.state === filterState;
    const matchesType = !filterType || clinic.clinicType === filterType;
    const matchesStatus = !filterStatus || clinic.status === filterStatus;
    
    return matchesSearch && matchesState && matchesType && matchesStatus;
  });

  const states = [...new Set(clinics.map(c => c.state))].sort();
  const types = [...new Set(clinics.map(c => c.clinicType))].sort();
  const statuses = [...new Set(clinics.map(c => c.status))].sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Klinik Kesihatan Bandar': return 'bg-blue-100 text-blue-800';
      case 'Klinik Kesihatan Luar Bandar': return 'bg-green-100 text-green-800';
      case 'Klinik Kesihatan Ibu dan Anak': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className=" px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconBeaker className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">KKM Clinic Catalog</h1>
              <p className="text-slate-600">All KKM registered clinics in Malaysia</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Clinics</p>
                  <p className="text-2xl font-bold text-slate-900">{clinics.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconBeaker className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {clinics.filter(c => c.status === 'Active').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="h-5 w-5 rounded-full bg-green-600"></div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">States</p>
                  <p className="text-2xl font-bold text-slate-900">{states.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="h-5 w-5 rounded bg-purple-600"></div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Under Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {clinics.filter(c => c.status === 'Under Maintenance').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="h-5 w-5 rounded bg-yellow-600"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clinics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Clinic Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Clinics Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clinic Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clinic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {clinic.clinicCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{clinic.clinicName}</div>
                        <div className="text-sm text-slate-500">{clinic.district}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {clinic.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeColor(clinic.clinicType)}>
                        {clinic.clinicType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(clinic.status)}>
                        {clinic.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {clinic.contactPerson}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <IconEye className="h-4 w-4" />
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Clinic Details Modal */}
        {showModal && selectedClinic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Clinic Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ?
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Clinic Code</label>
                    <p className="text-sm text-slate-900">{selectedClinic.clinicCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <Badge className={getStatusColor(selectedClinic.status)}>
                      {selectedClinic.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
                  <p className="text-sm text-slate-900">{selectedClinic.clinicName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">State</label>
                    <p className="text-sm text-slate-900">{selectedClinic.state}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">District</label>
                    <p className="text-sm text-slate-900">{selectedClinic.district}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Clinic Type</label>
                  <Badge className={getTypeColor(selectedClinic.clinicType)}>
                    {selectedClinic.clinicType}
                  </Badge>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <p className="text-sm text-slate-900">{selectedClinic.address}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Contact Person</label>
                    <p className="text-sm text-slate-900">{selectedClinic.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                    <p className="text-sm text-slate-900">{selectedClinic.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <p className="text-sm text-slate-900">{selectedClinic.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Services Offered</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedClinic.services.map((service, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Operating Hours</label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-slate-900"><span className="font-medium">Weekdays:</span> {selectedClinic.operatingHours.weekdays}</p>
                    <p className="text-sm text-slate-900"><span className="font-medium">Weekends:</span> {selectedClinic.operatingHours.weekends}</p>
                    <p className="text-sm text-slate-900"><span className="font-medium">Public Holidays:</span> {selectedClinic.operatingHours.publicHolidays}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Registration Date</label>
                    <p className="text-sm text-slate-900">{selectedClinic.registrationDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Last Updated</label>
                    <p className="text-sm text-slate-900">{selectedClinic.lastUpdated}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Latitude</label>
                    <p className="text-sm text-slate-900">{selectedClinic.coordinates.latitude}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Longitude</label>
                    <p className="text-sm text-slate-900">{selectedClinic.coordinates.longitude}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Edit Clinic
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


