import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { formatKST } from '@/lib/time/kst';

export async function GET(
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
