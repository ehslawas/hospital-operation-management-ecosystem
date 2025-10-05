import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard pharmacy logistics paths
  if (pathname.startsWith('/pharmacy/logistics')) {
    const rolesCookie = request.cookies.get('roles')?.value || '';
    const roles = rolesCookie.split(',').map((r) => r.trim()).filter(Boolean);
    const hasAccess = roles.includes('pharmacy_logistics') || roles.includes('admin');

    if (!hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = '/forbidden';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pharmacy/logistics/:path*'],
};


