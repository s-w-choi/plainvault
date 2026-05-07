import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyApiKey, updateLastUsed } from '@/lib/api-keys/api-key';
import { decrypt } from '@/lib/crypto/encryption';
import { createAuditLog } from '@/lib/audit/audit-log';
import { formatKST } from '@/lib/time/kst';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await createAuditLog({
      eventType: 'api_key.raw_file_requested',
      actorType: 'API_KEY',
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      success: false,
      failureReason: 'MISSING_BEARER_TOKEN',
    });

    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  const verifyResult = await verifyApiKey(token);

  if (!verifyResult.valid) {
    await createAuditLog({
      eventType: 'api_key.raw_file_requested',
      actorType: 'API_KEY',
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      success: false,
      failureReason: verifyResult.error,
    });

    const status = verifyResult.error === 'API_KEY_REVOKED' ? 403 : 401;
    return NextResponse.json(
      { error: { code: verifyResult.error, message: 'API key is invalid or expired' } },
      { status }
    );
  }

  await updateLastUsed(verifyResult.apiKeyId!);

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: verifyResult.apiKeyId },
    include: { createdBy: true },
  });
  if (!apiKey || !apiKey.createdBy) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'API key not found' } },
      { status: 500 }
    );
  }

  if (apiKey.status === 'REVOKED' || new Date() > apiKey.expiresAt) {
    return NextResponse.json(
      { error: { code: 'API_KEY_EXPIRED', message: 'API key is expired or revoked' } },
      { status: 401 }
    );
  }

  // Parse and check scopes
  let scopes: string[] = [];
  try {
    scopes = JSON.parse(apiKey.scopesJson);
  } catch {
    scopes = [];
  }

  if (!scopes.includes('files:read_raw')) {
    await createAuditLog({
      eventType: 'api_key.raw_file_failed',
      actorType: 'API_KEY',
      actorId: verifyResult.apiKeyId,
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

  if (apiKey.createdBy.role !== 'ADMIN' && apiKey.createdBy.role !== 'DEVELOPER') {
    await createAuditLog({
      eventType: 'api_key.raw_file_failed',
      actorType: 'API_KEY',
      actorId: verifyResult.apiKeyId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: ip,
      userAgent,
      success: false,
      failureReason: 'INSUFFICIENT_ROLE',
    });

    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin or Developer role required' } },
      { status: 403 }
    );
  }

  const file = await prisma.vaultFile.findUnique({ where: { id: fileId } });
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

  await createAuditLog({
    eventType: 'api_key.raw_file_succeeded',
    actorType: 'API_KEY',
    actorId: verifyResult.apiKeyId,
    targetType: 'file',
    targetId: fileId,
    ipAddress: ip,
    userAgent,
    metadata: { fileName: file.actualFileName },
    success: true,
  });

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
