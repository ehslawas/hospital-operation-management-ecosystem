import { WardPatient, WardBed, WardStats } from '../types/Ward';

export const calculateWardStats = (patients: WardPatient[], beds: WardBed[]): WardStats => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const totalPatients = patients.length;
    // Assumption: new admissions are those admitted in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const newAdmissions = patients.filter(p => new Date(p.admissionDate) > oneDayAgo).length;

    const pendingDischarges = patients.filter(p => p.status === 'pending-discharge').length;
    const criticalPatients = patients.filter(p => p.status === 'critical').length;

    const isolationBeds = beds.filter(b => b.isIsolation && b.status === 'available').length;

    // Calculate Avg LOS (simple average of current stay duration)
    const totalStayDays = patients.reduce((sum, p) => {
        const admission = new Date(p.admissionDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
    }, 0);

    const averageLengthOfStay = totalPatients > 0 ? Number((totalStayDays / totalPatients).toFixed(1)) : 0;

    return {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        totalPatients,
        newAdmissions,
        pendingDischarges,
        criticalPatients,
        isolationBeds,
        averageLengthOfStay
    };
};
