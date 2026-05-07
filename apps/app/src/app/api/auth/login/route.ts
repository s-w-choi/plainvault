import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/audit-log';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await createAuditLog({
        eventType: 'auth.login.failed',
        actorType: 'USER',
        ipAddress: ip,
        userAgent,
        metadata: { email },
        success: false,
        failureReason: 'USER_NOT_FOUND',
      });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
        { status: 401 }
      );
    }

    if (user.status !== 'APPROVED') {
      await createAuditLog({
        eventType: 'auth.login.failed',
        actorType: 'USER',
        actorId: user.id,
        ipAddress: ip,
        userAgent,
        metadata: { email },
        success: false,
        failureReason: 'ACCOUNT_NOT_APPROVED',
      });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Account not approved' } },
        { status: 401 }
      );
    }

    const valid = await argon2.verify(user.passwordHash, password);

    if (!valid) {
      await createAuditLog({
        eventType: 'auth.login.failed',
        actorType: 'USER',
        actorId: user.id,
        ipAddress: ip,
        userAgent,
        metadata: { email },
        success: false,
        failureReason: 'INVALID_PASSWORD',
      });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await createAuditLog({
      eventType: 'auth.login.success',
      actorType: 'USER',
      actorId: user.id,
      ipAddress: ip,
      userAgent,
      metadata: { email },
    });

    const response = NextResponse.json({ message: 'Login successful' });
    response.cookies.set('session_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('session_role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('session_status', user.status, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
