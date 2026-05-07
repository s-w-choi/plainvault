import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { formatKST } from '@/lib/time/kst';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER']);
  if ('response' in auth) return auth.response;

  const { id } = await params;

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

  const revisions = await prisma.fileRevision.findMany({
    where: { fileId: id },
    orderBy: { revisionNumber: 'desc' },
    select: {
      id: true,
      revisionNumber: true,
      changeSummary: true,
      contentSha256Before: true,
      contentSha256After: true,
      changedAt: true,
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    revisions: revisions.map((r) => ({
      ...r,
      changedAt: formatKST(r.changedAt),
    })),
  });
}
