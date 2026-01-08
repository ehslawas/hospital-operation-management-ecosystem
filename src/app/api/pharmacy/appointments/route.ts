import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const patientId = searchParams.get('patientId');
  const date = searchParams.get('date');

  const store = getDataStore();

  if (id) {
    const appointment = store.getAppointment(id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(appointment);
  }

  if (patientId) {
    const appointments = store.getAppointmentsByPatient(patientId);
    return NextResponse.json(appointments);
  }

  if (date) {
    const appointments = store.getAppointmentsByDate(date);
    return NextResponse.json(appointments);
  }

  const appointments = store.getAppointments();
  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const store = getDataStore();
  const body = await request.json();
  
  const appointment = store.createAppointment(body);
  return NextResponse.json(appointment, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const store = getDataStore();
  const body = await request.json();
  
  const appointment = store.updateAppointment(id, body);
  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }
  
  return NextResponse.json(appointment);
}

