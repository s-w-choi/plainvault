import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { createAuditLog } from '@/lib/audit/audit-log';
import { formatKST } from '@/lib/time/kst';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    await createAuditLog({
      eventType: 'admin.audit_log_viewed',
      actorType: 'USER',
      actorId: session.userId,
      metadata: { action: 'users.list', filter: status || 'all' },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: formatKST(u.createdAt),
        lastLoginAt: u.lastLoginAt ? formatKST(u.lastLoginAt) : null,
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
