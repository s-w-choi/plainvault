import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { decrypt } from '@/lib/crypto/encryption';
import { createAuditLog } from '@/lib/audit/audit-log';
import { formatKST } from '@/lib/time/kst';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.status !== 'APPROVED') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Account not approved' } },
      { status: 403 }
    );
  }

  if (!['ADMIN', 'DEVELOPER'].includes(session.role || '')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

  const { id, revisionId } = await params;

  const revision = await prisma.fileRevision.findUnique({
    where: { id: revisionId, fileId: id },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!revision) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Revision not found' } },
      { status: 404 }
    );
  }

  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  const decryptedContent = decrypt(revision.encryptedContentAfter);

  await createAuditLog({
    eventType: 'file.revision_viewed',
    actorType: 'USER',
    actorId: session.userId,
    targetType: 'FileRevision',
    targetId: revision.id,
    ipAddress: ip,
    userAgent,
    metadata: { fileId: id, revisionNumber: revision.revisionNumber },
  });

  const response = NextResponse.json({
    revision: {
      id: revision.id,
      fileId: revision.fileId,
      revisionNumber: revision.revisionNumber,
      content: decryptedContent,
      contentSha256After: revision.contentSha256After,
      changeSummary: revision.changeSummary,
      changedAt: formatKST(revision.changedAt),
      changedBy: revision.changedBy,
    },
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
