import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { decrypt } from '@/lib/crypto/encryption';
import { computeLineDiff } from '@/lib/diff/diff';
import { createAuditLog } from '@/lib/audit/audit-log';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER']);
  if ('response' in auth) return auth.response;

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
      actorId: auth.ctx.userId,
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
    actorId: auth.ctx.userId,
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
