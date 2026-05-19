import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyApiKey, updateLastUsed } from '@/lib/api-keys/api-key';
import { checkRateLimit, getClientIpKey, getApiRateLimitConfig } from '@/lib/security/rate-limit';
import { decrypt } from '@/lib/crypto/encryption';
import { formatKST } from '@/lib/time/kst';
import { getSettingBool } from '@/lib/settings/settings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  const clientIp = getClientIpKey(ip ?? null);
  if (clientIp) {
    const rateLimitConfig = await getApiRateLimitConfig('read');
    if (rateLimitConfig) {
      const rateLimitResult = checkRateLimit(`api:v1:files:raw:${clientIp}`, rateLimitConfig);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
          { status: 429 }
        );
      }
    }
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const verifyResult = await verifyApiKey(token);

  if (!verifyResult.valid) {
    const status = verifyResult.error === 'API_KEY_REVOKED' ? 403 : 401;
    return NextResponse.json(
      { error: { code: verifyResult.error, message: 'API key is invalid or expired' } },
      { status }
    );
  }

  const { apiKeyId, scopes, ownerRole } = verifyResult.data;

  if (!scopes.includes('files:read_raw')) {
    const { createAuditLog } = await import('@/lib/audit/audit-log');
    await createAuditLog({
      eventType: 'api_key.raw_file_failed',
      actorType: 'API_KEY',
      actorId: apiKeyId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      success: false,
      failureReason: 'MISSING_SCOPE',
    });

    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'API key does not have files:read_raw scope' } },
      { status: 403 }
    );
  }

  if (ownerRole !== 'ADMIN') {
    const { createAuditLog } = await import('@/lib/audit/audit-log');
    await createAuditLog({
      eventType: 'api_key.raw_file_failed',
      actorType: 'API_KEY',
      actorId: apiKeyId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      success: false,
      failureReason: 'INSUFFICIENT_ROLE',
    });

    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const file = await prisma.vaultFile.findFirst({
    where: { id: fileId, deletedAt: null },
  });
  if (!file) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'File not found' } },
      { status: 404 }
    );
  }

  let content: string;
  try {
    content = decrypt(file.encryptedContent);
  } catch {
    return NextResponse.json(
      { error: { code: 'DECRYPTION_FAILED', message: 'Failed to decrypt file content' } },
      { status: 500 }
    );
  }

  const logRawAccess = await getSettingBool('audit_log_raw_access');
  if (logRawAccess) {
    const { createAuditLog } = await import('@/lib/audit/audit-log');
    await createAuditLog({
      eventType: 'api_key.raw_file_succeeded',
      actorType: 'API_KEY',
      actorId: apiKeyId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      metadata: { fileName: file.actualFileName },
      success: true,
    });
  }

  await updateLastUsed(apiKeyId).catch(() => {});

  return NextResponse.json(
    {
      id: file.id,
      title: file.title,
      actualFileName: file.actualFileName,
      content,
      updatedAt: file.updatedAt.toISOString(),
      updatedAtKst: formatKST(file.updatedAt),
      updatedBy: file.updatedById,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
