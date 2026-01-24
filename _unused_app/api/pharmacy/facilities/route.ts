import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  const store = getDataStore();

  if (id) {
    const facility = store.getFacility(id);
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }
    return NextResponse.json(facility);
  }

  const facilities = store.getFacilities();
  return NextResponse.json(facilities);
}

