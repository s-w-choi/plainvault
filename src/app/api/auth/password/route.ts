import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { PrismaClient } from '@prisma/client';
import argon2 from "argon2";

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  if (session.status !== 'APPROVED') {
    return NextResponse.json({ error: { message: "Account not approved" } }, { status: 403 });
  }

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

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
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

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}