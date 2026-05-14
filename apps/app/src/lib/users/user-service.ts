import { createAuditLog } from '@/lib/audit/audit-log';
import { ROLES, type Role } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

const MUTATION_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

async function getPendingUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'PENDING') {
    throw new Error('User is not pending');
  }

  return user;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
}

export async function listUsers(status?: string) {
  return prisma.user.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    select: USER_SELECT,
  });
}

export async function approveUser(
  id: string,
  role: string,
  approvedById: string,
  ip?: string,
  userAgent?: string,
) {
  if (!isValidRole(role)) {
    throw new Error('Invalid role. Must be one of ADMIN, DEVELOPER, VIEWER');
  }

  const user = await getPendingUser(id);

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'APPROVED', role },
    select: MUTATION_USER_SELECT,
  });

  await createAuditLog({
    eventType: 'admin.user.approved',
    actorType: 'USER',
    actorId: approvedById,
    targetType: 'user',
    targetId: id,
    ipAddress: ip,
    userAgent,
    metadata: { email: user.email, role },
  });

  return updated;
}

export async function rejectUser(
  id: string,
  reason: string | null,
  rejectedById: string,
  ip?: string,
  userAgent?: string,
) {
  const user = await getPendingUser(id);

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED' },
    select: MUTATION_USER_SELECT,
  });

  await createAuditLog({
    eventType: 'admin.user.rejected',
    actorType: 'USER',
    actorId: rejectedById,
    targetType: 'user',
    targetId: id,
    ipAddress: ip,
    userAgent,
    metadata: {
      email: user.email,
      ...(reason ? { reason } : {}),
    },
  });

  return updated;
}

export async function updateUserRole(
  id: string,
  role: string,
  actorId: string,
  ip?: string,
  userAgent?: string,
) {
  if (!isValidRole(role)) {
    throw new Error('Invalid role. Must be one of ADMIN, DEVELOPER, VIEWER');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: MUTATION_USER_SELECT,
  });

  if (role !== user.role) {
    await createAuditLog({
      eventType: 'admin.user.role_changed',
      actorType: 'USER',
      actorId,
      targetType: 'user',
      targetId: id,
      ipAddress: ip,
      userAgent,
      metadata: { from: user.role, to: role },
    });
  }

  return updated;
}

export async function disableUser(
  id: string,
  actorId: string,
  ip?: string,
  userAgent?: string,
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED' },
    select: MUTATION_USER_SELECT,
  });

  if (user.status !== 'REJECTED') {
    await createAuditLog({
      eventType: 'admin.user.disabled',
      actorType: 'USER',
      actorId,
      targetType: 'user',
      targetId: id,
      ipAddress: ip,
      userAgent,
      metadata: { from: user.status, to: 'REJECTED' },
    });
  }

  return updated;
}
