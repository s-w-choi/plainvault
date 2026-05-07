import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import argon2 from 'argon2';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export async function getSession(): Promise<{ userId?: string; role?: string; status?: string } | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session_user_id')?.value;
  const role = cookieStore.get('session_role')?.value;
  const status = cookieStore.get('session_status')?.value;

  if (!userId) return null;
  return { userId, role, status };
}

export async function setSessionCookie(userId: string, role: string, status: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set('session_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set('session_status', status, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session_user_id');
  cookieStore.delete('session_role');
  cookieStore.delete('session_status');
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.status !== 'APPROVED') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Account not approved' } },
      { status: 403 }
    );
  }

  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<{ userId: string; role: string; status: string } | NextResponse> {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.status !== 'APPROVED') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Account not approved' } },
      { status: 403 }
    );
  }

  if (!allowedRoles.includes(session.role || '')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }
  return session as { userId: string; role: string; status: string };
}
