import { ImagingOrder, RadiologyReport, RadiologyEquipment, Radiologist, RadiologyStats } from '../types/Radiology';

const mockOrders: ImagingOrder[] = [
    {
        id: '1',
        orderNumber: 'ORD-2024-001',
        orderDate: new Date(),
        patientName: 'John Doe',
        patientIC: '800101-01-1234',
        patientMRN: 'MRN-001',
        dateOfBirth: new Date('1980-01-01'),
        age: 44,
        gender: 'Male',
        modality: 'X-Ray',
        studyType: 'Chest X-Ray',
        bodyPart: 'Chest',
        clinicalHistory: 'Cough for 1 week',
        clinicalIndication: 'Rule out pneumonia',
        orderingDepartment: 'General Ward',
        orderingPhysician: 'Dr. Smith',
        priority: 'routine',
        status: 'pending',
        contrast: false,
        sedation: false,
        isolation: false,
        portable: false,
    }
];

const mockReports: RadiologyReport[] = [
    {
        id: '1',
        reportNumber: 'REP-2024-001',
        studyId: 'ST-001',
        orderId: '1',
        accessionNumber: 'ACC-001',
        patientName: 'John Doe',
        patientMRN: 'MRN-001',
        modality: 'X-Ray',
        studyDescription: 'Chest X-Ray',
        indication: 'Cough',
        technique: 'PA and Lateral',
        findings: 'Normal chest x-ray',
        impression: 'No active disease',
        criticalFinding: false,
        reportedBy: 'Dr. Rad',
        reportDate: new Date(),
        status: 'final',
        hasAddendum: false,
        notifiedToReferrer: true,
    }
];

const mockEquipment: RadiologyEquipment[] = [
    {
        id: '1',
        equipmentName: 'X-Ray 1',
        modality: 'X-Ray',
        manufacturer: 'GE',
        model: 'Optima',
        serialNumber: 'SN-001',
        location: 'Room 1',
        room: '101',
        status: 'operational',
        totalStudiesToday: 15,
        totalStudiesThisWeek: 100,
        totalStudiesThisMonth: 400,
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maintenanceInterval: 90,
        lastCalibrationDate: new Date(),
        nextCalibrationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentlyInUse: false,
        hasIssues: false,
    }
];

const mockRadiologists: Radiologist[] = [
    {
        id: '1',
        name: 'Dr. Rad',
        designation: 'Senior Radiologist',
        specialization: ['X-Ray', 'CT'],
        onDuty: true,
        availableForReporting: true,
        studiesReportedToday: 10,
        pendingReports: 2,
        contactNumber: '012-3456789',
    }
];

const mockStats: RadiologyStats = {
    totalOrdersToday: 50,
    pendingOrders: 10,
    completedStudies: 40,
    pendingReports: 5,
    statOrders: 2,
    urgentOrders: 5,
    routineOrders: 43,
    xrayStudies: 30,
    ctStudies: 10,
    mriStudies: 5,
    ultrasoundStudies: 5,
    averageReportingTime: 45,
    averageStudyDuration: 15,
    criticalFindingsToday: 1,
    equipmentOperational: 5,
    equipmentOffline: 0,
    repeatRate: 2,
    capacityUtilization: 80,
    estimatedWaitTime: 20,
};

export const getImagingOrders = () => mockOrders;
export const getRadiologyReports = () => mockReports;
export const getRadiologyEquipment = () => mockEquipment;
export const getRadiologists = () => mockRadiologists;
export const getRadiologyStats = () => mockStats;
