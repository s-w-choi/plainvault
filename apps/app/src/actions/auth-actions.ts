"use server";

import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit/audit-log";
import { getActionClientInfo, requireSession } from "@/lib/auth/action-auth";
import {
  clearSessionCookie,
  destroyAllUserSessions,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIpKey } from "@/lib/security/rate-limit";
import { getSettingBool } from "@/lib/settings/settings";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { ip, userAgent } = await getActionClientInfo();
  const clientIp = getClientIpKey(ip ?? null);

  const rateLimitResult = checkRateLimit(clientIp ? `login:${clientIp}` : null);
  if (!rateLimitResult.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await createAuditLog({
      eventType: "auth.login.failed",
      actorType: "USER",
      ipAddress: ip,
      userAgent,
      metadata: { email },
      success: false,
      failureReason: "USER_NOT_FOUND",
    });
    return { error: "Invalid credentials" };
  }

  if (user.status !== "APPROVED") {
    await createAuditLog({
      eventType: "auth.login.failed",
      actorType: "USER",
      actorId: user.id,
      ipAddress: ip,
      userAgent,
      metadata: { email },
      success: false,
      failureReason: "ACCOUNT_NOT_APPROVED",
    });
    return { error: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await createAuditLog({
      eventType: "auth.login.failed",
      actorType: "USER",
      actorId: user.id,
      ipAddress: ip,
      userAgent,
      metadata: { email },
      success: false,
      failureReason: "INVALID_PASSWORD",
    });
    return { error: "Invalid credentials" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    eventType: "auth.login.success",
    actorType: "USER",
    actorId: user.id,
    ipAddress: ip,
    userAgent,
    metadata: { email },
  });

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function registerAction(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  const allowRegistration = await getSettingBool("allow_registration");
  if (!allowRegistration) {
    return { error: "Registration is currently disabled" };
  }

  const { ip, userAgent } = await getActionClientInfo();
  const clientIp = getClientIpKey(ip ?? null);

  const rateLimitResult = checkRateLimit(clientIp ? `register:${clientIp}` : null, { windowMs: 3600_000, maxAttempts: 5 });
  if (!rateLimitResult.allowed) {
    return { error: "Too many registration attempts. Please try again later." };
  }

  if (!name || !email || !password) {
    return { error: "Name, email and password are required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "VIEWER",
      status: "PENDING",
    },
    select: { id: true },
  });

  await createAuditLog({
    eventType: "auth.register.requested",
    actorType: "USER",
    actorId: created.id,
    ipAddress: ip,
    userAgent,
    metadata: { email },
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const { ip, userAgent } = await getActionClientInfo();
  const ctx = await requireSession();

  await createAuditLog({
    eventType: "auth.logout",
    actorType: "USER",
    actorId: ctx.userId,
    ipAddress: ip,
    userAgent,
  });

  await clearSessionCookie();
  redirect("/login");
}

export async function changePasswordAction(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const currentPassword = formData.get("currentPassword") as string | null;
  const newPassword = formData.get("newPassword") as string | null;

  if (!currentPassword || !newPassword) {
    return { error: "Current password and new password are required" };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  const { ip, userAgent } = await getActionClientInfo();
  const clientIp = getClientIpKey(ip ?? null);

  const rateLimitResult = checkRateLimit(clientIp ? `change-password:${clientIp}` : null);
  if (!rateLimitResult.allowed) {
    return { error: "Too many password change attempts. Please try again later." };
  }

  const ctx = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
  if (!user) {
    return { error: "User not found" };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  await destroyAllUserSessions(user.id);
  await setSessionCookie(user.id);

  await createAuditLog({
    eventType: "auth.password.changed",
    actorType: "USER",
    actorId: ctx.userId,
    ipAddress: ip,
    userAgent,
  });

  return { success: true };
}
