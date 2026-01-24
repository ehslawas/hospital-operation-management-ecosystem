import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/login';

  // Clear all authentication cookies
  const cookiesToClear = [
    'user=; Path=/; Max-Age=0; SameSite=Strict',
    'department=; Path=/; Max-Age=0; SameSite=Strict',
    'roles=; Path=/; Max-Age=0; SameSite=Strict',
    'isAuthenticated=; Path=/; Max-Age=0; SameSite=Strict',
  ];

  const response = NextResponse.redirect(new URL(redirect, request.url));
  
  // Set cookies to expire immediately
  cookiesToClear.forEach(cookie => {
    response.headers.append('Set-Cookie', cookie);
  });

  // Add cache control headers to prevent caching of logout
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
