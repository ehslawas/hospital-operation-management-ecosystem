import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  const store = getDataStore();

  if (id) {
    const incident = store.getAdrIncident(id);
    if (!incident) {
      return NextResponse.json({ error: 'ADR Incident not found' }, { status: 404 });
    }
    return NextResponse.json(incident);
  }

  const incidents = store.getAdrIncidents();
  return NextResponse.json(incidents);
}

export async function POST(request: NextRequest) {
  const store = getDataStore();
  const body = await request.json();
  
  const incident = store.createAdrIncident(body);
  return NextResponse.json(incident, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const store = getDataStore();
  const body = await request.json();
  
  const incident = store.updateAdrIncident(id, body);
  if (!incident) {
    return NextResponse.json({ error: 'ADR Incident not found' }, { status: 404 });
  }
  
  return NextResponse.json(incident);
}

