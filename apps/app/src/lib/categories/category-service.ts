import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  return prisma.category.delete({ where: { id } });
}
