import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, accessType, deviceInfo, userAgent } = body;

    if (!patientId || !accessType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await prisma.patientPortalAccess.create({
      data: {
        patientId,
        accessType,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: userAgent || request.headers.get('user-agent') || undefined,
        deviceInfo,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging portal access:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

