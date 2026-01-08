'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  icNumber: string;
  passportNumber: string;
  dob: string;
  gender: string;
  phoneNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
  medicalHistory: string;
  insuranceProvider: string;
  insuranceNumber: string;
  preferredLanguage: string;
  maritalStatus: string;
  occupation: string;
  nationality: string;
  race: string;
  raceOther: string;
  religion: string;
  religionOther: string;
  lastVisit: string;
  age: number;
}

// Generate 200 mock patients
const generateMockPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const names = [
    'Ahmad bin Abdullah', 'Siti Nurhaliza binti Rahman', 'Lim Wei Ming', 'Priya Devi a/p Rajan',
    'Muhammad Faris bin Hassan', 'Tan Mei Ling', 'Kumar a/l Suresh', 'Fatimah binti Omar',
    'Lee Wei Jie', 'Nurul Izzah binti Kamal', 'Rajesh a/l Maniam', 'Sarah binti Ismail',
    'Chen Wei Hao', 'Aishah binti Ahmad', 'Vikram a/l Krishnan', 'Lim Siew Hoon',
    'Mohammad Rizal bin Ali', 'Wong Mei Yee', 'Deepa a/p Ramasamy', 'Hassan bin Yusof',
    'Ng Wei Kiat', 'Norhayati binti Mokhtar', 'Arjun a/l Subramaniam', 'Chua Bee Lian',
    'Ibrahim bin Abdul Rahman', 'Goh Li Ping', 'Malathi a/p Raju', 'Zainal bin Abu Bakar',
    'Teo Wei Jie', 'Rohani binti Hashim', 'Suresh a/l Palani', 'Yap Mei Fong',
    'Azman bin Mohd Nor', 'Lau Wei Ming', 'Kamala a/p Selvam', 'Rashid bin Hassan',
    'Khoo Wei Cheong', 'Noraini binti Sulaiman', 'Muthu a/l Perumal', 'Rosli bin Ahmad',
    'Chong Wei Kiat', 'Salmah binti Ibrahim', 'Ravi a/l Kumar', 'Halim bin Omar',
    'Ooi Wei Seng', 'Zarina binti Mohd', 'Santhosh a/l Raman', 'Amin bin Hassan',
    'Chew Wei Ming', 'Rohaya binti Abdullah', 'Mani a/l Selvam', 'Fauzi bin Ismail',
    'Tan Wei Jie', 'Norazila binti Yusof', 'Siva a/l Krishnan', 'Hafiz bin Ahmad',
    'Liew Wei Kiat', 'Norhayati binti Mokhtar', 'Kannan a/l Munusamy', 'Razak bin Hassan',
    'Yong Wei Ming', 'Norshahida binti Omar', 'Murugan a/l Raman', 'Shahrizal bin Ahmad',
    'Gan Wei Jie', 'Norazila binti Yusof', 'Suresh a/l Palani', 'Ahmad bin Hassan',
    'Toh Wei Kiat', 'Norhayati binti Mokhtar', 'Ravi a/l Kumar', 'Mohd bin Omar',
    'Lim Wei Ming', 'Norshahida binti Omar', 'Muthu a/l Perumal', 'Hassan bin Ahmad',
    'Ng Wei Jie', 'Norazila binti Yusof', 'Santhosh a/l Raman', 'Ibrahim bin Hassan',
    'Chong Wei Kiat', 'Norhayati binti Mokhtar', 'Kannan a/l Munusamy', 'Azman bin Omar',
    'Ooi Wei Ming', 'Norshahida binti Omar', 'Murugan a/l Raman', 'Rashid bin Ahmad',
    'Chew Wei Jie', 'Norazila binti Yusof', 'Siva a/l Krishnan', 'Halim bin Hassan',
    'Tan Wei Kiat', 'Norhayati binti Mokhtar', 'Mani a/l Selvam', 'Fauzi bin Omar',
    'Liew Wei Ming', 'Norshahida binti Omar', 'Ravi a/l Kumar', 'Shahrizal bin Ahmad',
    'Yong Wei Jie', 'Norazila binti Yusof', 'Suresh a/l Palani', 'Ahmad bin Hassan',
    'Gan Wei Kiat', 'Norhayati binti Mokhtar', 'Kannan a/l Munusamy', 'Mohd bin Omar',
    'Toh Wei Ming', 'Norshahida binti Omar', 'Muthu a/l Perumal', 'Hassan bin Ahmad',
    'Lim Wei Jie', 'Norazila binti Yusof', 'Santhosh a/l Raman', 'Ibrahim bin Hassan',
    'Ng Wei Kiat', 'Norhayati binti Mokhtar', 'Murugan a/l Raman', 'Azman bin Omar',
    'Chong Wei Ming', 'Norshahida binti Omar', 'Siva a/l Krishnan', 'Rashid bin Ahmad',
    'Ooi Wei Jie', 'Norazila binti Yusof', 'Mani a/l Selvam', 'Halim bin Hassan',
    'Chew Wei Kiat', 'Norhayati binti Mokhtar', 'Ravi a/l Kumar', 'Fauzi bin Omar',
    'Tan Wei Ming', 'Norshahida binti Omar', 'Suresh a/l Palani', 'Shahrizal bin Ahmad',
    'Liew Wei Jie', 'Norazila binti Yusof', 'Kannan a/l Munusamy', 'Ahmad bin Hassan',
    'Yong Wei Kiat', 'Norhayati binti Mokhtar', 'Muthu a/l Perumal', 'Mohd bin Omar',
    'Gan Wei Ming', 'Norshahida binti Omar', 'Santhosh a/l Raman', 'Hassan bin Ahmad',
    'Toh Wei Jie', 'Norazila binti Yusof', 'Murugan a/l Raman', 'Ibrahim bin Hassan',
    'Lim Wei Kiat', 'Norhayati binti Mokhtar', 'Siva a/l Krishnan', 'Azman bin Omar',
    'Ng Wei Ming', 'Norshahida binti Omar', 'Mani a/l Selvam', 'Rashid bin Ahmad',
    'Chong Wei Jie', 'Norazila binti Yusof', 'Ravi a/l Kumar', 'Halim bin Hassan',
    'Ooi Wei Kiat', 'Norhayati binti Mokhtar', 'Suresh a/l Palani', 'Fauzi bin Omar',
    'Chew Wei Ming', 'Norshahida binti Omar', 'Kannan a/l Munusamy', 'Shahrizal bin Ahmad',
    'Tan Wei Jie', 'Norazila binti Yusof', 'Muthu a/l Perumal', 'Ahmad bin Hassan',
    'Liew Wei Kiat', 'Norhayati binti Mokhtar', 'Santhosh a/l Raman', 'Mohd bin Omar',
    'Yong Wei Ming', 'Norshahida binti Omar', 'Murugan a/l Raman', 'Hassan bin Ahmad',
    'Gan Wei Jie', 'Norazila binti Yusof', 'Siva a/l Krishnan', 'Ibrahim bin Hassan',
    'Toh Wei Kiat', 'Norhayati binti Mokhtar', 'Mani a/l Selvam', 'Azman bin Omar',
    'Lim Wei Ming', 'Norshahida binti Omar', 'Ravi a/l Kumar', 'Rashid bin Ahmad',
    'Ng Wei Jie', 'Norazila binti Yusof', 'Suresh a/l Palani', 'Halim bin Hassan',
    'Chong Wei Kiat', 'Norhayati binti Mokhtar', 'Kannan a/l Munusamy', 'Fauzi bin Omar',
    'Ooi Wei Ming', 'Norshahida binti Omar', 'Muthu a/l Perumal', 'Shahrizal bin Ahmad',
    'Chew Wei Jie', 'Norazila binti Yusof', 'Santhosh a/l Raman', 'Ahmad bin Hassan'
  ];

  const genders = ['Male', 'Female'];
  const addresses = [
    '123 Jalan Ampang, Kuala Lumpur', '456 Taman Desa, Petaling Jaya', '789 Bandar Utama, Selangor',
    '321 Jalan Sultan Ismail, KL', '654 Taman Tun Dr Ismail, KL', '987 Bandar Sunway, Selangor',
    '147 Jalan Bukit Bintang, KL', '258 Taman Maluri, KL', '369 Bandar Puteri, Selangor',
    '741 Jalan Pudu, KL', '852 Taman Midah, KL', '963 Bandar Kinrara, Selangor'
  ];

  const races = ['Malay', 'Chinese', 'Indian', 'Other'];
  const religions = ['Islam', 'Buddhism', 'Hinduism', 'Christianity', 'Other'];
  const languages = ['Malay', 'English', 'Chinese', 'Tamil', 'Other'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const occupations = ['Engineer', 'Teacher', 'Doctor', 'Nurse', 'Business Owner', 'Student', 'Retired', 'Unemployed'];

  for (let i = 1; i <= 200; i++) {
    const fullName = names[(i - 1) % names.length];
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] + (nameParts.length > 2 ? ' ' + nameParts[1] : '');
    const lastName = nameParts[nameParts.length - 1];
    
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const age = Math.floor(Math.random() * 70) + 18; // 18-87 years old
    const year = 1950 + Math.floor(Math.random() * 50); // 1950-1999
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const stateCode = String(Math.floor(Math.random() * 14) + 1).padStart(2, '0');
    const icNumber = `${year}${month}${day}-${stateCode}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const phoneNumber = `01${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
    const lastVisit = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dob = `${year}-${month}-${day}`;
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const emergencyContact = names[Math.floor(Math.random() * names.length)];
    const emergencyPhone = `01${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
    const race = races[Math.floor(Math.random() * races.length)];
    const religion = religions[Math.floor(Math.random() * religions.length)];
    const preferredLanguage = languages[Math.floor(Math.random() * languages.length)];
    const maritalStatus = maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)];
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];

    patients.push({
      id: `R2025-${String(i).padStart(3, '0')}`,
      firstName,
      lastName,
      name: fullName,
      icNumber,
      passportNumber: Math.random() > 0.8 ? `A${String(Math.floor(Math.random() * 9000000) + 1000000)}` : '',
      dob,
      gender,
      phoneNumber,
      email: `${firstName.toLowerCase().replace(/\s+/g, '.')}.${lastName.toLowerCase()}@email.com`,
      address,
      emergencyContact,
      emergencyPhone,
      allergies: Math.random() > 0.7 ? 'Penicillin' : 'NKDA',
      medicalHistory: Math.random() > 0.6 ? 'Diabetes, Hypertension' : '',
      insuranceProvider: Math.random() > 0.5 ? 'Great Eastern' : '',
      insuranceNumber: Math.random() > 0.5 ? `GE${String(Math.floor(Math.random() * 900000) + 100000)}` : '',
      preferredLanguage,
      maritalStatus,
      occupation,
      nationality: 'Malaysian',
      race,
      raceOther: race === 'Other' ? 'Mixed' : '',
      religion,
      religionOther: religion === 'Other' ? 'Sikh' : '',
      lastVisit,
      age
    });
  }

  return patients;
};

export default function PatientManagementPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    icNumber: '',
    passportNumber: '',
    dob: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    medicalHistory: '',
    insuranceProvider: '',
    insuranceNumber: '',
    preferredLanguage: '',
    maritalStatus: '',
    occupation: '',
    nationality: '',
    race: '',
    raceOther: '',
    religion: '',
    religionOther: ''
  });
  const patientsPerPage = 10;

  // Initialize patients data
  useEffect(() => {
    const mockPatients = generateMockPatients();
    setPatients(mockPatients);
    setFilteredPatients(mockPatients);
  }, []);

  // Helper function to check if search query matches NRIC patterns
  const matchesNRIC = (icNumber: string, searchQuery: string): boolean => {
    // Remove all hyphens and spaces from both IC and search query
    const cleanIC = icNumber.replace(/[-\s]/g, '');
    const cleanQuery = searchQuery.replace(/[-\s]/g, '');
    
    // Direct match
    if (icNumber.toLowerCase().includes(searchQuery.toLowerCase()) || cleanIC.includes(cleanQuery)) {
      return true;
    }
    
    // Match last 6 digits (e.g., 940120-12-6733 -> search "136733")
    if (cleanIC.length >= 6 && cleanQuery.length >= 3) {
      const lastSixDigits = cleanIC.slice(-6);
      if (lastSixDigits.includes(cleanQuery)) {
        return true;
      }
    }
    
    // Match last 4 digits (e.g., 940120-12-6733 -> search "6733")
    if (cleanIC.length >= 4 && cleanQuery.length >= 3) {
      const lastFourDigits = cleanIC.slice(-4);
      if (lastFourDigits.includes(cleanQuery)) {
        return true;
      }
    }
    
    // Match state code + last 4 digits (e.g., 940120-12-6733 -> search "13-6733" or "136733")
    if (icNumber.includes('-') && cleanQuery.length >= 4) {
      const parts = icNumber.split('-');
      if (parts.length >= 3) {
        const stateCode = parts[1];
        const lastFour = parts[2];
        const stateAndLastFour = stateCode + lastFour;
        if (stateAndLastFour.includes(cleanQuery)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        matchesNRIC(patient.icNumber, searchQuery) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, patients]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const handleAddPatient = () => {
    setFormData({
      firstName: '',
      lastName: '',
      icNumber: '',
      passportNumber: '',
      dob: '',
      gender: '',
      phoneNumber: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      allergies: '',
      medicalHistory: '',
      insuranceProvider: '',
      insuranceNumber: '',
      preferredLanguage: '',
      maritalStatus: '',
      occupation: '',
      nationality: '',
      race: '',
      raceOther: '',
      religion: '',
      religionOther: ''
    });
    setShowAddModal(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      icNumber: patient.icNumber,
      passportNumber: patient.passportNumber,
      dob: patient.dob,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      allergies: patient.allergies,
      medicalHistory: patient.medicalHistory,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      preferredLanguage: patient.preferredLanguage,
      maritalStatus: patient.maritalStatus,
      occupation: patient.occupation,
      nationality: patient.nationality,
      race: patient.race,
      raceOther: patient.raceOther,
      religion: patient.religion,
      religionOther: patient.religionOther
    });
    setShowEditModal(true);
  };

  const handleSavePatient = () => {
    if (showAddModal) {
      // Add new patient
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const today = new Date().toISOString().split('T')[0];
      const age = formData.dob ? Math.floor((Date.now() - new Date(formData.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      
      const newPatient: Patient = {
        id: `R2025-${String(patients.length + 1).padStart(3, '0')}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: fullName,
        icNumber: formData.icNumber,
        passportNumber: formData.passportNumber,
        dob: formData.dob,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        insuranceProvider: formData.insuranceProvider,
        insuranceNumber: formData.insuranceNumber,
        preferredLanguage: formData.preferredLanguage,
        maritalStatus: formData.maritalStatus,
        occupation: formData.occupation,
        nationality: formData.nationality,
        race: formData.race,
        raceOther: formData.raceOther,
        religion: formData.religion,
        religionOther: formData.religionOther,
        lastVisit: today,
        age
      };
      setPatients([...patients, newPatient]);
      setShowAddModal(false);
    } else if (showEditModal && selectedPatient) {
      // Update existing patient
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const age = formData.dob ? Math.floor((Date.now() - new Date(formData.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : selectedPatient.age;
      
      const updatedPatient = {
        ...selectedPatient,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: fullName,
        icNumber: formData.icNumber,
        passportNumber: formData.passportNumber,
        dob: formData.dob,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        insuranceProvider: formData.insuranceProvider,
        insuranceNumber: formData.insuranceNumber,
        preferredLanguage: formData.preferredLanguage,
        maritalStatus: formData.maritalStatus,
        occupation: formData.occupation,
        nationality: formData.nationality,
        race: formData.race,
        raceOther: formData.raceOther,
        religion: formData.religion,
        religionOther: formData.religionOther,
        age
      };
      
      const updatedPatients = patients.map(p =>
        p.id === selectedPatient.id ? updatedPatient : p
      );
      setPatients(updatedPatients);
      setShowEditModal(false);
      setSelectedPatient(null);
    }
    setFormData({
      firstName: '', lastName: '', icNumber: '', passportNumber: '', dob: '', gender: '',
      phoneNumber: '', email: '', address: '', emergencyContact: '', emergencyPhone: '',
      allergies: '', medicalHistory: '', insuranceProvider: '', insuranceNumber: '',
      preferredLanguage: '', maritalStatus: '', occupation: '', nationality: '', race: '', raceOther: '', religion: '', religionOther: ''
    });
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedPatient(null);
    setFormData({
      firstName: '', lastName: '', icNumber: '', passportNumber: '', dob: '', gender: '',
      phoneNumber: '', email: '', address: '', emergencyContact: '', emergencyPhone: '',
      allergies: '', medicalHistory: '', insuranceProvider: '', insuranceNumber: '',
      preferredLanguage: '', maritalStatus: '', occupation: '', nationality: '', race: '', raceOther: '', religion: '', religionOther: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const PatientForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              required
              value={formData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NRIC Number *</label>
            <input
              type="text"
              required
              value={formData.icNumber}
              onChange={(e) => handleInputChange('icNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="e.g., 900101-14-1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
            <input
              type="text"
              value={formData.passportNumber}
              onChange={(e) => handleInputChange('passportNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="For non-citizens"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="e.g., 012-3456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="patient@email.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
              placeholder="Enter complete address"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name *</label>
            <input
              type="text"
              required
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Emergency contact full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone *</label>
            <input
              type="tel"
              required
              value={formData.emergencyPhone}
              onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Emergency contact phone number"
            />
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          Medical Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="List any known allergies or 'NKDA'"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider</label>
            <input
              type="text"
              value={formData.insuranceProvider}
              onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Insurance company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Number</label>
            <input
              type="text"
              value={formData.insuranceNumber}
              onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Policy number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            >
              <option value="">Select Language</option>
              <option value="Malay">Malay</option>
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
              <option value="Tamil">Tamil</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
            <textarea
              value={formData.medicalHistory}
              onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
              placeholder="Previous medical conditions, surgeries, medications, etc."
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Additional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Job title or profession"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              placeholder="e.g., Malaysian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Race</label>
            <select
              value={formData.race}
              onChange={(e) => handleInputChange('race', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            >
              <option value="">Select Race</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
            {formData.race === 'Other' && (
              <input
                type="text"
                value={formData.raceOther}
                onChange={(e) => handleInputChange('raceOther', e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Please specify race"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Religion</label>
            <select
              value={formData.religion}
              onChange={(e) => handleInputChange('religion', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            >
              <option value="">Select Religion</option>
              <option value="Islam">Islam</option>
              <option value="Buddhism">Buddhism</option>
              <option value="Hinduism">Hinduism</option>
              <option value="Christianity">Christianity</option>
              <option value="Other">Other</option>
            </select>
            {formData.religion === 'Other' && (
              <input
                type="text"
                value={formData.religionOther}
                onChange={(e) => handleInputChange('religionOther', e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Please specify religion"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-emerald-200/60 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Patient Management</h1>
        <p className="text-slate-600">Search, view and edit patient demographics.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <input 
                className="w-72 px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none" 
                placeholder="Search name / NRIC (full or partial)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} patients
              </span>
            </div>
            <div className="text-xs text-slate-500">
              NRIC search examples: "940120-12-6733", "136733", "13-6733", or "6733"
            </div>
          </div>
          <button 
            onClick={handleAddPatient}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-colors"
          >
            Add Patient
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                <th className="pb-3">Reg #</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">NRIC</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Age</th>
                <th className="pb-3">Gender</th>
                <th className="pb-3">Race</th>
                <th className="pb-3">Last Visit</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPatients.map(p => (
                <tr key={p.id} className="hover:bg-emerald-50/40">
                  <td className="py-3 text-slate-700 font-medium">{p.id}</td>
                  <td className="py-3 text-slate-800 font-semibold">{p.name}</td>
                  <td className="py-3 text-slate-600">{p.icNumber}</td>
                  <td className="py-3 text-slate-600">{p.phoneNumber}</td>
                  <td className="py-3 text-slate-600">{p.age}</td>
                  <td className="py-3 text-slate-600">{p.gender}</td>
                  <td className="py-3 text-slate-600">{p.race}</td>
                  <td className="py-3 text-slate-600">{p.lastVisit}</td>
                  <td className="py-3">
                    <button 
                      onClick={() => handleEditPatient(p)}
                      className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add New Patient</h2>
                    <p className="text-emerald-100">Complete patient information for registration</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <PatientForm />
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-200 mt-8">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePatient}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Add Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Patient Details</h2>
                    <p className="text-emerald-100">Update patient information</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <PatientForm isEdit={true} />
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-200 mt-8">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePatient}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


