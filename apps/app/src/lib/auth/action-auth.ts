import { headers } from 'next/headers';
import { getSession, type SessionData } from './auth';

export interface ActionAuthContext {
  userId: SessionData['userId'];
  role: SessionData['role'];
  status: SessionData['status'];
}

export interface ActionClientInfo {
  ip?: string;
  userAgent?: string;
}

// Server Action equivalent of withAuth — no NextRequest needed.
export async function requireSession(): Promise<ActionAuthContext> {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error('UNAUTHORIZED');
  }
  if (session.status !== 'APPROVED') {
    throw new Error('FORBIDDEN: Account not approved');
  }
  return {
    userId: session.userId,
    role: session.role || '',
    status: session.status,
  };
}

// Server Action equivalent of withAuth + role check.
export async function requireSessionWithRole(allowedRoles: string[]): Promise<ActionAuthContext> {
  const ctx = await requireSession();
  if (!allowedRoles.includes(ctx.role)) {
    throw new Error('FORBIDDEN: Insufficient permissions');
  }
  return ctx;
}

// Server Action equivalent of getClientInfo — uses headers() instead of NextRequest.
export async function getActionClientInfo(): Promise<ActionClientInfo> {
  const hdrs = await headers();
  return {
    ip: hdrs.get('x-forwarded-for') || undefined,
    userAgent: hdrs.get('user-agent') || undefined,
  };
}

// Non-throwing version for Server Components that need user data.
export async function getOptionalSession(): Promise<ActionAuthContext | null> {
  const session = await getSession();
  if (!session?.userId || session.status !== 'APPROVED') {
    return null;
  }
  return {
    userId: session.userId,
    role: session.role || '',
    status: session.status,
  };
}
