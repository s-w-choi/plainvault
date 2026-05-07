import { prisma } from '@/lib/db';

export type AuditEventType =
  | 'auth.register.requested'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.access.denied'
  | 'admin.user.approved'
  | 'admin.user.rejected'
  | 'admin.user.role_changed'
  | 'admin.user.disabled'
  | 'file.created'
  | 'file.list_viewed'
  | 'file.masked_viewed'
  | 'file.raw_viewed'
  | 'file.updated'
  | 'file.deleted'
  | 'file.revision_viewed'
  | 'file.diff_viewed'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.raw_file_requested'
  | 'api_key.raw_file_succeeded'
  | 'api_key.raw_file_failed'
  | 'admin.audit_log_viewed';

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

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const { metadata, ...rest } = input;

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
