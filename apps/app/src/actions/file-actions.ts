"use server";

import { requireSession, requireSessionWithRole, getActionClientInfo } from "@/lib/auth/action-auth";
import { createAuditLog } from "@/lib/audit/audit-log";
import { decrypt } from "@/lib/crypto/encryption";
import { computeLineDiff, type DiffResult } from "@/lib/diff/diff";
import { deleteFile, createFile, getFile, listFiles, updateFile } from "@/lib/files/file-service";
import { maskContent } from "@/lib/masking/masking";
import { prisma } from "@/lib/db";
import { getSettingBool } from "@/lib/settings/settings";
import { formatKST } from "@/lib/time/kst";
import {
  validateActualFileName,
  validateContentSize,
  validateContentType,
  validateTitle,
} from "@/lib/validation/validation";
import { listCategories } from "@/lib/categories/category-service";
import { logger } from "@/lib/logging/logger";

type ActionError = { error: { code: string; message: string } };

interface FileItem {
  id: string;
  title: string;
  actualFileName: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string } | null;
  createdBy: { id: string; name: string; email: string } | null;
  updatedBy: { id: string; name: string; email: string } | null;
}

interface FileDetail extends FileItem {
  content: string;
  contentSha256: string;
}

interface FileRevision {
  id: string;
  revisionNumber: number;
  changeSummary: string | null;
  contentSha256Before: string | null;
  contentSha256After: string;
  changedAt: string;
  changedBy: { id: string; name: string; email: string } | null;
}

export async function listFilesAction(
  search: string = "",
  categoryId: string = "",
): Promise<{ files: FileItem[]; categories: Array<{ id: string; name: string; color: string }> } | ActionError> {
  await requireSession();

  const { files } = await listFiles(search, categoryId);
  const categories = await listCategories();
  return { files, categories };
}

export async function getFileAction(
  id: string,
): Promise<{ file: FileDetail } | ActionError> {
  const ctx = await requireSession();
  const { ip, userAgent } = await getActionClientInfo();

  const file = await getFile(id);
  if (!file) {
    return { error: { code: "NOT_FOUND", message: "File not found" } };
  }

  const isAdminOrDeveloper = ["ADMIN", "DEVELOPER"].includes(ctx.role);
  const decrypted = decrypt(file.encryptedContent);

  if (isAdminOrDeveloper) {
    const logRawAccess = await getSettingBool("audit_log_raw_access");
    if (logRawAccess) {
      await createAuditLog({
        eventType: "file.raw_viewed",
        actorType: "USER",
        actorId: ctx.userId,
        targetType: "VaultFile",
        targetId: id,
        ipAddress: ip,
        userAgent,
        metadata: { title: file.title },
      });
    }

    return {
      file: {
        id: file.id,
        title: file.title,
        actualFileName: file.actualFileName,
        contentType: file.contentType,
        content: decrypted,
        contentSha256: file.contentSha256,
        createdAt: formatKST(file.createdAt),
        updatedAt: formatKST(file.updatedAt),
        category: file.category,
        createdBy: file.createdBy,
        updatedBy: file.updatedBy,
      },
    };
  }

  // VIEWER role: return masked content
  return {
    file: {
      id: file.id,
      title: file.title,
      actualFileName: file.actualFileName,
      contentType: file.contentType,
      content: maskContent(decrypted, file.contentType),
      contentSha256: file.contentSha256,
      createdAt: formatKST(file.createdAt),
      updatedAt: formatKST(file.updatedAt),
      category: file.category,
      createdBy: file.createdBy,
      updatedBy: file.updatedBy,
    },
  };
}

export async function createFileAction(data: {
  title: string;
  actualFileName: string;
  contentType: string;
  content: string;
  categoryId?: string;
}): Promise<{ file: FileItem } | ActionError> {
  const ctx = await requireSessionWithRole(["ADMIN", "DEVELOPER"]);

  const titleValidation = validateTitle(data.title);
  if (!titleValidation.valid) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: titleValidation.errors.join(", "),
      },
    };
  }

  const fileNameValidation = validateActualFileName(data.actualFileName);
  if (!fileNameValidation.valid) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: fileNameValidation.errors.join(", "),
      },
    };
  }

  const sizeValidation = validateContentSize(data.content);
  if (!sizeValidation.valid) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: sizeValidation.errors.join(", "),
      },
    };
  }

  const contentTypeValidation = validateContentType(data.contentType);
  if (!contentTypeValidation.valid) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: contentTypeValidation.errors.join(", "),
      },
    };
  }

  const { ip, userAgent } = await getActionClientInfo();

  const file = await createFile(
    {
      title: data.title,
      actualFileName: data.actualFileName,
      content: data.content,
      contentType: data.contentType,
      categoryId: data.categoryId,
    },
    ctx,
    ip,
    userAgent,
  );

  return { file };
}

export async function updateFileAction(
  id: string,
  data: {
    title?: string;
    actualFileName?: string;
    content?: string;
    contentType?: string;
    categoryId?: string;
    changeSummary: string;
  },
): Promise<{ file: FileItem } | ActionError> {
  const ctx = await requireSessionWithRole(["ADMIN", "DEVELOPER"]);

  if (data.title !== undefined) {
    const v = validateTitle(data.title);
    if (!v.valid) return { error: { code: "VALIDATION_ERROR", message: v.errors.join(", ") } };
  }
  if (data.actualFileName !== undefined) {
    const v = validateActualFileName(data.actualFileName);
    if (!v.valid) return { error: { code: "VALIDATION_ERROR", message: v.errors.join(", ") } };
  }
  if (data.content !== undefined) {
    const v = validateContentSize(data.content);
    if (!v.valid) return { error: { code: "VALIDATION_ERROR", message: v.errors.join(", ") } };
  }
  if (data.contentType !== undefined) {
    const v = validateContentType(data.contentType);
    if (!v.valid) return { error: { code: "VALIDATION_ERROR", message: v.errors.join(", ") } };
  }

  const requireSummary = await getSettingBool("require_change_summary");
  if (requireSummary && !data.changeSummary) {
    return { error: { code: "VALIDATION_ERROR", message: "changeSummary is required" } };
  }

  const { ip, userAgent } = await getActionClientInfo();

  const file = await updateFile(
    id,
    {
      title: data.title,
      actualFileName: data.actualFileName,
      content: data.content,
      contentType: data.contentType,
      categoryId: data.categoryId,
      changeSummary: data.changeSummary,
    },
    ctx,
    ip,
    userAgent,
  );

  if (!file) return { error: { code: "NOT_FOUND", message: "File not found" } };
  return { file };
}

export async function deleteFileAction(id: string): Promise<{ message: string } | ActionError> {
  const ctx = await requireSessionWithRole(["ADMIN"]);
  const { ip, userAgent } = await getActionClientInfo();

  const deleted = await deleteFile(id, ctx, ip, userAgent);
  if (!deleted) return { error: { code: "NOT_FOUND", message: "File not found" } };
  return { message: "File deleted" };
}

export async function getFileRevisionsAction(
  fileId: string,
): Promise<{ revisions: FileRevision[] } | ActionError> {
  await requireSessionWithRole(["ADMIN", "DEVELOPER"]);

  const file = await prisma.vaultFile.findUnique({
    where: { id: fileId, deletedAt: null },
    select: { id: true },
  });
  if (!file) return { error: { code: "NOT_FOUND", message: "File not found" } };

  const revisions = await prisma.fileRevision.findMany({
    where: { fileId },
    orderBy: { revisionNumber: "desc" },
    select: {
      id: true,
      revisionNumber: true,
      changeSummary: true,
      contentSha256Before: true,
      contentSha256After: true,
      changedAt: true,
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    revisions: revisions.map((r) => ({
      ...r,
      changedAt: formatKST(r.changedAt),
    })),
  };
}

export async function getFileRevisionDiffAction(
  fileId: string,
  revisionId: string,
): Promise<
  | {
      diff: DiffResult;
      previousRevisionNumber: number | null;
      currentRevisionNumber: number;
    }
  | ActionError
> {
  await requireSessionWithRole(["ADMIN", "DEVELOPER"]);

  const revision = await prisma.fileRevision.findUnique({
    where: { id: revisionId, fileId },
  });
  if (!revision) return { error: { code: "NOT_FOUND", message: "Revision not found" } };

  const previousRevision = await prisma.fileRevision.findFirst({
    where: {
      fileId,
      revisionNumber: { lt: revision.revisionNumber },
    },
    orderBy: { revisionNumber: "desc" },
  });

  if (!previousRevision) {
    const currentContent = decrypt(revision.encryptedContentAfter);
    const diffResult = computeLineDiff("", currentContent);
    return {
      diff: diffResult,
      previousRevisionNumber: null,
      currentRevisionNumber: revision.revisionNumber,
    };
  }

  const previousContent = decrypt(previousRevision.encryptedContentAfter);
  const currentContent = decrypt(revision.encryptedContentAfter);
  const diffResult = computeLineDiff(previousContent, currentContent);
  return {
    diff: diffResult,
    previousRevisionNumber: previousRevision.revisionNumber,
    currentRevisionNumber: revision.revisionNumber,
  };
}

export async function restoreFileRevisionAction(
  fileId: string,
  revisionId: string,
): Promise<{ file: FileItem } | ActionError> {
  const ctx = await requireSessionWithRole(["ADMIN", "DEVELOPER"]);

  try {
    const revision = await prisma.fileRevision.findUnique({
      where: { id: revisionId, fileId },
      select: {
        id: true,
        fileId: true,
        revisionNumber: true,
        encryptedContentAfter: true,
      },
    });

    if (!revision) {
      return { error: { code: "NOT_FOUND", message: "Revision not found" } };
    }

    const file = await prisma.vaultFile.findUnique({
      where: { id: fileId, deletedAt: null },
      select: { id: true },
    });

    if (!file) {
      return { error: { code: "NOT_FOUND", message: "File not found" } };
    }

    const restoredContent = decrypt(revision.encryptedContentAfter);
    const changeSummary = `Restored to revision #${revision.revisionNumber}`;
    const { ip, userAgent } = await getActionClientInfo();

    const updated = await updateFile(
      fileId,
      { content: restoredContent, changeSummary },
      ctx,
      ip,
      userAgent,
    );

    if (!updated) {
      return { error: { code: "NOT_FOUND", message: "File not found" } };
    }

    await createAuditLog({
      eventType: "file.restored",
      actorType: "USER",
      actorId: ctx.userId,
      targetType: "VaultFile",
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      metadata: {
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        changeSummary,
      },
    });

    return { file: updated };
  } catch (error) {
    logger.error("Restore file revision error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: { code: "INTERNAL_ERROR", message: "An error occurred" } };
  }
}
