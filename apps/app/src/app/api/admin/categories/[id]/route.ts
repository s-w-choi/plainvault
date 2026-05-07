import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

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
