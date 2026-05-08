import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getClientInfo, errorResponse } from '@/lib/auth/auth-handler';
import { getFile, updateFile, deleteFile } from '@/lib/files/file-service';
import { decrypt } from '@/lib/crypto/encryption';
import { maskContent } from '@/lib/masking/masking';
import { validateTitle, validateActualFileName, validateContentSize, validateContentType } from '@/lib/validation/validation';
import { formatKST } from '@/lib/time/kst';
import { getSettingBool } from '@/lib/settings/settings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER', 'VIEWER']);
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return errorResponse('NOT_FOUND', 'File not found', 404);

  const { ip, userAgent } = getClientInfo(request);
  const isAdminOrDeveloper = ['ADMIN', 'DEVELOPER'].includes(auth.ctx.role);

  if (isAdminOrDeveloper) {
    const logRawAccess = await getSettingBool('audit_log_raw_access');
    if (logRawAccess) {
      const { createAuditLog } = await import('@/lib/audit/audit-log');
      await createAuditLog({
        eventType: 'file.raw_viewed', actorType: 'USER', actorId: auth.ctx.userId,
        targetType: 'VaultFile', targetId: id, ipAddress: ip, userAgent,
        metadata: { title: file.title },
      });
    }
    const response = NextResponse.json({
      file: {
        id: file.id, title: file.title, actualFileName: file.actualFileName,
        contentType: file.contentType, content: decrypt(file.encryptedContent),
        createdAt: formatKST(file.createdAt), updatedAt: formatKST(file.updatedAt),
        category: file.category, createdBy: file.createdBy, updatedBy: file.updatedBy,
      },
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // viewer role
  const maskedContent = maskContent(decrypt(file.encryptedContent), file.contentType);
  const response = NextResponse.json({
    file: {
      id: file.id, title: file.title, actualFileName: file.actualFileName,
      contentType: file.contentType, content: maskedContent,
      createdAt: formatKST(file.createdAt), updatedAt: formatKST(file.updatedAt),
      category: file.category, createdBy: file.createdBy, updatedBy: file.updatedBy,
    },
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN', 'DEVELOPER']);
  if ('response' in auth) return auth.response;

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
    ip, userAgent,
  );
  if (!file) return errorResponse('NOT_FOUND', 'File not found', 404);

  return NextResponse.json({ file });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const { ip, userAgent } = getClientInfo(request);

  const deleted = await deleteFile(id, auth.ctx, ip, userAgent);
  if (!deleted) return errorResponse('NOT_FOUND', 'File not found', 404);

  return NextResponse.json({ message: 'File deleted' });
}
