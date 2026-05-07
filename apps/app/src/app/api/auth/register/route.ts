import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/audit-log';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
