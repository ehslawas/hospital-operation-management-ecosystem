import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const drugsParam = searchParams.get('drugs'); // comma-separated drug codes

  const store = getDataStore();

  if (drugsParam) {
    const drugCodes = drugsParam.split(',');
    const interactions = store.checkInteractions(drugCodes);
    return NextResponse.json(interactions);
  }

  const interactions = store.getInteractions();
  return NextResponse.json(interactions);
}

