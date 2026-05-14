import { prisma } from '@/lib/db';

export async function listCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryWithCount(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { files: true } } },
  });
}

export async function createCategory(name: string, color: string) {
  return prisma.category.create({ data: { name, color } });
}

export async function deleteCategory(id: string) {
  const fileCount = await prisma.vaultFile.count({ where: { categoryId: id } });
  if (fileCount > 0) {
    throw new Error(`Cannot delete: ${fileCount} file(s) are using this category`);
  }
  return prisma.category.delete({ where: { id } });
}
