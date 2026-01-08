import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const medicationCode = searchParams.get('medicationCode');

  const store = getDataStore();

  if (id) {
    const register = store.getDdRegister(id);
    if (!register) {
      return NextResponse.json({ error: 'DD Register not found' }, { status: 404 });
    }
    return NextResponse.json(register);
  }

  if (medicationCode) {
    const registers = store.getDdRegistersByMedication(medicationCode);
    return NextResponse.json(registers);
  }

  const registers = store.getDdRegisters();
  return NextResponse.json(registers);
}

export async function POST(request: NextRequest) {
  const store = getDataStore();
  const body = await request.json();
  
  const register = store.createDdRegister(body);
  return NextResponse.json(register, { status: 201 });
}

