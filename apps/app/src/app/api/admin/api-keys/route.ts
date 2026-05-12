import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';
import { createApiKey } from '@/lib/api-keys/api-key';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const apiKeys = await prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        scopesJson: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdById: true,
        revokedById: true,
      },
    });

    return NextResponse.json({
      apiKeys: apiKeys.map(({ id, name, keyPrefix, status, scopesJson, createdAt, expiresAt, lastUsedAt, revokedAt }) => ({
        id,
        name,
        keyPrefix,
        status,
        scopes: JSON.parse(scopesJson),
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastUsedAt: lastUsedAt ? lastUsedAt.toISOString() : null,
        revokedAt: revokedAt ? revokedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    logger.error('List api keys error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  try {
    const { name, expiresInDays } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
        { status: 400 }
      );
    }

    const result = await createApiKey({
      name,
      createdById: auth.ctx.userId,
      expiresInDays: expiresInDays != null ? parseInt(expiresInDays, 10) : undefined,
    });

    return NextResponse.json({
      apiKey: {
        id: result.id,
        name: result.name,
        keyPrefix: result.keyPrefix,
        key: result.key,
        expiresAt: result.expiresAt.toISOString(),
        scopes: result.scopes,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('Create api key error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
