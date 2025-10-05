import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const redirect = searchParams.get('redirect');
  const user = searchParams.get('user');
  const department = searchParams.get('department');

  if (!role) {
    return new NextResponse('Missing role', { status: 400 });
  }

  const allowed = ['pharmacy_logistics', 'admin'];
  if (!allowed.includes(role)) {
    return new NextResponse('Invalid role', { status: 400 });
  }

  // Append to roles cookie (comma separated)
  const cookieHeader = request.headers.get('cookie') || '';
  const current = cookieHeader.match(/(?:^|; )roles=([^;]+)/)?.[1] || '';
  const roles = new Set(current.split(',').filter(Boolean));
  roles.add(role);
  const newValue = Array.from(roles).join(',');

  const cookiesToSet: string[] = [];
  cookiesToSet.push(`roles=${newValue}; Path=/; HttpOnly; SameSite=Lax`);
  if (user) cookiesToSet.push(`user=${encodeURIComponent(user)}; Path=/; HttpOnly; SameSite=Lax`);
  if (department) cookiesToSet.push(`department=${encodeURIComponent(department)}; Path=/; HttpOnly; SameSite=Lax`);

  if (redirect) {
    const res = NextResponse.redirect(new URL(redirect, request.url));
    for (const c of cookiesToSet) res.headers.append('Set-Cookie', c);
    return res;
  }

  const res = new NextResponse('OK', { status: 200 });
  for (const c of cookiesToSet) res.headers.append('Set-Cookie', c);
  return res;
}


