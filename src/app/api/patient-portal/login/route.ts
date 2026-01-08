import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cleanIC, validateMalaysianIC, validatePIN, validateDOB } from '@/features/patient-portal/utils/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nric, pin, dob } = body;

    // Validate required fields
    if (!nric) {
      return NextResponse.json(
        { success: false, error: 'IC number is required' },
        { status: 400 }
      );
    }

    // Validate IC format
    if (!validateMalaysianIC(nric)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IC number format' },
        { status: 400 }
      );
    }

    const cleanedIC = cleanIC(nric);

    // At least one authentication method required
    if (!pin && !dob) {
      return NextResponse.json(
        { success: false, error: 'PIN or Date of Birth is required' },
        { status: 400 }
      );
    }

    // Validate PIN if provided
    if (pin && !validatePIN(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 6 digits' },
        { status: 400 }
      );
    }

    // Validate DOB if provided
    if (dob && !validateDOB(dob)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date of birth format' },
        { status: 400 }
      );
    }

    // Find patient by IC
    const patient = await prisma.patient.findUnique({
      where: { nric: cleanedIC },
      select: {
        id: true,
        mrn: true,
        nric: true,
        name: true,
        dob: true,
        gender: true,
        phone: true,
        email: true,
        allergies: true,
        isPortalActive: true,
        portalLanguage: true,
        pinHash: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if portal is active
    if (!patient.isPortalActive) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Patient portal not activated. Please contact hospital to activate your account.',
          code: 'PORTAL_NOT_ACTIVE'
        },
        { status: 403 }
      );
    }

    // Authenticate with PIN
    if (pin) {
      if (!patient.pinHash) {
        return NextResponse.json(
          { success: false, error: 'PIN not set. Please contact hospital to set up your PIN.' },
          { status: 401 }
        );
      }
      
      // Compare PIN with hashed PIN
      const pinMatches = await bcrypt.compare(pin, patient.pinHash);
      if (!pinMatches) {
        return NextResponse.json(
          { success: false, error: 'Invalid PIN' },
          { status: 401 }
        );
      }
    }

    // Authenticate with DOB
    if (dob && !pin) {
      const providedDOB = new Date(dob);
      const patientDOB = new Date(patient.dob);
      
      // Compare dates (ignore time)
      if (
        providedDOB.getFullYear() !== patientDOB.getFullYear() ||
        providedDOB.getMonth() !== patientDOB.getMonth() ||
        providedDOB.getDate() !== patientDOB.getDate()
      ) {
        return NextResponse.json(
          { success: false, error: 'Invalid date of birth' },
          { status: 401 }
        );
      }
    }

    // Update last login
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastPortalLogin: new Date() },
    });

    // Log access
    await prisma.patientPortalAccess.create({
      data: {
        patientId: patient.id,
        accessType: 'login',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Generate session token (in production, use JWT)
    const sessionToken = `patient_${patient.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Return patient data (without sensitive info)
    const patientData = {
      id: patient.id,
      mrn: patient.mrn,
      nric: patient.nric,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      allergies: patient.allergies,
      isPortalActive: patient.isPortalActive,
      portalLanguage: patient.portalLanguage,
    };

    return NextResponse.json({
      success: true,
      patient: patientData,
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Patient login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

