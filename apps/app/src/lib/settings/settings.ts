import { prisma } from '@/lib/db';

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'number';
  defaultValue: string;
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: 'audit_log_raw_access',
    label: 'Log Raw Access',
    description: 'Log audit events when users view raw secret content',
    type: 'boolean',
    defaultValue: 'false',
  },
  {
    key: 'audit_log_retention_days',
    label: 'Audit Log Retention',
    description: 'Days to keep audit logs (0 = keep forever)',
    type: 'number',
    defaultValue: '90',
  },
  {
    key: 'max_file_content_bytes',
    label: 'Max File Size',
    description: 'Maximum file content size in bytes',
    type: 'number',
    defaultValue: '1048576',
  },
  {
    key: 'session_duration_days',
    label: 'Session Duration',
    description: 'Session cookie duration in days',
    type: 'number',
    defaultValue: '7',
  },
  {
    key: 'allow_registration',
    label: 'Allow Registration',
    description: 'Allow new users to register accounts',
    type: 'boolean',
    defaultValue: 'true',
  },
  {
    key: 'require_change_summary',
    label: 'Require Change Summary',
    description: 'Require a change summary when editing files',
    type: 'boolean',
    defaultValue: 'true',
  },
];

const DEFAULTS = Object.fromEntries(
  SETTING_DEFINITIONS.map((s) => [s.key, s.defaultValue]),
);

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? DEFAULTS[key] ?? '';
}

export async function getSettingBool(key: string): Promise<boolean> {
  return (await getSetting(key)) === 'true';
}

export async function getSettingNumber(key: string): Promise<number> {
  return parseInt(await getSetting(key), 10);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const stored = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return { ...DEFAULTS, ...stored };
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  const validKeys = new Set(SETTING_DEFINITIONS.map((s) => s.key));

  await prisma.$transaction(
    Object.entries(updates)
      .filter(([key]) => validKeys.has(key))
      .map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
  );
}

export async function seedDefaultSettings(): Promise<void> {
  for (const def of SETTING_DEFINITIONS) {
    await prisma.setting.upsert({
      where: { key: def.key },
      update: {},
      create: { key: def.key, value: def.defaultValue },
    });
  }
}
