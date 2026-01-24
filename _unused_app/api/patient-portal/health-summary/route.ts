import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get patient basic info
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        mrn: true,
        nric: true,
        name: true,
        dob: true,
        gender: true,
        phone: true,
        email: true,
        address: true,
        allergies: true,
        portalLanguage: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get current prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: patient.id,
        status: { in: ['pending', 'ready', 'dispensed'] },
      },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Transform prescriptions into current medications
    const currentMedications = prescriptions.flatMap((rx: any) => 
      rx.items.map((item: any) => ({
        id: item.id,
        medicationName: item.medication.nameFull,
        genericName: item.medication.genericName,
        strength: item.medication.strength || '',
        form: item.medication.form,
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        route: item.medication.route || 'Oral',
        startDate: rx.createdAt,
        indication: 'As prescribed',
        prescribedBy: rx.doctorName || 'Doctor',
        specialInstructions: item.instructions || undefined,
      }))
    );

    // Mock data for demo (in production, fetch from actual tables)
    const recentVitals = {
      id: 'vital-1',
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      bloodPressureSystolic: 130,
      bloodPressureDiastolic: 85,
      heartRate: 78,
      temperature: 36.8,
      weight: 72,
      height: 170,
      bmi: 24.9,
      oxygenSaturation: 98,
      recordedBy: 'Nurse Sarah',
    };

    const recentLabResults = [
      {
        id: 'lab-1',
        testName: 'HbA1c',
        testDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        result: '6.8%',
        unit: '%',
        referenceRange: '< 7.0%',
        status: 'normal' as const,
        orderedBy: 'Dr. Ahmad',
        notes: 'Good diabetes control',
      },
      {
        id: 'lab-2',
        testName: 'Creatinine',
        testDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        result: '85',
        unit: 'µmol/L',
        referenceRange: '60-110',
        status: 'normal' as const,
        orderedBy: 'Dr. Ahmad',
      },
    ];

    const recentVisits = [
      {
        id: 'visit-1',
        visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        department: 'General Ward',
        doctorName: 'Dr. Siti Aminah',
        chiefComplaint: 'Follow-up visit',
        diagnosis: 'Type 2 Diabetes Mellitus, well-controlled',
        treatmentPlan: 'Continue current medications',
        status: 'completed' as const,
      },
    ];

    const healthSummary = {
      patient,
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
      currentMedications: currentMedications.slice(0, 5), // Limit to 5 most recent
      recentVitals,
      recentLabResults,
      recentVisits,
      lastVisit: recentVisits[0] || null,
    };

    // Log access
    await prisma.patientPortalAccess.create({
      data: {
        patientId: patient.id,
        accessType: 'view_health_summary',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: healthSummary,
    });

  } catch (error) {
    console.error('Error fetching health summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

