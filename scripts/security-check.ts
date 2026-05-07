/**
 * security-check.ts — Security verification script.
 * Checks DB doesn't contain plaintext content, audit logs don't contain
 * API keys or secrets, and viewer responses don't contain raw content.
 * Run with: pnpm security:check
 */

import { PrismaClient } from '@prisma/client';

// ── result type ──────────────────────────────────────────────────────────────

type Check = {
  name: string;
  passed: boolean;
  detail: string;
};

// ── helpers ──────────────────────────────────────────────────────────────────

// Patterns that indicate a plaintext secret (high confidence)
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,                        // OpenAI-style key
  /password\s*[=:]\s*\S+/i,                     // password=X
  /api[_-]?key\s*[=:]\s*\S+/i,                  // api_key=X
  /Bearer\s+[a-zA-Z0-9_-]{20,}/,                // Bearer token
  /ghp_[a-zA-Z0-9]{36}/,                        // GitHub personal token
  /AKIA[0-9A-Z]{16}/,                           // AWS access key
];

// API key prefix patterns (raw keys, not hashes)
const API_KEY_PREFIX_PATTERNS = [
  /secvault_[a-f0-9]{32,}/i,                    // secvault_ prefix raw key
];

// Patterns that indicate potential plaintext in encrypted fields
// (base64 strings in non-encrypted fields, raw JSON, etc.)

async function main() {
  console.log('=== Security Check ===\n');
  const checks: Check[] = [];

  const prisma = new PrismaClient();

  // Use the main DB configured in .env
  try {
    await prisma.$connect();
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }

  try {
    // ── 1. DB encryptedContent doesn't contain plaintext secrets ────────────

    const vaultFiles = await prisma.vaultFile.findMany({
      select: { id: true, title: true, encryptedContent: true },
    });

    let plaintextFound = false;
    const plaintextDetails: string[] = [];

    for (const file of vaultFiles) {
      // Check if the encryptedContent field contains plaintext-like patterns
      // (i.e., if it's NOT properly encrypted, it might contain readable secrets)
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(file.encryptedContent)) {
          plaintextFound = true;
          plaintextDetails.push(`file:${file.id} (${file.title}) matches ${pattern}`);
        }
      }

      // Additional heuristic: if content looks like base64 (proper encryption)
      // but we're being extra cautious — we check for known plaintext markers
      // Also verify that encryptedContent doesn't look like JSON (unencrypted)
      try {
        JSON.parse(file.encryptedContent);
        // If it parsed as JSON without error, it's likely NOT encrypted (should be base64)
        plaintextDetails.push(`file:${file.id} encryptedContent looks like JSON, not base64`);
        plaintextFound = true;
      } catch {
        // Good — not JSON, likely encrypted
      }
    }

    checks.push({
      name: 'DB encryptedContent contains no plaintext secrets',
      passed: !plaintextFound,
      detail: plaintextFound
        ? `FOUND: ${plaintextDetails.join('; ')}`
        : `${vaultFiles.length} files checked — clean`,
    });

    // ── 2. Check FileRevision.encryptedContentBefore/After are encrypted ────

    const revisions = await prisma.fileRevision.findMany({
      select: { id: true, encryptedContentBefore: true, encryptedContentAfter: true },
    });

    let revisionPlaintextFound = false;
    for (const rev of revisions) {
      for (const field of ['encryptedContentBefore', 'encryptedContentAfter'] as const) {
        const val = rev[field];
        if (!val) continue;
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(val)) {
            revisionPlaintextFound = true;
          }
        }
        try {
          JSON.parse(val);
          revisionPlaintextFound = true;
        } catch {
          // Not JSON — likely encrypted
        }
      }
    }

    checks.push({
      name: 'File revisions contain no plaintext secrets',
      passed: !revisionPlaintextFound,
      detail: revisionPlaintextFound
        ? 'Found plaintext in revisions'
        : `${revisions.length} revisions checked — clean`,
    });

    // ── 3. Audit logs don't contain API keys or secrets ───────────────────

    const auditLogs = await prisma.auditLog.findMany({
      select: { id: true, eventType: true, metadataJson: true },
    });

    let secretsInAuditLogs: string[] = [];
    for (const log of auditLogs) {
      const meta = log.metadataJson ?? '';
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(meta)) {
          secretsInAuditLogs.push(`${log.eventType} (id:${log.id})`);
        }
      }
      // Also check for raw secret content strings
      if (meta.length > 0 && meta.length < 200) {
        // Short metadata fields with high-entropy content might be secrets
        const wordCount = meta.trim().split(/\s+/).length;
        if (wordCount <= 3 && /[a-z0-9]{16,}/i.test(meta)) {
          secretsInAuditLogs.push(`${log.eventType} (id:${log.id}) — possible secret: ${meta.substring(0, 50)}`);
        }
      }
    }

    // Deduplicate
    secretsInAuditLogs = [...new Set(secretsInAuditLogs)];

    checks.push({
      name: 'Audit logs contain no API keys or secrets',
      passed: secretsInAuditLogs.length === 0,
      detail: secretsInAuditLogs.length > 0
        ? `FOUND: ${secretsInAuditLogs.join('; ')}`
        : `${auditLogs.length} logs checked — clean`,
    });

    // ── 4. API Key keyHash stored as hash, not plaintext ───────────────────

    const apiKeys = await prisma.apiKey.findMany({
      select: { id: true, name: true, keyHash: true, keyPrefix: true },
    });

    let keyHashProblem = false;
    for (const key of apiKeys) {
      // keyHash should be a SHA256 hash — should NOT look like a raw key
      // If keyHash is shorter than 40 chars, it's definitely a problem
      if (key.keyHash.length < 40) {
        keyHashProblem = true;
      }
      // Check if keyHash matches raw API key prefix patterns (it should NOT)
      for (const pattern of API_KEY_PREFIX_PATTERNS) {
        if (pattern.test(key.keyHash)) {
          keyHashProblem = true;
        }
      }
    }

    checks.push({
      name: 'API key keyHash is properly hashed (not plaintext)',
      passed: !keyHashProblem,
      detail: keyHashProblem
        ? 'API key keyHash appears to contain a raw key'
        : `${apiKeys.length} keys checked — clean`,
    });

    // ── 5. No plaintext passwords in DB ───────────────────────────────────

    const users = await prisma.user.findMany({
      select: { id: true, email: true, passwordHash: true },
    });

    let plaintextPasswords = false;
    for (const user of users) {
      // passwordHash should be bcrypt — should NOT be a raw password
      if (user.passwordHash.length < 40) {
        plaintextPasswords = true;
      }
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(user.passwordHash)) {
          plaintextPasswords = true;
        }
      }
    }

    checks.push({
      name: 'User passwordHash stored as bcrypt hash (not plaintext)',
      passed: !plaintextPasswords,
      detail: plaintextPasswords
        ? 'FOUND: passwordHash appears to be plaintext'
        : `${users.length} users checked — clean`,
    });

    // ── 6. Viewer response masking (simulate) ───────────────────────────────
    // This would require a running server, so we do a structural check instead.

    // Verify that the files API response shape does not include raw content for masked views
    // We do this by checking that the DB does not store raw content in any field
    // that would be exposed in a masked response

    // Check all VaultFile fields for potential plaintext leakage
    const allFileFields = await prisma.vaultFile.findMany({
      select: {
        id: true,
        title: true,
        actualFileName: true,
        encryptedContent: true,
        contentSha256: true,
      },
    });

    let fieldLeakage = false;
    for (const file of allFileFields) {
      for (const [field, value] of Object.entries(file)) {
        if (typeof value !== 'string') continue;
        if (field === 'contentSha256') continue; // SHA256 is intentionally stored
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(value)) {
            fieldLeakage = true;
          }
        }
      }
    }

    checks.push({
      name: 'VaultFile fields contain no plaintext secrets',
      passed: !fieldLeakage,
      detail: fieldLeakage
        ? 'FOUND: plaintext secrets in file fields'
        : `${allFileFields.length} files checked — clean`,
    });

    // ── 7. Verify deleted files are soft-deleted (not hard-deleted) ────────

    const softDeleted = await prisma.vaultFile.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, encryptedContent: true },
    });

    // Soft-deleted files should still have encrypted content (not purged)
    let softDeleteIssue = false;
    for (const file of softDeleted) {
      if (!file.encryptedContent) {
        softDeleteIssue = true;
      }
    }

    checks.push({
      name: 'Soft-deleted files retain encrypted content (not hard-deleted)',
      passed: !softDeleteIssue,
      detail: softDeleteIssue
        ? 'FOUND: soft-deleted file with missing encryptedContent'
        : `${softDeleted.length} soft-deleted files checked — retained`,
    });

  } finally {
    await prisma.$disconnect();
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n=== Results ===\n');
  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    console.log(`  ${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
    console.log(`         detail: ${check.detail}`);
    if (check.passed) passed++;
    else failed++;
  }
  console.log(`\n${passed}/${checks.length} checks passed, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Security check error:', err);
  process.exit(1);
});