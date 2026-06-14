import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const redirect = searchParams.get('redirect');
  const user = searchParams.get('user');
  const department = searchParams.get('department');

  // Redirect to modern login page
  const loginUrl = new URL('/login', request.url);
  if (role) loginUrl.searchParams.set('role', role);
  if (redirect) loginUrl.searchParams.set('redirect', redirect);
  if (user) loginUrl.searchParams.set('user', user);
  if (department) loginUrl.searchParams.set('department', department);

  return NextResponse.redirect(loginUrl);
}


