import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { normalizeApiKeyScopes, revokeApiKey, updateApiKeyScopes } from '@/lib/api-keys/api-key';
import { createAuditLog } from '@/lib/audit/audit-log';
import { logger } from '@/lib/logging/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request);
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
    if (auth.ctx.role !== 'ADMIN' && apiKey.createdById !== auth.ctx.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const scopes = normalizeApiKeyScopes(auth.ctx.role, body.scopes as string[]);

    if (scopes.length === 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'At least one scope is required' } },
        { status: 400 }
      );
    }

    await updateApiKeyScopes(id, scopes);

    await createAuditLog({
      eventType: 'api_key.updated',
      actorType: 'USER',
      actorId: auth.ctx.userId,
      targetType: 'api_key',
      targetId: id,
      metadata: { scopes },
    });

    return NextResponse.json({ scopes });
  } catch (error) {
    logger.error('Update api key error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request);
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
    if (auth.ctx.role !== 'ADMIN' && apiKey.createdById !== auth.ctx.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
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
