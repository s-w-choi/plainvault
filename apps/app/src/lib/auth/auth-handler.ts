import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth';

export interface AuthContext {
  userId: string;
  role: string;
  status: string;
}

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function withAuth(
  request: NextRequest,
  allowedRoles?: string[],
): Promise<{ ctx: AuthContext; response?: never } | { ctx?: never; response: NextResponse }> {
  const session = await getSession();
  if (!session?.userId) {
    return { response: errorResponse('UNAUTHORIZED', 'Not authenticated', 401) };
  }
  if (session.status !== 'APPROVED') {
    return { response: errorResponse('FORBIDDEN', 'Account not approved', 403) };
  }
  if (allowedRoles?.length && !allowedRoles.includes(session.role || '')) {
    return { response: errorResponse('FORBIDDEN', 'Insufficient permissions', 403) };
  }
  return {
    ctx: {
      userId: session.userId,
      role: session.role || '',
      status: session.status,
    },
  };
}

export function getClientInfo(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}
