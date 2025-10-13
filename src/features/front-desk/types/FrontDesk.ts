export type VisitorType = 'patient' | 'family' | 'vendor' | 'official' | 'other';
export type VisitorStatus = 'checked-in' | 'visiting' | 'checked-out';
export type AppointmentStatus = 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'no-show' | 'cancelled';
export type AppointmentType = 'consultation' | 'follow-up' | 'procedure' | 'vaccination' | 'screening';
export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed';

export interface Visitor {
  id: string;
  name: string;
  icNumber: string;
  contactNumber: string;
  type: VisitorType;
  status: VisitorStatus;
  
  // Check-in details
  checkInTime: Date;
  checkOutTime?: Date;
  
  // Purpose
  purposeOfVisit: string;
  hostName?: string; // Patient or staff they're visiting
  hostDepartment?: string;
  hostBedNumber?: string;
  
  // Badge
  badgeNumber?: string;
  badgeIssued: boolean;
  
  // Additional info
  vehicleNumber?: string;
  emergencyContact?: string;
  
  // Health screening (COVID-era relevant)
  temperatureChecked: boolean;
  temperature?: number;
  healthDeclarationSigned: boolean;
  
  notes?: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  
  // Patient info
  patientName: string;
  patientIC: string;
  patientContact: string;
  dateOfBirth: Date;
  
  // Appointment details
  appointmentDate: Date;
  appointmentTime: string;
  estimatedDuration: number; // minutes
  
  department: string;
  doctor: string;
  appointmentType: AppointmentType;
  
  status: AppointmentStatus;
  
  // Check-in
  arrivedAt?: Date;
  checkedInBy?: string;
  
  // Queue
  queueNumber?: string;
  calledAt?: Date;
  
  // Notes
  reasonForVisit: string;
  specialRequirements?: string;
  notes?: string;
  
  // Follow-up
  isFollowUp: boolean;
  previousVisitDate?: Date;
  
  // Notifications
  reminderSent: boolean;
  hostNotified: boolean;
}

export interface PatientRegistration {
  id: string;
  registrationNumber: string;
  registrationDate: Date;
  
  // Personal info
  name: string;
  icNumber: string;
  dateOfBirth: Date;
  age: number;
  gender: 'Male' | 'Female';
  
  // Contact
  address: string;
  city: string;
  state: string;
  postcode: string;
  contactNumber: string;
  email?: string;
  
  // Emergency contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactNumber: string;
  
  // Medical info
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  
  // Insurance
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  
  // Consent
  consentForTreatment: boolean;
  consentForDataSharing: boolean;
  consentDate: Date;
  
  // Registration details
  registeredBy: string;
  status: 'pending' | 'verified' | 'active';
}

export interface QueueEntry {
  id: string;
  queueNumber: string;
  
  patientName: string;
  appointmentId?: string;
  
  department: string;
  serviceType: string;
  
  status: QueueStatus;
  priority: 'normal' | 'urgent' | 'emergency';
  
  joinedAt: Date;
  calledAt?: Date;
  servingAt?: Date;
  completedAt?: Date;
  
  estimatedWaitTime: number; // minutes
  currentlyServing?: string; // counter/room number
  
  notes?: string;
}

export interface FrontDeskStats {
  // Visitors
  totalVisitorsToday: number;
  currentVisitors: number;
  checkedOutVisitors: number;
  
  // Appointments
  totalAppointmentsToday: number;
  completedAppointments: number;
  pendingAppointments: number;
  noShows: number;
  
  // Queue
  currentQueueSize: number;
  averageWaitTime: number;
  longestWaitTime: number;
  
  // Registrations
  newRegistrationsToday: number;
  
  // Peak times
  peakHour: string;
  occupancyRate: number;
}

export interface Counter {
  id: string;
  counterNumber: string;
  status: 'open' | 'closed' | 'busy';
  staffName?: string;
  currentPatient?: string;
  servicesOffered: string[];
}








