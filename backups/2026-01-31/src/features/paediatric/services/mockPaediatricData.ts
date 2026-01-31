import { PaediatricPatient, PaediatricBed, PaediatricStats, AgeGroup } from '../types/Paediatric';

export const mockPaediatricPatients: PaediatricPatient[] = [
    {
        id: '1',
        registrationNumber: 'PED-2024-001',
        name: 'Ahmad bin Abdullah',
        dateOfBirth: new Date('2023-01-15'),
        ageMonths: 12,
        ageGroup: 'infant',
        gender: 'Male',
        motherName: 'Sarah',
        fatherName: 'Abdullah',
        contactNumber: '012-3456789',
        emergencyContact: '012-3456789',
        admissionDate: new Date(),
        status: 'admitted',
        bedNumber: 'PED-01',
        primaryDiagnosis: 'Bronchiolitis',
        secondaryDiagnoses: [],
        allergies: [],
        attendingPediatrician: 'Dr. Lee',
        assignedNurse: 'Nurse Siti',
        growthMeasurements: [],
        immunizationStatus: 'up-to-date',
        immunizationRecords: [],
        developmentalAssessments: [],
        vitals: [],
        specialNeeds: [],
    }
];

export const mockPaediatricBeds: PaediatricBed[] = [
    {
        id: '1',
        bedNumber: 'PED-01',
        roomNumber: '101',
        zone: 'General',
        status: 'occupied',
        patientId: '1',
        hasCrib: true,
        hasOxygen: true,
        hasMonitor: true,
        isIsolation: false
    },
    {
        id: '2',
        bedNumber: 'PED-02',
        roomNumber: '101',
        zone: 'General',
        status: 'available',
        hasCrib: true,
        hasOxygen: true,
        hasMonitor: true,
        isIsolation: false
    }
];

export const calculatePaediatricStats = (patients: PaediatricPatient[], beds: PaediatricBed[]): PaediatricStats => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const stats: PaediatricStats = {
        totalPatients: patients.length,
        newAdmissions: patients.filter(p => new Date(p.admissionDate).toDateString() === new Date().toDateString()).length,
        criticalCases: patients.filter(p => p.status === 'critical').length,
        byAgeGroup: {
            neonate: patients.filter(p => p.ageGroup === 'neonate').length,
            infant: patients.filter(p => p.ageGroup === 'infant').length,
            toddler: patients.filter(p => p.ageGroup === 'toddler').length,
            preschool: patients.filter(p => p.ageGroup === 'preschool').length,
            schoolAge: patients.filter(p => p.ageGroup === 'school-age').length,
            adolescent: patients.filter(p => p.ageGroup === 'adolescent').length,
        },
        immunizationUpToDate: patients.filter(p => p.immunizationStatus === 'up-to-date').length,
        immunizationDelayed: patients.filter(p => p.immunizationStatus === 'delayed').length,
        occupancyRate,
        availableBeds: totalBeds - occupiedBeds,
        totalBeds
    };

    return stats;
};
