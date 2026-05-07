import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { decrypt } from '@/lib/crypto/encryption';
import { computeLineDiff } from '@/lib/diff/diff';
import { createAuditLog } from '@/lib/audit/audit-log';

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
  });

  if (!revision) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Revision not found' } },
      { status: 404 }
    );
  }

  // Find the previous revision for diff comparison
  const previousRevision = await prisma.fileRevision.findFirst({
    where: {
      fileId: id,
      revisionNumber: { lt: revision.revisionNumber },
    },
    orderBy: { revisionNumber: 'desc' },
  });

  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  if (!previousRevision) {
    // No previous revision — compare against initial empty state
    const currentContent = decrypt(revision.encryptedContentAfter);
    const diffResult = computeLineDiff('', currentContent);

    await createAuditLog({
      eventType: 'file.diff_viewed',
      actorType: 'USER',
      actorId: session.userId,
      targetType: 'FileRevision',
      targetId: revision.id,
      ipAddress: ip,
      userAgent,
      metadata: { fileId: id, revisionNumber: revision.revisionNumber, hasPrevious: false },
    });

    const response = NextResponse.json({
      diff: diffResult,
      previousRevisionNumber: null,
      currentRevisionNumber: revision.revisionNumber,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const previousContent = decrypt(previousRevision.encryptedContentAfter);
  const currentContent = decrypt(revision.encryptedContentAfter);
  const diffResult = computeLineDiff(previousContent, currentContent);

  await createAuditLog({
    eventType: 'file.diff_viewed',
    actorType: 'USER',
    actorId: session.userId,
    targetType: 'FileRevision',
    targetId: revision.id,
    ipAddress: ip,
    userAgent,
    metadata: { fileId: id, revisionNumber: revision.revisionNumber, hasPrevious: true },
  });

  const response = NextResponse.json({
    diff: diffResult,
    previousRevisionNumber: previousRevision.revisionNumber,
    currentRevisionNumber: revision.revisionNumber,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
