import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs: number; message?: string }> = {};
  let overall = 'ok' as 'ok' | 'error';

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    checks.database = { status: 'error', latencyMs: Date.now() - dbStart, message };
    overall = 'error';
  }

  const body = {
    status: overall,
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(body, { status: overall === 'ok' ? 200 : 503 });
}
