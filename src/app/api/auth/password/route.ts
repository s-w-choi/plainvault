import argon2 from "argon2";
import { NextRequest, NextResponse } from "next/server";
import { destroyAllUserSessions, setSessionCookie } from "@/lib/auth/auth";
import { withAuth } from "@/lib/auth/auth-handler";
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logging/logger';

export async function PATCH(request: NextRequest) {
  const auth = await withAuth(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: { message: "Current password and new password are required" } },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: { message: "New password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: auth.ctx.userId } });
    if (!user) {
      return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
    }

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      return NextResponse.json(
        { error: { message: "Current password is incorrect" } },
        { status: 400 }
      );
    }

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await destroyAllUserSessions(user.id);
    await setSessionCookie(user.id);

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    logger.error("Password change error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
