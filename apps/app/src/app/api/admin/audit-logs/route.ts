import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { formatKST } from '@/lib/time/kst';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

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
    logger.error('List audit logs error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
