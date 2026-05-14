"use server";

import { prisma } from "@/lib/db";
import { requireSessionWithRole, getActionClientInfo } from "@/lib/auth/action-auth";
import { listUsers, approveUser, rejectUser, updateUserRole } from "@/lib/users/user-service";
import { listCategories, createCategory, deleteCategory } from "@/lib/categories/category-service";
import { createApiKey, revokeApiKey, listApiKeys, updateApiKeyScopes } from "@/lib/api-keys/api-key";
import { getAllSettings, updateSettings, SETTING_DEFINITIONS } from "@/lib/settings/settings";
import { formatKST } from "@/lib/time/kst";

type ActionError = { error: string };

const ADMIN_ROLES = ["ADMIN"] as const;
type AllowedRole = "ADMIN" | "DEVELOPER" | "VIEWER";

function isAllowedRole(role: unknown): role is AllowedRole {
  return role === "ADMIN" || role === "DEVELOPER" || role === "VIEWER";
}

function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function listUsersAction(status?: string): Promise<{ users: Array<{ id: string; name: string; email: string; role: string; status: string; createdAt: string; lastLoginAt: string | null }> } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    const users = await listUsers(status ?? undefined);
    return {
      users: users.map((u) => ({
        ...u,
        createdAt: formatKST(u.createdAt),
        lastLoginAt: u.lastLoginAt ? formatKST(u.lastLoginAt) : null,
      })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function approveUserAction(id: string, role?: string): Promise<{ user: { id: string; name: string; email: string; role: string; status: string } } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid user ID" };
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);
    const { ip, userAgent } = await getActionClientInfo();

    const roleToSet: AllowedRole = role && isAllowedRole(role) ? role : "VIEWER";
    const user = await approveUser(id, roleToSet, auth.userId, ip, userAgent);
    return { user };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function rejectUserAction(id: string, reason?: string): Promise<{ user: { id: string; name: string; email: string; role: string; status: string } } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid user ID" };
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);
    const { ip, userAgent } = await getActionClientInfo();

    const normalizedReason = reason ? String(reason) : null;
    const user = await rejectUser(id, normalizedReason, auth.userId, ip, userAgent);
    return { user };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function updateUserRoleAction(id: string, role: string): Promise<{ user: { id: string; name: string; email: string; role: string; status: string } } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid user ID" };
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);
    const { ip, userAgent } = await getActionClientInfo();

    if (!isAllowedRole(role)) {
      return { error: "Invalid role. Must be one of: ADMIN, DEVELOPER, VIEWER" };
    }

    const user = await updateUserRole(id, role, auth.userId, ip, userAgent);
    return { user };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function listCategoriesAction(): Promise<{ categories: Array<{ id: string; name: string; color: string; fileCount: number }> } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    const categories = await listCategories();
    const counts = await prisma.vaultFile.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
      where: { categoryId: { in: categories.map((c) => c.id) } },
    });
    const countByCategoryId = new Map(counts.map((c) => [c.categoryId, c._count._all]));

    return {
      categories: categories.map((c) => ({
        ...c,
        fileCount: countByCategoryId.get(c.id) ?? 0,
      })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function createCategoryAction(name: string, color: string): Promise<{ category: { id: string; name: string; color: string } } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    if (!name?.trim()) return { error: "Name is required" };
    const hexColor = /(^#[0-9A-Fa-f]{6}$)|(^[0-9A-Fa-f]{3}$)/.test(color || "") ? color : "#6366f1";

    try {
      const category = await createCategory(name.trim(), hexColor);
      return { category };
    } catch {
      return { error: "Category name already exists" };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ success: true } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid category ID" };
    await requireSessionWithRole([...ADMIN_ROLES]);

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: "Category not found" };

    await deleteCategory(id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function listApiKeysAction(status?: string): Promise<{ apiKeys: Array<{ id: string; name: string; keyPrefix: string; status: string; scopes: string[]; createdAt: string; expiresAt: string; lastUsedAt: string | null; revokedAt: string | null }> } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    const apiKeys = await listApiKeys(status ?? undefined);
    return {
      apiKeys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        status: k.status,
        scopes: (() => {
          try {
            return JSON.parse(k.scopesJson) as string[];
          } catch {
            return [];
          }
        })(),
        createdAt: k.createdAt.toISOString(),
        expiresAt: k.expiresAt.toISOString(),
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
        revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
      })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function createApiKeyAction(name: string, expiresInDays?: number, scopes?: string[]): Promise<{ apiKey: { id: string; name: string; keyPrefix: string; key: string; expiresAt: string; scopes: string[] } } | ActionError> {
  try {
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);

    if (!name) return { error: "Name is required" };

    const result = await createApiKey({
      name,
      createdById: auth.userId,
      expiresInDays: expiresInDays != null ? Number.parseInt(String(expiresInDays), 10) : undefined,
      scopes,
    });

    return {
      apiKey: {
        id: result.id,
        name: result.name,
        keyPrefix: result.keyPrefix,
        key: result.key,
        expiresAt: result.expiresAt.toISOString(),
        scopes: result.scopes,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function revokeApiKeyAction(id: string): Promise<{ success: true } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid API key ID" };
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);

    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) return { error: "API key not found" };

    await revokeApiKey(id, auth.userId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function updateApiKeyScopesAction(id: string, scopes: string[]): Promise<{ success: true; scopes: string[] } | ActionError> {
  try {
    if (!isValidUuid(id)) return { error: "Invalid API key ID" };
    const auth = await requireSessionWithRole([...ADMIN_ROLES]);

    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) return { error: "API key not found" };

    const validScopes = ["files:read", "files:read_raw", "files:write"];
    const filtered = scopes.filter((s) => validScopes.includes(s));
    if (filtered.length === 0) return { error: "At least one scope is required" };

    await updateApiKeyScopes(id, filtered);
    return { success: true, scopes: filtered };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function getAuditLogsAction(page = 1, pageSize = 20): Promise<{ logs: Array<{ id: string; eventType: string; actorType: string; actorId: string | null; targetType: string | null; targetId: string | null; success: boolean; failureReason: string | null; createdAt: string }>; pagination: { page: number; limit: number; total: number; totalPages: number } } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(pageSize) ? pageSize : 20));
    const skip = (safePage - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          actorType: true,
          actorId: true,
          targetType: true,
          targetId: true,
          success: true,
          failureReason: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        createdAt: formatKST(log.createdAt),
      })),
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function getSettingsAction(): Promise<{ settings: Record<string, string>; definitions: typeof SETTING_DEFINITIONS } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    const settings = await getAllSettings();
    return { settings, definitions: SETTING_DEFINITIONS };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}

export async function updateSettingsAction(settings: Record<string, string>): Promise<{ success: true } | ActionError> {
  try {
    await requireSessionWithRole([...ADMIN_ROLES]);

    if (!settings || typeof settings !== "object") return { error: "settings object is required" };

    await updateSettings(settings);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "An error occurred" };
  }
}
