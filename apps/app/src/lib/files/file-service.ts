import { prisma } from '@/lib/db';
import { encrypt, hashContent } from '@/lib/crypto/encryption';
import { createAuditLog } from '@/lib/audit/audit-log';
import { formatKST } from '@/lib/time/kst';
import type { AuthContext } from '@/lib/auth/auth-handler';

export interface FileSelect {
  id: string;
  title: string;
  actualFileName: string;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; color: string } | null;
  createdBy: { id: string; name: string; email: string };
  updatedBy: { id: string; name: string; email: string } | null;
}

function formatFile(f: FileSelect) {
  return {
    id: f.id,
    title: f.title,
    actualFileName: f.actualFileName,
    contentType: f.contentType,
    createdAt: formatKST(f.createdAt),
    updatedAt: formatKST(f.updatedAt),
    category: f.category,
    createdBy: f.createdBy,
    updatedBy: f.updatedBy,
  };
}

export async function listFiles(search = '', categoryId = '') {
  const where: Record<string, unknown> = { deletedAt: null };
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { actualFileName: { contains: search } },
    ];
  }

  const files = await prisma.vaultFile.findMany({
    where,
    select: {
      id: true,
      title: true,
      actualFileName: true,
      contentType: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true, color: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return { files: files.map(formatFile), total: files.length };
}

export async function getFile(id: string) {
  const file = await prisma.vaultFile.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, color: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return file;
}

export async function createFile(
  data: {
    title: string;
    actualFileName: string;
    content: string;
    contentType: string;
    categoryId?: string | null;
  },
  ctx: AuthContext,
  ip?: string,
  userAgent?: string,
) {
  const { title, actualFileName, content, contentType, categoryId } = data;
  const encryptedContent = encrypt(content);
  const sha256 = hashContent(content);

  const file = await prisma.vaultFile.create({
    data: {
      title,
      actualFileName,
      encryptedContent,
      contentSha256: sha256,
      keyVersion: 1,
      contentType,
      categoryId: categoryId || null,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.fileRevision.create({
    data: {
      fileId: file.id,
      revisionNumber: 1,
      encryptedContentAfter: encryptedContent,
      contentSha256After: sha256,
      keyVersion: 1,
      changeSummary: 'Initial creation',
      changedById: ctx.userId,
    },
  });

  await createAuditLog({
    eventType: 'file.created',
    actorType: 'USER',
    actorId: ctx.userId,
    targetType: 'VaultFile',
    targetId: file.id,
    ipAddress: ip,
    userAgent,
    metadata: { title, contentType },
  });

  return formatFile({
    ...file,
    category: null,
    createdBy: { id: ctx.userId, name: '', email: '' },
    updatedBy: null,
  });
}

export async function updateFile(
  id: string,
  data: {
    title?: string;
    actualFileName?: string;
    content?: string;
    contentType?: string;
    categoryId?: string | null;
    changeSummary: string;
  },
  ctx: AuthContext,
  ip?: string,
  userAgent?: string,
) {
  const existing = await prisma.vaultFile.findUnique({ where: { id, deletedAt: null } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = { updatedById: ctx.userId };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.actualFileName !== undefined) updateData.actualFileName = data.actualFileName;
  if (data.contentType !== undefined) updateData.contentType = data.contentType;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;

  let encryptedContentAfter = existing.encryptedContent;
  let sha256After = existing.contentSha256;
  let encryptedContentBefore: string | null = null;
  let sha256Before: string | null = null;

  if (data.content !== undefined) {
    encryptedContentBefore = existing.encryptedContent;
    sha256Before = existing.contentSha256;
    encryptedContentAfter = encrypt(data.content);
    sha256After = hashContent(data.content);
    updateData.encryptedContent = encryptedContentAfter;
    updateData.contentSha256 = sha256After;
  }

  const previousRevision = await prisma.fileRevision.findFirst({
    where: { fileId: id },
    orderBy: { revisionNumber: 'desc' },
  });

  const updated = await prisma.vaultFile.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, color: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.fileRevision.create({
    data: {
      fileId: id,
      revisionNumber: (previousRevision?.revisionNumber ?? 0) + 1,
      encryptedContentBefore,
      encryptedContentAfter,
      contentSha256Before: sha256Before,
      contentSha256After: sha256After,
      keyVersion: 1,
      changeSummary: data.changeSummary,
      changedById: ctx.userId,
    },
  });

  await createAuditLog({
    eventType: 'file.updated',
    actorType: 'USER',
    actorId: ctx.userId,
    targetType: 'VaultFile',
    targetId: id,
    ipAddress: ip,
    userAgent,
    metadata: { title: updated.title, changeSummary: data.changeSummary },
  });

  return formatFile(updated);
}

export async function deleteFile(
  id: string,
  ctx: AuthContext,
  ip?: string,
  userAgent?: string,
) {
  const file = await prisma.vaultFile.findUnique({ where: { id, deletedAt: null } });
  if (!file) return false;

  await prisma.vaultFile.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    eventType: 'file.deleted',
    actorType: 'USER',
    actorId: ctx.userId,
    targetType: 'VaultFile',
    targetId: id,
    ipAddress: ip,
    userAgent,
    metadata: { title: file.title },
  });

  return true;
}
