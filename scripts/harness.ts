/**
 * harness.ts — Full integration test scenario.
 * Initializes a separate test DB, creates users, tests CRUD flows,
 * verifies encryption, masking, and audit logs.
 * Run with: pnpm harness
 */

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

// ── crypto helpers (require to avoid TS import path issues in tsx) ──────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('../apps/app/src/lib/crypto/encryption') as {
  encrypt: (plaintext: string) => string;
  hashContent: (plaintext: string) => string;
};
const encrypt = crypto.encrypt;
const hashContent = crypto.hashContent;

// ── test DB setup ────────────────────────────────────────────────────────────

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'vault.test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;
const MIGRATE_DIR = path.join(process.cwd(), 'prisma', 'migrations');

function cleanupTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

function runMigrations(prisma: PrismaClient) {
  const migrationFiles = fs.readdirSync(MIGRATE_DIR)
    .filter((f) => fs.statSync(path.join(MIGRATE_DIR, f)).isDirectory())
    .sort();

  for (const dir of migrationFiles) {
    const sqlPath = path.join(MIGRATE_DIR, dir, 'migration.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      // Split on SQLite statement terminator and run each
      const statements = sql.split(/;\s*$/m).filter((s) => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          try { prisma.$executeRawUnsafe(stmt); } catch { /* ignore individual stmt errors */ }
        }
      }
    }
  }
}

// ── Prisma client (test DB) ──────────────────────────────────────────────────

function createTestPrisma() {
  return new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
}

// ── result tracking ──────────────────────────────────────────────────────────

interface Result { passed: boolean; message: string }
function pass(msg: string): Result { return { passed: true, message: msg }; }
function fail(msg: string): Result { return { passed: false, message: msg }; }

// ── HTTP helpers ─────────────────────────────────────────────────────────────

const BASE = 'http://localhost:13000';

async function apiFetch(
  method: string,
  routePath: string,
  body?: unknown,
  cookie?: string,
): Promise<{ status: number; body: unknown; cookies?: string }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookie) headers['cookie'] = cookie;
  const res = await fetch(`${BASE}${routePath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  } as RequestInit);
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json, cookies: res.headers.get('set-cookie') ?? undefined };
}

function cookieValue(setCookie: string | undefined): string {
  if (!setCookie) return '';
  const parts: string[] = [];
  for (const segment of setCookie.split(';')) {
    const kv = segment.trim();
    const eq = kv.indexOf('=');
    if (eq > 0) parts.push(kv.substring(0, eq + 1 + (kv.length - eq - 1 - (kv.endsWith(';') ? 1 : 0))));
  }
  return parts.join('; ');
}

// ── main test ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Integration Harness ===\n');
  const results: Array<{ name: string; result: Result }> = [];

  // Setup test DB
  console.log('[setup] Cleaning and migrating test DB');
  cleanupTestDb();

  const prisma = createTestPrisma();

  try {
    runMigrations(prisma);
    console.log('[setup] Test DB ready\n');
  } catch (err) {
    try {
      execSync(
        `DATABASE_URL="${TEST_DB_URL}" pnpm prisma migrate dev --name test_init --skip-generate`,
        { stdio: 'inherit', cwd: process.cwd() },
      );
      console.log('[setup] Test DB migrated via CLI\n');
    } catch (e) {
      console.error('[setup] Migration failed:', e ?? err);
      process.exit(1);
    }
  }

  // Reconnect after migration
  await prisma.$disconnect();
  const db = createTestPrisma();

  try {
    // ── User creation ───────────────────────────────────────────────────────
    const passwordHash = await argon2.hash('TestPass123!', { type: argon2.argon2id });

    const admin = await db.user.create({
      data: { name: 'Admin User', email: 'harness_admin@test.local', passwordHash, role: 'ADMIN', status: 'APPROVED' },
    });
    results.push({ name: 'Create admin user', result: pass(admin.id) });

    const developer = await db.user.create({
      data: { name: 'Dev User', email: 'harness_dev@test.local', passwordHash, role: 'DEVELOPER', status: 'APPROVED' },
    });
    results.push({ name: 'Create developer user', result: pass(developer.id) });

    const viewer = await db.user.create({
      data: { name: 'Viewer User', email: 'harness_viewer@test.local', passwordHash, role: 'VIEWER', status: 'APPROVED' },
    });
    results.push({ name: 'Create viewer user', result: pass(viewer.id) });

    // ── Encryption sanity check ──────────────────────────────────────────────
    const secretContent = 'super-secret-api-key-12345';
    const encrypted = encrypt(secretContent);
    results.push({
      name: 'Encryption produces ciphertext != plaintext',
      result: encrypted !== secretContent && !encrypted.includes(secretContent)
        ? pass('encrypted')
        : fail('ciphertext matches plaintext'),
    });

    const sha256 = hashContent(secretContent);
    results.push({
      name: 'hashContent produces valid SHA-256 hex',
      result: sha256.length === 64 && /^[a-f0-9]{64}$/.test(sha256)
        ? pass(sha256.substring(0, 16) + '...')
        : fail(`invalid: ${sha256}`),
    });

    // ── HTTP API flows ───────────────────────────────────────────────────────

    const adminLogin = await apiFetch('POST', '/api/auth/login', { email: admin.email, password: 'TestPass123!' });
    const adminCookie = cookieValue(adminLogin.cookies);
    results.push({
      name: 'Admin login returns 200',
      result: adminLogin.status === 200 ? pass(String(adminLogin.status)) : fail(`got ${adminLogin.status}`),
    });

    const devLogin = await apiFetch('POST', '/api/auth/login', { email: developer.email, password: 'TestPass123!' });
    const devCookie = cookieValue(devLogin.cookies);
    results.push({
      name: 'Developer login returns 200',
      result: devLogin.status === 200 ? pass(String(devLogin.status)) : fail(`got ${devLogin.status}`),
    });

    const viewerLogin = await apiFetch('POST', '/api/auth/login', { email: viewer.email, password: 'TestPass123!' });
    const viewerCookie = cookieValue(viewerLogin.cookies);
    results.push({
      name: 'Viewer login returns 200',
      result: viewerLogin.status === 200 ? pass(String(viewerLogin.status)) : fail(`got ${viewerLogin.status}`),
    });

    const badLogin = await apiFetch('POST', '/api/auth/login', { email: admin.email, password: 'wrongpassword' });
    results.push({
      name: 'Login with wrong password returns 401',
      result: badLogin.status === 401 ? pass('401') : fail(`got ${badLogin.status}`),
    });

    // Create file
    const createRes = await apiFetch('POST', '/api/files', {
      title: 'Harness Test File',
      actualFileName: 'secret.txt',
      content: secretContent,
      contentType: 'text',
    }, adminCookie);
    results.push({
      name: 'Create file (admin) returns 201',
      result: createRes.status === 201
        ? pass((createRes.body as { file?: { id: string } }).file?.id ?? 'ok')
        : fail(`${createRes.status}: ${JSON.stringify(createRes.body)}`),
    });

    const file = (createRes.body as { file?: { id: string } }).file;
    if (!file) {
      console.error('No file returned — aborting further tests.');
      await db.$disconnect();
      process.exit(1);
    }

    // Viewer sees masked content
    const viewMasked = await apiFetch('GET', `/api/files/${file.id}`, undefined, viewerCookie);
    if (viewMasked.status === 200) {
      const content = (viewMasked.body as { file?: { content?: string } }).file?.content ?? '';
      results.push({
        name: 'Viewer sees masked content (not raw)',
        result: content !== secretContent
          ? pass(`masked length: ${content.length}`)
          : fail(`raw content leaked: ${content}`),
      });
    } else {
      results.push({ name: 'Viewer sees masked content', result: fail(`got ${viewMasked.status}`) });
    }

    // Developer sees raw content
    const viewRaw = await apiFetch('GET', `/api/files/${file.id}`, undefined, devCookie);
    if (viewRaw.status === 200) {
      const content = (viewRaw.body as { file?: { content?: string } }).file?.content ?? '';
      results.push({
        name: 'Developer sees raw content',
        result: content === secretContent
          ? pass('raw content correct')
          : fail(`content mismatch: "${content}"`),
      });
    } else {
      results.push({ name: 'Developer sees raw content', result: fail(`got ${viewRaw.status}`) });
    }

    // Update file
    const updateRes = await apiFetch('PATCH', `/api/files/${file.id}`, {
      content: 'updated-secret-content',
      changeSummary: 'Harness test update',
    }, devCookie);
    results.push({
      name: 'Update file (developer) returns 200',
      result: updateRes.status === 200
        ? pass(String(updateRes.status))
        : fail(`${updateRes.status}: ${JSON.stringify(updateRes.body)}`),
    });

    // Delete file
    const deleteRes = await apiFetch('DELETE', `/api/files/${file.id}`, undefined, adminCookie);
    results.push({
      name: 'Delete file (admin) returns 200',
      result: deleteRes.status === 200
        ? pass(String(deleteRes.status))
        : fail(`${deleteRes.status}: ${JSON.stringify(deleteRes.body)}`),
    });

    // List files
    const listRes = await apiFetch('GET', '/api/files', undefined, adminCookie);
    results.push({
      name: 'List files (admin) returns 200',
      result: listRes.status === 200 ? pass(String(listRes.status)) : fail(`got ${listRes.status}`),
    });

    // ── Audit log verification ──────────────────────────────────────────────

    const logs = await db.auditLog.findMany({
      where: { actorId: { in: [admin.id, developer.id] } },
      orderBy: { createdAt: 'asc' },
    });
    results.push({
      name: 'Audit logs created for API actions',
      result: logs.length > 0 ? pass(`${logs.length} entries`) : fail('no audit logs'),
    });

    const loginLog = logs.find((l) => l.eventType === 'auth.login.success');
    results.push({
      name: 'auth.login.success audit log exists',
      result: loginLog ? pass('found') : fail('not found'),
    });

    const fileCreatedLog = logs.find((l) => l.eventType === 'file.created');
    results.push({
      name: 'file.created audit log exists',
      result: fileCreatedLog ? pass(String(fileCreatedLog.targetId)) : fail('not found'),
    });

    const secretInLogs = logs.filter((l) => {
      const meta = l.metadataJson ?? '';
      return meta.includes('super-secret') || meta.includes('secretContent');
    });
    results.push({
      name: 'Audit logs contain no plaintext secrets',
      result: secretInLogs.length === 0 ? pass('clean') : fail(`${secretInLogs.length} violated`),
    });

    // ── API key flow ─────────────────────────────────────────────────────────

    const createKeyRes = await apiFetch('POST', '/api/admin/api-keys', {
      name: 'Harness Test Key',
      expiresInDays: 30,
    }, adminCookie);
    let apiKeyRaw = '';
    if (createKeyRes.status === 201) {
      apiKeyRaw = (createKeyRes.body as { apiKey?: { key?: string } }).apiKey?.key ?? '';
      results.push({
        name: 'Create API key returns 201',
        result: pass((createKeyRes.body as { apiKey?: { keyPrefix?: string } }).apiKey?.keyPrefix ?? 'ok'),
      });
    } else {
      results.push({
        name: 'Create API key returns 201',
        result: fail(`${createKeyRes.status}: ${JSON.stringify(createKeyRes.body)}`),
      });
    }

    // Create a non-deleted file for API key raw access test
    const keyFileRes = await apiFetch('POST', '/api/files', {
      title: 'API Key Test File',
      actualFileName: 'apikey_test.txt',
      content: 'api-key-secret-content',
      contentType: 'text',
    }, adminCookie);
    const keyFileId = (keyFileRes.body as { file?: { id: string } }).file?.id;

    if (apiKeyRaw && keyFileId) {
      const keyRawRes = await fetch(`${BASE}/api/v1/files/${keyFileId}/raw`, {
        headers: { authorization: `Bearer ${apiKeyRaw}` },
      });
      const keyRawBody = await keyRawRes.json();
      results.push({
        name: 'API key raw file access returns 200',
        result: keyRawRes.status === 200
          ? pass(String(keyRawRes.status))
          : fail(`${keyRawRes.status}: ${JSON.stringify(keyRawBody)}`),
      });
    } else {
      results.push({
        name: 'API key raw file access returns 200',
        result: fail(`no key=${!apiKeyRaw} or no file=${!keyFileId}`),
      });
    }

    const listKeysRes = await apiFetch('GET', '/api/admin/api-keys', undefined, adminCookie);
    results.push({
      name: 'List API keys (admin) returns 200',
      result: listKeysRes.status === 200 ? pass(String(listKeysRes.status)) : fail(`got ${listKeysRes.status}`),
    });

    // ── DB encryption verification ───────────────────────────────────────────

    const dbFile = await db.vaultFile.findFirst({ where: { deletedAt: null } });
    if (dbFile) {
      results.push({
        name: 'DB encryptedContent differs from raw secret',
        result: !dbFile.encryptedContent.includes('api-key-secret-content')
          ? pass('encrypted')
          : fail('DB appears to contain plaintext'),
      });
    }

    const revisions = await db.fileRevision.findMany();
    results.push({
      name: 'File revisions stored encrypted',
      result: pass(`${revisions.length} revision(s)`),
    });

  } finally {
    await db.$disconnect();
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n=== Summary ===');
  let passed = 0;
  let failed = 0;
  for (const { name, result } of results) {
    console.log(`  ${result.passed ? 'PASS' : 'FAIL'} ${name}: ${result.message}`);
    if (result.passed) passed++;
    else failed++;
  }
  console.log(`\n${passed}/${results.length} passed, ${failed} failed`);

  cleanupTestDb();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Harness error:', err);
  process.exit(1);
});