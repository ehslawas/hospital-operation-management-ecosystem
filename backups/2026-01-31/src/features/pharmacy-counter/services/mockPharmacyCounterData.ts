import { Prescription, Pharmacist, PharmacyCounterStats, PrescriptionStatus, PrescriptionType, PaymentMethod, CounselingStatus } from '../types/PharmacyCounter';

const mockPrescriptions: Prescription[] = [
    {
        id: '1',
        prescriptionNumber: 'RX-2024-001',
        prescriptionDate: new Date(),
        patientName: 'John Doe',
        patientIC: '800101-01-1234',
        patientMRN: 'MRN-001',
        dateOfBirth: new Date('1980-01-01'),
        age: 44,
        gender: 'Male',
        contactNumber: '012-3456789',
        prescribedBy: 'Dr. Smith',
        prescriberLicenseNo: 'MMC-12345',
        department: 'General Medicine',
        type: 'new',
        priority: 'routine',
        status: 'pending',
        medications: [],
        diagnosis: 'Hypertension',
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        counselingStatus: 'required',
        paymentMethod: 'cash',
        totalAmount: 50,
        paymentStatus: 'pending',
        receivedAt: new Date(),
        hasInteractions: false,
        hasAllergies: false,
        hasDuplicateTherapy: false,
        requiresFollowUp: false,
    }
];

const mockPharmacists: Pharmacist[] = [
    {
        id: '1',
        name: 'Sarah Lee',
        registrationNumber: 'RPH-001',
        onDuty: true,
        availableForDispensing: true,
        prescriptionsDispensedToday: 15,
        counselingSessionsToday: 5,
        pendingPrescriptions: 2,
        counterNumber: '1',
        contactNumber: '012-1111111',
    }
];

const mockStats: PharmacyCounterStats = {
    totalPrescriptionsToday: 100,
    pendingPrescriptions: 20,
    dispensedPrescriptions: 80,
    statPrescriptions: 5,
    urgentPrescriptions: 10,
    routinePrescriptions: 85,
    currentQueueSize: 10,
    averageWaitTime: 15,
    longestWaitTime: 45,
    interactionsCaught: 2,
    allergiesPrevented: 1,
    duplicateTherapyDetected: 0,
    counselingSessionsToday: 25,
    averageCounselingTime: 10,
    totalRevenueToday: 5000,
    insuranceClaimsToday: 40,
    averageDispensingTime: 5,
    prescriptionsPerHour: 12,
    outOfStockItems: 1,
    nearExpiryAlerts: 3,
};

export const getPrescriptions = (): Prescription[] => mockPrescriptions;
export const getPharmacists = (): Pharmacist[] => mockPharmacists;
export const getPharmacyCounterStats = (): PharmacyCounterStats => mockStats;
