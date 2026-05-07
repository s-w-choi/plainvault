import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/auth-handler';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Category not found' } }, { status: 404 });
  }

  const fileCount = await prisma.vaultFile.count({ where: { categoryId: id } });
  if (fileCount > 0) {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: `Cannot delete: ${fileCount} file(s) are using this category` } },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ message: 'Category deleted' });
}
