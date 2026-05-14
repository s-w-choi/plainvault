import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { createAuditLog } from '../audit/audit-log';

const API_KEY_PREFIX = 'secvault_';
const API_KEY_LENGTH = 32;

export interface CreateApiKeyInput {
  name: string;
  createdById: string;
  expiresInDays?: number;
  scopes?: string[];
}

export interface ApiKeyOutput {
  id: string;
  name: string;
  keyPrefix: string;
  key: string;
  expiresAt: Date;
  scopes: string[];
}

export async function createApiKey(input: CreateApiKeyInput): Promise<ApiKeyOutput> {
  const key = `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_LENGTH).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, API_KEY_PREFIX.length + 8);

  const expiresInDays = input.expiresInDays || 90;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const apiKey = await prisma.apiKey.create({
    data: {
      name: input.name,
      keyPrefix,
      keyHash,
      status: 'ACTIVE',
      createdById: input.createdById,
      expiresAt,
      scopesJson: JSON.stringify(input.scopes ?? ['files:read_raw']),
    },
  });

  await createAuditLog({
    eventType: 'api_key.created',
    actorType: 'USER',
    actorId: input.createdById,
    targetType: 'api_key',
    targetId: apiKey.id,
    metadata: { keyPrefix, name: input.name },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    key,
    expiresAt: apiKey.expiresAt,
    scopes: input.scopes ?? ['files:read_raw'],
  };
}

export interface VerifiedApiKey {
  apiKeyId: string;
  scopes: string[];
  ownerRole: string;
}

export async function verifyApiKey(key: string): Promise<
  { valid: true; data: VerifiedApiKey } | { valid: false; error: string }
> {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash },
    include: { createdBy: { select: { status: true, role: true } } },
  });

  if (!apiKey) {
    return { valid: false, error: 'API_KEY_INVALID' };
  }

  if (apiKey.status === 'REVOKED') {
    return { valid: false, error: 'API_KEY_REVOKED' };
  }

  if (new Date() > apiKey.expiresAt) {
    return { valid: false, error: 'API_KEY_EXPIRED' };
  }

  if (!apiKey.createdBy || apiKey.createdBy.status !== 'APPROVED') {
    return { valid: false, error: 'API_KEY_OWNER_INACTIVE' };
  }

  let scopes: string[] = [];
  try {
    scopes = JSON.parse(apiKey.scopesJson);
  } catch {
    scopes = [];
  }

  return {
    valid: true,
    data: {
      apiKeyId: apiKey.id,
      scopes,
      ownerRole: apiKey.createdBy.role,
    },
  };
}

export async function revokeApiKey(apiKeyId: string, revokedById: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      status: 'REVOKED',
      revokedById,
      revokedAt: new Date(),
    },
  });

  await createAuditLog({
    eventType: 'api_key.revoked',
    actorType: 'USER',
    actorId: revokedById,
    targetType: 'api_key',
    targetId: apiKeyId,
  });
}

export async function updateLastUsed(apiKeyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
  });
}

export interface ListedApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  scopesJson: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  ownerName: string;
  ownerEmail: string;
}

export async function listApiKeys(status?: string): Promise<ListedApiKey[]> {
  const where = status ? { status } : {};

  const apiKeys = await prisma.apiKey.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      status: true,
      scopesJson: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return apiKeys.map((apiKey) => ({
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    status: apiKey.status,
    scopesJson: apiKey.scopesJson,
    expiresAt: apiKey.expiresAt,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    revokedAt: apiKey.revokedAt,
    ownerName: apiKey.createdBy.name,
    ownerEmail: apiKey.createdBy.email,
  }));
}
