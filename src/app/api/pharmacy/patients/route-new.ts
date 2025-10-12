import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

// Feature flag to switch between mock and real database
const USE_REAL_DATABASE = process.env.USE_REAL_DATABASE === 'true';

/**
 * GET /api/pharmacy/patients
 * 
 * Query Parameters:
 * - id: Get single patient by ID
 * - q: Search patients by name, MRN, or NRIC
 * 
 * Returns: Patient or array of patients
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const id = searchParams.get('id');

    // ===== MOCK DATA IMPLEMENTATION =====
    if (!USE_REAL_DATABASE) {
      const store = getDataStore();

      if (id) {
        const patient = store.getPatient(id);
        if (!patient) {
          return notFoundResponse('Patient');
        }
        return successResponse(patient);
      }

      if (query) {
        const patients = store.searchPatients(query);
        return successResponse(patients);
      }

      const patients = store.getPatients();
      return successResponse(patients);
    }

    // ===== REAL DATABASE IMPLEMENTATION =====
    
    // Get single patient with related data
    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          prescriptions: {
            include: {
              items: {
                include: {
                  medication: true,
                },
              },
            },
            orderBy: { prescribedAt: 'desc' },
            take: 10,
          },
          appointments: {
            orderBy: { dateTime: 'desc' },
            take: 10,
          },
          adrIncidents: {
            include: {
              medication: true,
            },
            orderBy: { reportedAt: 'desc' },
          },
        },
      });

      if (!patient) {
        return notFoundResponse('Patient');
      }

      return successResponse(patient);
    }

    // Search patients
    if (query) {
      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mrn: { contains: query, mode: 'insensitive' } },
            { nric: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      return successResponse(patients);
    }

    // Get all patients (paginated)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count(),
    ]);

    return successResponse({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return serverErrorResponse('Failed to fetch patients');
  }
}

/**
 * POST /api/pharmacy/patients
 * 
 * Body: Patient data
 * Returns: Created patient
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const requiredFields = ['mrn', 'nric', 'name', 'dob', 'gender'];
    const missing = requiredFields.filter(field => !body[field]);
    
    if (missing.length > 0) {
      return errorResponse(
        'Validation failed',
        400,
        { missingFields: missing }
      );
    }

    // ===== MOCK DATA IMPLEMENTATION =====
    if (!USE_REAL_DATABASE) {
      // Mock implementation doesn't support creation
      return errorResponse('Cannot create patients in mock mode', 501);
    }

    // ===== REAL DATABASE IMPLEMENTATION =====
    
    // Check if patient already exists
    const existingByMrn = await prisma.patient.findUnique({
      where: { mrn: body.mrn },
    });

    if (existingByMrn) {
      return errorResponse('Patient with this MRN already exists', 409);
    }

    const existingByNric = await prisma.patient.findUnique({
      where: { nric: body.nric },
    });

    if (existingByNric) {
      return errorResponse('Patient with this NRIC already exists', 409);
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        mrn: body.mrn,
        nric: body.nric,
        name: body.name,
        dob: new Date(body.dob),
        gender: body.gender,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        allergies: body.allergies || [],
      },
    });

    return successResponse(patient, 201);
  } catch (error) {
    console.error('Error creating patient:', error);
    return serverErrorResponse('Failed to create patient');
  }
}

/**
 * PATCH /api/pharmacy/patients?id=xxx
 * 
 * Body: Partial patient data to update
 * Returns: Updated patient
 */
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Patient ID is required', 400);
    }

    const body = await request.json();

    // ===== MOCK DATA IMPLEMENTATION =====
    if (!USE_REAL_DATABASE) {
      return errorResponse('Cannot update patients in mock mode', 501);
    }

    // ===== REAL DATABASE IMPLEMENTATION =====
    
    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return notFoundResponse('Patient');
    }

    // Update patient
    const updatedData: any = {};
    
    if (body.name) updatedData.name = body.name;
    if (body.phone !== undefined) updatedData.phone = body.phone;
    if (body.email !== undefined) updatedData.email = body.email;
    if (body.address !== undefined) updatedData.address = body.address;
    if (body.allergies !== undefined) updatedData.allergies = body.allergies;

    const patient = await prisma.patient.update({
      where: { id },
      data: updatedData,
    });

    return successResponse(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return serverErrorResponse('Failed to update patient');
  }
}

