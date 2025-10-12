import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status');
  const withDetails = searchParams.get('withDetails') === 'true';

  const store = getDataStore();

  if (id) {
    if (withDetails) {
      const prescription = store.getPrescriptionWithDetails(id);
      if (!prescription) {
        return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
      }
      return NextResponse.json(prescription);
    }
    
    const prescription = store.getPrescription(id);
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    return NextResponse.json(prescription);
  }

  if (patientId) {
    const prescriptions = store.getPrescriptionsByPatient(patientId);
    return NextResponse.json(prescriptions);
  }

  if (status) {
    const prescriptions = store.getPrescriptionsByStatus(status as any);
    return NextResponse.json(prescriptions);
  }

  const prescriptions = store.getPrescriptions();
  return NextResponse.json(prescriptions);
}

export async function POST(request: NextRequest) {
  const store = getDataStore();
  const body = await request.json();
  
  const prescription = store.createPrescription(body);
  return NextResponse.json(prescription, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const store = getDataStore();
  const body = await request.json();
  
  const prescription = store.updatePrescription(id, body);
  if (!prescription) {
    return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
  }
  
  return NextResponse.json(prescription);
}

