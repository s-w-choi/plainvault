import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { createAuditLog } from '@/lib/audit/audit-log';
import { logger } from '@/lib/logging/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const reason = (body as { reason?: unknown })?.reason;

    if (reason !== undefined && typeof reason !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reason. Must be a string',
          },
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await createAuditLog({
      eventType: 'admin.user.rejected',
      actorType: 'USER',
      actorId: auth.ctx.userId,
      targetType: 'user',
      targetId: id,
      metadata: {
        email: user.email,
        ...(reason ? { reason } : {}),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error('Reject user error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
