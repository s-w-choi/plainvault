import { prisma } from '@/lib/db';

export type AuditEventType =
  | 'auth.register.requested'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.access.denied'
  | 'auth.password.changed'
  | 'admin.user.approved'
  | 'admin.user.rejected'
  | 'admin.user.role_changed'
  | 'admin.user.disabled'
  | 'file.created'
  | 'file.raw_viewed'
  | 'file.updated'
  | 'file.restored'
  | 'file.deleted'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.raw_file_succeeded'
  | 'api_key.raw_file_failed';

export type ActorType = 'USER' | 'API_KEY' | 'SYSTEM';

interface AuditLogInput {
  eventType: AuditEventType;
  actorType?: ActorType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  failureReason?: string;
}

const SECRET_VALUE_PATTERNS = [
  /[a-zA-Z0-9_\-=\/+]{32,}/, // Long base64-like strings (likely keys/tokens)
  /sk_live_[a-zA-Z0-9]+/,    // Stripe-style keys
  /sk_test_[a-zA-Z0-9]+/,    // Stripe test keys
  /secvault_[a-zA-Z0-9]+/,   // Our API keys
  /AKIA[A-Z0-9]{16}/,        // AWS access keys
];

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      let sanitizedValue = value;
      for (const pattern of SECRET_VALUE_PATTERNS) {
        if (pattern.test(sanitizedValue)) {
          sanitizedValue = '[REDACTED]';
          break;
        }
      }
      sanitized[key] = sanitizedValue.length > 100
        ? sanitizedValue.substring(0, 100) + '...'
        : sanitizedValue;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const { metadata: rawMetadata, ...rest } = input;
  const metadata = rawMetadata ? sanitizeMetadata(rawMetadata) : undefined;

  await prisma.auditLog.create({
    data: {
      eventType: rest.eventType,
      actorType: rest.actorType || 'USER',
      actorId: rest.actorId || null,
      targetType: rest.targetType || null,
      targetId: rest.targetId || null,
      ipAddress: rest.ipAddress || null,
      userAgent: rest.userAgent || null,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      success: rest.success !== false,
      failureReason: rest.failureReason || null,
    },
  });
}

export function extractMetadataSafe(metadata: Record<string, unknown>, secrets: string[]): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (secrets.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 100) {
      sanitized[key] = value.substring(0, 100) + '...';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
