import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if ('response' in auth) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.ctx.userId },
    select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}
