import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/crypto/encryption';
import { createAuditLog } from '@/lib/audit/audit-log';
import { getSession } from '@/lib/auth/auth';
import { formatKST } from '@/lib/time/kst';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId || session.status !== 'APPROVED') {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (!['ADMIN', 'DEVELOPER'].includes(session.role || '')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

  const { id } = await params;

  const file = await prisma.vaultFile.findUnique({
    where: { id, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!file) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'File not found' } },
      { status: 404 }
    );
  }

  const rawContent = decrypt(file.encryptedContent);
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  await createAuditLog({
    eventType: 'file.raw_viewed',
    actorType: 'USER',
    actorId: session.userId,
    targetType: 'VaultFile',
    targetId: file.id,
    ipAddress: ip,
    userAgent,
    metadata: { title: file.title },
  });

  const response = NextResponse.json({
    id: file.id,
    title: file.title,
    actualFileName: file.actualFileName,
    content: rawContent,
    updatedAt: file.updatedAt.toISOString(),
    updatedAtKst: formatKST(file.updatedAt),
    updatedBy: file.updatedBy?.email ?? file.createdBy.email,
  });

  response.headers.set('Cache-Control', 'no-store');
  return response;
}