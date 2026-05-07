import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';
import { createApiKey } from '@/lib/api-keys/api-key';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

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
      apiKeys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        status: k.status,
        scopes: JSON.parse(k.scopesJson),
        createdAt: k.createdAt.toISOString(),
        expiresAt: k.expiresAt.toISOString(),
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
        revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('List api keys error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

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
      createdById: session.userId,
      expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : undefined,
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
    console.error('Create api key error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
