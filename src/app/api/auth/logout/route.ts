import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/auth';

export async function POST() {
  await clearSessionCookie();

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('session_user_id', '', { maxAge: 0 });
  response.cookies.set('session_role', '', { maxAge: 0 });
  response.cookies.set('session_status', '', { maxAge: 0 });

  return response;
}