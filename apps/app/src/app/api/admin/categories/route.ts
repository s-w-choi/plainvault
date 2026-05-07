import { NextRequest, NextResponse } from 'next/server';
import { withAuth, errorResponse } from '@/lib/auth/auth-handler';
import { createCategory } from '@/lib/categories/category-service';
import { prisma } from '@/lib/db';

export async function GET() {
  const auth = await withAuth({} as NextRequest, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { files: true } } },
  });

  return NextResponse.json({
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      fileCount: c._count.files,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const { name, color } = await request.json();
  if (!name?.trim()) return errorResponse('VALIDATION_ERROR', 'Name is required', 400);

  const hexColor = /(^#[0-9A-Fa-f]{6}$)|(^[0-9A-Fa-f]{3}$)/.test(color || '') ? color : '#6366f1';

  try {
    const category = await createCategory(name.trim(), hexColor);
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return errorResponse('CONFLICT', 'Category name already exists', 409);
  }
}
