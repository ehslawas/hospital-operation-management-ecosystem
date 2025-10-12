import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLandingPathForDepartment } from './lib/department';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/dev/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Check if user is authenticated via cookies
  const userCookie = request.cookies.get('user')?.value;
  const departmentCookie = request.cookies.get('department')?.value;
  
  const isAuthenticated = !!(userCookie && departmentCookie);
  
  // Only handle emergency department authentication in middleware
  if (pathname.startsWith('/emergency')) {
    // If authenticated emergency user trying to access login, redirect to emergency dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
      return NextResponse.redirect(new URL('/emergency', request.url));
    }
    
    // Block unauthenticated access to emergency routes
    if (!isAuthenticated && pathname.startsWith('/emergency')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // For protected routes, let client-side AuthWrapper handle authentication
  // This prevents middleware from interfering with localStorage-based auth
  if (!isPublicRoute) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
