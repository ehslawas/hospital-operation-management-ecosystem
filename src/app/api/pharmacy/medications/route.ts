import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const code = searchParams.get('code');

  const store = getDataStore();

  if (code) {
    const medication = store.getMedication(code);
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }
    return NextResponse.json(medication);
  }

  if (query) {
    const medications = store.searchMedications(query);
    return NextResponse.json(medications);
  }

  const medications = store.getMedications();
  return NextResponse.json(medications);
}

