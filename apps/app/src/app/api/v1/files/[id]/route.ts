import { type NextRequest, NextResponse } from 'next/server';
import { updateLastUsed, verifyApiKey } from '@/lib/api-keys/api-key';
import { decrypt } from '@/lib/crypto/encryption';
import { prisma } from '@/lib/db';
import { getFile, updateFile } from '@/lib/files/file-service';
import { maskContent } from '@/lib/masking/masking';
import { checkRateLimit, getClientIpKey } from '@/lib/security/rate-limit';
import { getSettingBool } from '@/lib/settings/settings';
import { formatKST } from '@/lib/time/kst';
import {
  validateActualFileName,
  validateContentSize,
  validateContentType,
  validateTitle,
} from '@/lib/validation/validation';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getClientInfo(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { response: errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header', 401) };
  }

  const token = authHeader.slice(7);
  const verifyResult = await verifyApiKey(token);

  if (!verifyResult.valid) {
    const status = verifyResult.error === 'API_KEY_REVOKED' ? 403 : 401;
    return {
      response: errorResponse(verifyResult.error, 'API key is invalid or expired', status),
    };
  }

  const { apiKeyId, scopes, ownerRole } = verifyResult.data;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    include: { createdBy: { select: { status: true, role: true } } },
  });

  if (!apiKey?.createdBy) {
    return { response: errorResponse('API_KEY_INVALID', 'API key is invalid or expired', 401) };
  }

  return {
    apiKeyId,
    scopes,
    ownerRole,
    ctx: {
      userId: apiKey.createdById,
      role: apiKey.createdBy.role,
      status: apiKey.createdBy.status,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIpKey(request.headers.get('x-forwarded-for'));
  if (clientIp) {
    const rateLimitResult = checkRateLimit(`api:v1:files:get:${clientIp}`);
    if (!rateLimitResult.allowed) {
      return errorResponse('RATE_LIMITED', 'Too many requests', 429);
    }
  }

  const auth = await authenticate(request);
  if ('response' in auth) return auth.response;

  if (!auth.scopes.includes('files:read')) {
    return errorResponse('FORBIDDEN', 'API key does not have files:read scope', 403);
  }

  if (!['ADMIN', 'DEVELOPER', 'VIEWER'].includes(auth.ownerRole)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
  }

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return errorResponse('NOT_FOUND', 'File not found', 404);

  const isAdminOrDeveloper = ['ADMIN', 'DEVELOPER'].includes(auth.ctx.role);

  const content = isAdminOrDeveloper
    ? decrypt(file.encryptedContent)
    : maskContent(decrypt(file.encryptedContent), file.contentType);

  const response = NextResponse.json({
    file: {
      id: file.id,
      title: file.title,
      actualFileName: file.actualFileName,
      contentType: file.contentType,
      content,
      createdAt: formatKST(file.createdAt),
      updatedAt: formatKST(file.updatedAt),
      category: file.category,
      createdBy: file.createdBy,
      updatedBy: file.updatedBy,
    },
  });
  response.headers.set('Cache-Control', 'no-store');

  await updateLastUsed(auth.apiKeyId).catch(() => {});

  return response;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIpKey(request.headers.get('x-forwarded-for'));
  if (clientIp) {
    const rateLimitResult = checkRateLimit(`api:v1:files:update:${clientIp}`);
    if (!rateLimitResult.allowed) {
      return errorResponse('RATE_LIMITED', 'Too many requests', 429);
    }
  }

  const auth = await authenticate(request);
  if ('response' in auth) return auth.response;

  if (!auth.scopes.includes('files:write')) {
    return errorResponse('FORBIDDEN', 'API key does not have files:write scope', 403);
  }

  if (!['ADMIN', 'DEVELOPER'].includes(auth.ownerRole)) {
    return errorResponse('FORBIDDEN', 'Admin or Developer role required', 403);
  }

  const { id } = await params;
  const body = await request.json();
  const { title, actualFileName, content, contentType, categoryId, changeSummary } = body;

  if (title !== undefined) {
    const v = validateTitle(title);
    if (!v.valid) return errorResponse('VALIDATION_ERROR', v.errors.join(', '), 400);
  }
  if (actualFileName !== undefined) {
    const v = validateActualFileName(actualFileName);
    if (!v.valid) return errorResponse('VALIDATION_ERROR', v.errors.join(', '), 400);
  }
  if (content !== undefined) {
    const v = validateContentSize(content);
    if (!v.valid) return errorResponse('VALIDATION_ERROR', v.errors.join(', '), 400);
  }
  if (contentType !== undefined) {
    const v = validateContentType(contentType);
    if (!v.valid) return errorResponse('VALIDATION_ERROR', v.errors.join(', '), 400);
  }
  const requireSummary = await getSettingBool('require_change_summary');
  if (requireSummary && !changeSummary) {
    return errorResponse('VALIDATION_ERROR', 'changeSummary is required', 400);
  }

  const { ip, userAgent } = getClientInfo(request);

  const file = await updateFile(
    id,
    { title, actualFileName, content, contentType, categoryId, changeSummary },
    auth.ctx,
    ip,
    userAgent,
  );
  if (!file) return errorResponse('NOT_FOUND', 'File not found', 404);

  await updateLastUsed(auth.apiKeyId).catch(() => {});

  return NextResponse.json({ file });
}
