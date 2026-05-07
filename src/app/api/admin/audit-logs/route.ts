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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          actorType: true,
          actorId: true,
          targetType: true,
          targetId: true,
          success: true,
          failureReason: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count(),
    ]);

    await createAuditLog({
      eventType: 'admin.audit_log_viewed',
      actorType: 'USER',
      actorId: session.userId,
      metadata: { page, limit },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        createdAt: formatKST(log.createdAt),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
