import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { createAuditLog } from '@/lib/audit/audit-log';
import { formatKST } from '@/lib/time/kst';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

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
      actorId: auth.ctx.userId,
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
    logger.error('List users error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
