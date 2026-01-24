import { Mother, MaternityBed, MaternityStats, RiskLevel, PregnancyStatus } from '../types/Maternity';

export const mockMothers: Mother[] = [
    {
        id: '1',
        registrationNumber: 'MAT-2024-001',
        name: 'Jane Doe',
        age: 28,
        icNumber: '960101-01-1234',
        contactNumber: '012-3456789',
        status: 'prenatal',
        gravida: 1,
        para: 0,
        abortions: 0,
        livingChildren: 0,
        lmp: new Date('2023-05-01'),
        edd: new Date('2024-02-05'),
        gestationalAge: '37w 3d',
        gestationalWeeks: 37,
        riskLevel: 'low',
        riskFactors: [],
        bloodType: 'O+',
        allergies: [],
        medicalConditions: [],
        previousComplications: [],
        prenatalVisits: [],
    }
];

export const mockMaternityBeds: MaternityBed[] = [
    {
        id: '1',
        roomNumber: '101',
        bedNumber: 'MAT-01',
        ward: 'Prenatal',
        status: 'occupied',
        motherId: '1',
        assignedAt: new Date(),
    },
    {
        id: '2',
        roomNumber: '101',
        bedNumber: 'MAT-02',
        ward: 'Prenatal',
        status: 'available',
    }
];

export const calculateMaternityStats = (mothers: Mother[], beds: MaternityBed[]): MaternityStats => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;

    const stats: MaternityStats = {
        totalPatients: mothers.length,
        prenatal: mothers.filter(m => m.status === 'prenatal').length,
        inLabour: mothers.filter(m => m.status === 'active-labour').length,
        postnatal: mothers.filter(m => m.status === 'postnatal').length,
        deliveriesToday: mothers.filter(m => m.delivery && new Date(m.delivery.deliveryTime).toDateString() === new Date().toDateString()).length,
        caesareanRate: 0,
        averageLabourDuration: 0,
        highRiskCases: mothers.filter(m => m.riskLevel === 'high').length,
        availableBeds: totalBeds - occupiedBeds,
        totalBeds
    };

    // Calculate caesarean rate
    const deliveries = mothers.filter(m => m.delivery);
    if (deliveries.length > 0) {
        const cSections = deliveries.filter(m => m.delivery!.deliveryType.includes('caesarean')).length;
        stats.caesareanRate = Math.round((cSections / deliveries.length) * 100);

        const totalDuration = deliveries.reduce((acc, m) => acc + m.delivery!.labourDuration, 0);
        stats.averageLabourDuration = Math.round((totalDuration / deliveries.length) / 60);
    }

    return stats;
};
