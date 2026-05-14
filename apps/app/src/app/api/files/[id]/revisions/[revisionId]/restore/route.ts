import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-handler';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto/encryption';
import { updateFile } from '@/lib/files/file-service';
import { createAuditLog } from '@/lib/audit/audit-log';
import { logger } from '@/lib/logging/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER']);
  if ('response' in auth) return auth.response;

  try {
    const { id, revisionId } = await params;

    const revision = await prisma.fileRevision.findUnique({
      where: { id: revisionId, fileId: id },
      select: {
        id: true,
        fileId: true,
        revisionNumber: true,
        encryptedContentAfter: true,
      },
    });

    if (!revision) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Revision not found' } },
        { status: 404 }
      );
    }

    const file = await prisma.vaultFile.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      );
    }

    const restoredContent = decrypt(revision.encryptedContentAfter);
    const changeSummary = `Restored to revision #${revision.revisionNumber}`;

    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const updated = await updateFile(
      id,
      { content: restoredContent, changeSummary },
      auth.ctx,
      ip,
      userAgent
    );

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      );
    }

    await createAuditLog({
      eventType: 'file.restored',
      actorType: 'USER',
      actorId: auth.ctx.userId,
      targetType: 'VaultFile',
      targetId: id,
      ipAddress: ip,
      userAgent,
      metadata: {
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        changeSummary,
      },
    });

    return NextResponse.json({ file: updated });
  } catch (error) {
    logger.error('Restore file revision error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
