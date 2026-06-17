import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const id = searchParams.get('id');

  const store = getDataStore();

  if (id) {
    const patient = store.getPatient(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    return NextResponse.json(patient);
  }

  if (query) {
    const patients = store.searchPatients(query);
    return NextResponse.json(patients);
  }

  const patients = store.getPatients();
  return NextResponse.json(patients);
}

