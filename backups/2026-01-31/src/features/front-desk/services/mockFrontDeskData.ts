import { Visitor, Appointment, QueueEntry, FrontDeskStats, Counter, PatientRegistration } from '../types/FrontDesk';

const mockVisitors: Visitor[] = [
    {
        id: '1',
        name: 'Alice Johnson',
        icNumber: '900101-01-5678',
        contactNumber: '012-9876543',
        type: 'patient',
        status: 'checked-in',
        checkInTime: new Date(),
        purposeOfVisit: 'Appointment',
        badgeIssued: false,
        temperatureChecked: true,
        healthDeclarationSigned: true,
    }
];

const mockAppointments: Appointment[] = [
    {
        id: '1',
        appointmentNumber: 'APT-001',
        patientName: 'Bob Williams',
        patientIC: '850101-01-2345',
        patientContact: '012-2223333',
        dateOfBirth: new Date('1985-01-01'),
        appointmentDate: new Date(),
        appointmentTime: '10:00',
        estimatedDuration: 30,
        department: 'Cardiology',
        doctor: 'Dr. Jones',
        appointmentType: 'consultation',
        status: 'scheduled',
        reasonForVisit: 'Chest pain',
        isFollowUp: false,
        reminderSent: true,
        hostNotified: false,
    }
];

const mockQueue: QueueEntry[] = [
    {
        id: '1',
        queueNumber: '1001',
        patientName: 'Charlie Brown',
        department: 'Radiology',
        serviceType: 'X-Ray',
        status: 'waiting',
        priority: 'normal',
        joinedAt: new Date(),
        estimatedWaitTime: 20,
    }
];

const mockCounters: Counter[] = [
    {
        id: '1',
        counterNumber: '1',
        status: 'open',
        staffName: 'Staff A',
        servicesOffered: ['Registration', 'Payment'],
    }
];

const mockStats: FrontDeskStats = {
    totalVisitorsToday: 150,
    currentVisitors: 45,
    checkedOutVisitors: 105,
    totalAppointmentsToday: 60,
    completedAppointments: 40,
    pendingAppointments: 20,
    noShows: 5,
    currentQueueSize: 15,
    averageWaitTime: 12,
    longestWaitTime: 30,
    newRegistrationsToday: 10,
    peakHour: '10:00 AM',
    occupancyRate: 75,
};

const mockRegistrations: PatientRegistration[] = [];

export const getTodaysVisitors = (): Visitor[] => mockVisitors;
export const getTodaysAppointments = (): Appointment[] => mockAppointments;
export const getCurrentQueue = (): QueueEntry[] => mockQueue;
export const getCounterStatus = (): Counter[] => mockCounters;
export const getFrontDeskStats = (): FrontDeskStats => mockStats;
export const getRecentRegistrations = (): PatientRegistration[] => mockRegistrations;
