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

    const allowedRoles = ['ADMIN', 'DEVELOPER', 'VIEWER'] as const;
    type AllowedRole = (typeof allowedRoles)[number];

    const body = (await request.json().catch(() => ({}))) as unknown;
    const role = (body as { role?: unknown })?.role;

    let roleToSet: AllowedRole = 'VIEWER';
    if (role !== undefined) {
      if (typeof role !== 'string' || !allowedRoles.includes(role as AllowedRole)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid role. Must be one of ADMIN, DEVELOPER, VIEWER',
            },
          },
          { status: 400 }
        );
      }
      roleToSet = role as AllowedRole;
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
      data: { status: 'APPROVED', role: roleToSet },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await createAuditLog({
      eventType: 'admin.user.approved',
      actorType: 'USER',
      actorId: auth.ctx.userId,
      targetType: 'user',
      targetId: id,
      metadata: { email: user.email, role: roleToSet },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error('Approve user error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
