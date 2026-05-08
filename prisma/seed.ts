import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedDefaultSettings() {
  const defaults = [
    { key: 'audit_log_raw_access', value: 'false' },
    { key: 'audit_log_retention_days', value: '90' },
    { key: 'max_file_content_bytes', value: '1048576' },
    { key: 'session_duration_days', value: '7' },
    { key: 'allow_registration', value: 'true' },
    { key: 'require_change_summary', value: 'true' },
  ];

  for (const setting of defaults) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('Default settings seeded.');
}

async function main() {
  const adminEmail = process.env.INIT_ADMIN_EMAIL || 'admin@plainvault.local';
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || 'plainvault-admin';
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

  await seedDefaultSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
