import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { isValidRole, isValidUserStatus } from '@/lib/auth/roles';
import { createAuditLog } from '@/lib/audit/audit-log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const { role, status } = body;

    if (role !== undefined && !isValidRole(role)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid role. Must be one of: ADMIN, DEVELOPER, VIEWER' } },
        { status: 400 }
      );
    }

    if (status !== undefined && !isValidUserStatus(status)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid status. Must be one of: PENDING, APPROVED, REJECTED' } },
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

    const data: { role?: string; status?: string } = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (role !== undefined && role !== user.role) {
      await createAuditLog({
        eventType: 'admin.user.role_changed',
        actorType: 'USER',
        actorId: session.userId,
        targetType: 'user',
        targetId: id,
        metadata: { from: user.role, to: role },
      });
    }

    if (status !== undefined && status !== user.status) {
      await createAuditLog({
        eventType: 'admin.user.disabled',
        actorType: 'USER',
        actorId: session.userId,
        targetType: 'user',
        targetId: id,
        metadata: { from: user.status, to: status },
      });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
