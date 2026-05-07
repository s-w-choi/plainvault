import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { revokeApiKey } from '@/lib/api-keys/api-key';
import { logger } from '@/lib/logging/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      );
    }

    await revokeApiKey(id, auth.ctx.userId);

    return NextResponse.json({ message: 'API key revoked' });
  } catch (error) {
    logger.error('Revoke api key error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
