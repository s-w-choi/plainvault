import { type NextRequest, NextResponse } from 'next/server';
import { updateLastUsed, verifyApiKey } from '@/lib/api-keys/api-key';
import { prisma } from '@/lib/db';
import { createFile, listFiles } from '@/lib/files/file-service';
import { checkRateLimit, getClientIpKey, getApiRateLimitConfig } from '@/lib/security/rate-limit';
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

export async function GET(request: NextRequest) {
  const clientIp = getClientIpKey(request.headers.get('x-forwarded-for'));
  if (clientIp) {
    const rateLimitConfig = await getApiRateLimitConfig('read');
    if (rateLimitConfig) {
      const rateLimitResult = checkRateLimit(`api:v1:files:list:${clientIp}`, rateLimitConfig);
      if (!rateLimitResult.allowed) {
        return errorResponse('RATE_LIMITED', 'Too many requests', 429);
      }
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const { files, total } = await listFiles(search, categoryId);

  await updateLastUsed(auth.apiKeyId).catch(() => {});

  return NextResponse.json({ files, total });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIpKey(request.headers.get('x-forwarded-for'));
  if (clientIp) {
    const rateLimitConfig = await getApiRateLimitConfig('write');
    if (rateLimitConfig) {
      const rateLimitResult = checkRateLimit(`api:v1:files:create:${clientIp}`, rateLimitConfig);
      if (!rateLimitResult.allowed) {
        return errorResponse('RATE_LIMITED', 'Too many requests', 429);
      }
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

  const body = await request.json();
  const { title, actualFileName, content, contentType = 'text', categoryId } = body;

  const titleValidation = validateTitle(title);
  if (!titleValidation.valid) {
    return errorResponse('VALIDATION_ERROR', titleValidation.errors.join(', '), 400);
  }

  const fileNameValidation = validateActualFileName(actualFileName);
  if (!fileNameValidation.valid) {
    return errorResponse('VALIDATION_ERROR', fileNameValidation.errors.join(', '), 400);
  }

  const sizeValidation = validateContentSize(content);
  if (!sizeValidation.valid) {
    return errorResponse('VALIDATION_ERROR', sizeValidation.errors.join(', '), 400);
  }

  const contentTypeValidation = validateContentType(contentType);
  if (!contentTypeValidation.valid) {
    return errorResponse('VALIDATION_ERROR', contentTypeValidation.errors.join(', '), 400);
  }

  const { ip, userAgent } = getClientInfo(request);

  const file = await createFile(
    { title, actualFileName, content, contentType, categoryId },
    auth.ctx,
    ip,
    userAgent,
  );

  await updateLastUsed(auth.apiKeyId).catch(() => {});

  return NextResponse.json({ file }, { status: 201 });
}
