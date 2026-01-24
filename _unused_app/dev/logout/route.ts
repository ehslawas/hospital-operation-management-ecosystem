import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';

  const expire = 'Max-Age=0; Path=/; HttpOnly; SameSite=Lax';

  const res = NextResponse.redirect(new URL(redirect, request.url));
  res.headers.append('Set-Cookie', `roles=; ${expire}`);
  res.headers.append('Set-Cookie', `user=; ${expire}`);
  res.headers.append('Set-Cookie', `department=; ${expire}`);
  return res;
}



