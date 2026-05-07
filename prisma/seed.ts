import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.INIT_ADMIN_EMAIL || 'admin@internal.local';
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.INIT_ADMIN_NAME || 'Admin User';

  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin user ${adminEmail} already exists, skipping seed.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  const defaultCategories = [
    { name: 'Production', color: '#ef4444' },
    { name: 'Development', color: '#22c55e' },
    { name: 'Secrets', color: '#f97316' },
    { name: 'Config', color: '#3b82f6' },
    { name: 'Notes', color: '#8b5cf6' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`Seed completed. Admin: ${adminEmail}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password: ${adminPassword} (from INIT_ADMIN_PASSWORD env)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });