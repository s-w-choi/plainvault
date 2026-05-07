import { createAuditLog } from '@/lib/audit/audit-log';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIpKey } from '@/lib/security/rate-limit';
import argon2 from 'argon2';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIpKey(request.headers.get('x-forwarded-for'));
    const rateLimitResult = checkRateLimit(`register:${clientIp}`, { windowMs: 3600_000, maxAttempts: 5 });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name, email and password are required' } },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Email already registered' } },
        { status: 409 }
      );
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'VIEWER',
        status: 'PENDING',
      },
    });

    await createAuditLog({
      eventType: 'auth.register.requested',
      actorType: 'USER',
      metadata: { email },
    });

    return NextResponse.json({
      message: 'Registration request submitted. Please wait for admin approval.',
    });
  } catch (error) {
    logger.error('Register error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
