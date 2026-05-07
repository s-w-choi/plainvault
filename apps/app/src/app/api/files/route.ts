import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getClientInfo, errorResponse } from '@/lib/auth/auth-handler';
import { listFiles, createFile } from '@/lib/files/file-service';
import { listCategories } from '@/lib/categories/category-service';
import { createAuditLog } from '@/lib/audit/audit-log';
import { validateTitle, validateActualFileName, validateContentSize, validateContentType } from '@/lib/validation/validation';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER', 'VIEWER']);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const { files } = await listFiles(search, categoryId);
  const categories = await listCategories();

  await createAuditLog({
    eventType: 'file.list_viewed',
    actorType: 'USER',
    actorId: auth.ctx.userId,
    targetType: 'VaultFile',
    metadata: { count: files.length },
  });

  return NextResponse.json({ files, categories });
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER']);
  if ('response' in auth) return auth.response;

  const body = await request.json();
  const { title, actualFileName, content, contentType = 'text', categoryId } = body;

  const titleValidation = validateTitle(title);
  if (!titleValidation.valid) return errorResponse('VALIDATION_ERROR', titleValidation.errors.join(', '), 400);

  const fileNameValidation = validateActualFileName(actualFileName);
  if (!fileNameValidation.valid) return errorResponse('VALIDATION_ERROR', fileNameValidation.errors.join(', '), 400);

  const sizeValidation = validateContentSize(content);
  if (!sizeValidation.valid) return errorResponse('VALIDATION_ERROR', sizeValidation.errors.join(', '), 400);

  const contentTypeValidation = validateContentType(contentType);
  if (!contentTypeValidation.valid) return errorResponse('VALIDATION_ERROR', contentTypeValidation.errors.join(', '), 400);

  const { ip, userAgent } = getClientInfo(request);

  const file = await createFile({ title, actualFileName, content, contentType, categoryId }, auth.ctx, ip, userAgent);

  return NextResponse.json({ file }, { status: 201 });
}
