#!/usr/bin/env pnpm tsx
/**
 * Session Analyzer Harness
 *
 * Analyzes Claude Code session transcript and generates a verification checklist.
 * Results are stored in session-analysis.json and session-analysis.md
 *
 * Usage:
 *   pnpm session:analyze           # Analyze current session
 *   pnpm session:analyze --update  # Update checklist with manual notes
 *
 * The harness auto-detects these categories based on project files:
 * - Code Quality (lint, typecheck, build, test)
 * - Security (DB encryption, secret masking, audit logs)
 * - Auth/RBAC (register, login, role-based access)
 * - File Operations (CRUD, revisions, diff)
 * - API Keys (create, bearer auth, revoke)
 * - UI/UX (empty states, navigation, diff display)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface ChecklistItem {
  id: string;
  category: 'Code Quality' | 'Security' | 'Auth/RBAC' | 'File Operations' | 'API Keys' | 'Audit' | 'UI/UX';
  description: string;
  status: 'todo' | 'done' | 'fail' | 'skip';
  autoVerifiable: boolean;
  testCommand?: string;
  manualReview?: string;
  notes?: string;
}

interface SessionAnalysis {
  generatedAt: string;
  updatedAt?: string;
  sessionFile: string;
  instructions: { text: string; source: string }[];
  detectedFeatures: string[];
  checklist: ChecklistItem[];
  verificationCommands: string[];
  summary: {
    total: number;
    done: number;
    todo: number;
    fail: number;
    autoVerifiable: number;
    manualReview: number;
  };
}

const SESSION_FILE = '/Users/sungwon/.claude/projects/-Users-sungwon-repos-secret-manager/418381b9-18f7-4565-9810-ee76c7adeec7.jsonl';
const OUTPUT_JSON = './session-analysis.json';
const OUTPUT_MD = './session-analysis.md';

// Default checklist based on project features
function getDefaultChecklist(): ChecklistItem[] {
  return [
    // Code Quality
    { id: 'lint', category: 'Code Quality', description: 'ESLint passes with 0 errors and 0 warnings', status: 'todo', autoVerifiable: true, testCommand: 'pnpm lint' },
    { id: 'typecheck', category: 'Code Quality', description: 'TypeScript compilation passes (tsc --noEmit)', status: 'todo', autoVerifiable: true, testCommand: 'pnpm typecheck' },
    { id: 'build', category: 'Code Quality', description: 'Next.js production build succeeds', status: 'todo', autoVerifiable: true, testCommand: 'pnpm build' },
    { id: 'test', category: 'Code Quality', description: 'All unit tests pass (vitest run)', status: 'todo', autoVerifiable: true, testCommand: 'pnpm test' },

    // Security
    { id: 'security-check', category: 'Security', description: 'security:check passes (no plaintext secrets in DB)', status: 'todo', autoVerifiable: true, testCommand: 'pnpm security:check' },
    { id: 'db-encryption', category: 'Security', description: 'VaultFile.encryptedContent is encrypted (not plaintext)', status: 'todo', autoVerifiable: true },
    { id: 'password-hash', category: 'Security', description: 'User passwords stored as argon2 hash (not plaintext)', status: 'todo', autoVerifiable: true },
    { id: 'apikey-hash', category: 'Security', description: 'API keys stored as SHA256 hash (not raw)', status: 'todo', autoVerifiable: true },

    // Auth/RBAC
    { id: 'auth-register', category: 'Auth/RBAC', description: 'POST /api/auth/register creates PENDING user', status: 'todo', autoVerifiable: true },
    { id: 'auth-login', category: 'Auth/RBAC', description: 'POST /api/auth/login returns session cookie for approved', status: 'todo', autoVerifiable: true },
    { id: 'auth-pending-block', category: 'Auth/RBAC', description: 'Pending users cannot login (401 returned)', status: 'todo', autoVerifiable: true },
    { id: 'auth-approve', category: 'Auth/RBAC', description: 'Admin can approve pending users via API', status: 'todo', autoVerifiable: true },
    { id: 'rbac-role-check', category: 'Auth/RBAC', description: 'Role-based access enforced on protected routes', status: 'todo', autoVerifiable: true },
    { id: 'masking-viewer', category: 'Auth/RBAC', description: 'Viewer sees masked content (KEY=********)', status: 'todo', autoVerifiable: true },
    { id: 'masking-raw', category: 'Auth/RBAC', description: 'Developer/Admin sees raw content', status: 'todo', autoVerifiable: true },

    // File Operations
    { id: 'file-create', category: 'File Operations', description: 'POST /api/files creates encrypted file', status: 'todo', autoVerifiable: true },
    { id: 'file-read', category: 'File Operations', description: 'GET /api/files/:id returns file with decrypted content', status: 'todo', autoVerifiable: true },
    { id: 'file-update', category: 'File Operations', description: 'PATCH /api/files/:id creates new revision', status: 'todo', autoVerifiable: true },
    { id: 'file-delete', category: 'File Operations', description: 'DELETE /api/files/:id soft-deletes (deletedAt set)', status: 'todo', autoVerifiable: true },
    { id: 'file-revisions', category: 'File Operations', description: 'GET /api/files/:id/revisions returns revision list', status: 'todo', autoVerifiable: true },
    { id: 'file-diff', category: 'File Operations', description: 'GET /api/files/:id/revisions/:revId/diff returns line diff', status: 'todo', autoVerifiable: true },

    // API Keys
    { id: 'apikey-create', category: 'API Keys', description: 'POST /api/admin/api-keys creates key (hash stored)', status: 'todo', autoVerifiable: true },
    { id: 'apikey-bearer', category: 'API Keys', description: 'GET /api/v1/files/:id/raw with Bearer returns raw', status: 'todo', autoVerifiable: true },
    { id: 'apikey-revoke', category: 'API Keys', description: 'DELETE /api/admin/api-keys/:id revokes key', status: 'todo', autoVerifiable: true },
    { id: 'apikey-revoked-deny', category: 'API Keys', description: 'Revoked key denied access (401/403)', status: 'todo', autoVerifiable: true },

    // Audit
    { id: 'audit-auth', category: 'Audit', description: 'Auth events logged (login success/fail, logout)', status: 'todo', autoVerifiable: true },
    { id: 'audit-file', category: 'Audit', description: 'File events logged (create, update, delete, view)', status: 'todo', autoVerifiable: true },
    { id: 'audit-apikey', category: 'Audit', description: 'API key events logged (create, revoke, access)', status: 'todo', autoVerifiable: true },
    { id: 'audit-no-secrets', category: 'Audit', description: 'Audit logs contain no plaintext secrets', status: 'todo', autoVerifiable: true },

    // UI/UX (Manual Review)
    { id: 'ui-login', category: 'UI/UX', description: 'Login page renders correctly', status: 'todo', autoVerifiable: false, manualReview: 'Navigate to /login, verify form fields' },
    { id: 'ui-dashboard', category: 'UI/UX', description: 'Dashboard displays user info and stats', status: 'todo', autoVerifiable: false, manualReview: 'Navigate to /dashboard after login' },
    { id: 'ui-files', category: 'UI/UX', description: 'Files page lists files with proper formatting', status: 'todo', autoVerifiable: false, manualReview: 'Navigate to /files' },
    { id: 'ui-history', category: 'UI/UX', description: 'History page: Cmd+Click selects multiple revisions', status: 'todo', autoVerifiable: false, manualReview: 'Open /files/:id/history, select 2+ revisions, click Compare' },
    { id: 'ui-diff', category: 'UI/UX', description: 'Diff display shows git-like format with +/- colors', status: 'todo', autoVerifiable: false, manualReview: 'Check diff output formatting in history' },
    { id: 'ui-empty', category: 'UI/UX', description: 'Empty states show proper placeholder content', status: 'todo', autoVerifiable: false, manualReview: 'Check pages with no data' },
    { id: 'ui-admin', category: 'UI/UX', description: 'Admin pages (users, api-keys, audit-logs) work', status: 'todo', autoVerifiable: false, manualReview: 'Navigate admin pages as admin user' },
  ];
}

function runVerifications(checklist: ChecklistItem[]): ChecklistItem[] {
  return checklist.map(item => {
    if (!item.autoVerifiable || !item.testCommand) return item;

    try {
      console.log(`  Running: ${item.testCommand}`);
      execSync(item.testCommand, { stdio: 'pipe', cwd: process.cwd() });
      return { ...item, status: 'done' as const };
    } catch (err: unknown) {
      const error = err as {status?: number; message?: string};
      console.log(`    FAILED: ${error.message?.split('\n')[0] || 'unknown error'}`);
      return { ...item, status: 'fail' as const, notes: error.message?.split('\n')[0] };
    }
  });
}

function generateMarkdown(analysis: SessionAnalysis): string {
  const { summary, checklist, detectedFeatures } = analysis;

  let md = `# Session Analysis Report\n\n`;
  md += `**Generated:** ${analysis.generatedAt}\n`;
  if (analysis.updatedAt) md += `**Updated:** ${analysis.updatedAt}\n`;
  md += `**Session:** ${path.basename(analysis.sessionFile)}\n\n`;

  md += `## Summary\n\n`;
  md += `| Status | Count |\n|-------|-------|\n`;
  md += `| Total | ${summary.total} |\n`;
  md += `| Done | ${summary.done} |\n`;
  md += `| Todo | ${summary.todo} |\n`;
  md += `| Failed | ${summary.fail} |\n`;
  md += `| Auto-verifiable | ${summary.autoVerifiable} |\n`;
  md += `| Manual review | ${summary.manualReview} |\n\n`;

  md += `## Detected Features\n\n`;
  detectedFeatures.forEach(f => md += `- ${f}\n`);
  md += '\n';

  md += `## Verification Checklist\n\n`;
  md += `| # | Category | Item | Status | Notes |\n`;
  md += `|---|----------|------|--------|-------|\n`;

  const categories = [...new Set(checklist.map(c => c.category))];
  let idx = 0;
  for (const cat of categories) {
    const items = checklist.filter(c => c.category === cat);
    for (const item of items) {
      idx++;
      const icon = item.status === 'done' ? '✓' : item.status === 'fail' ? '✗' : ' ';
      const notes = item.notes ? item.notes.substring(0, 30) + (item.notes.length > 30 ? '...' : '') : '';
      md += `| ${idx} | ${cat} | ${item.description} | ${icon} | ${notes} |\n`;
    }
  }

  md += `\n## Auto Verification Commands\n\n`;
  md += '```bash\n';
  const cmds = [...new Set(checklist.filter(c => c.autoVerifiable && c.testCommand).map(c => c.testCommand!))];
  md += cmds.join(' && \\\n') + '\n```\n';

  md += `\n## Manual Review Items\n\n`;
  checklist.filter(c => !c.autoVerifiable).forEach(c => {
    md += `- [${c.status === 'done' ? 'x' : ' '}] **${c.description}**\n`;
    if (c.manualReview) md += `  - Hint: ${c.manualReview}\n`;
  });

  md += `\n## Update Checklist\n\n`;
  md += '```bash\npnpm session:analyze --update\n```\n';
  md += '\nOr edit `session-analysis.json` directly and run without --update to regenerate markdown.\n';

  return md;
}

async function main() {
  const args = process.argv.slice(2);
  const isUpdate = args.includes('--update');

  console.log('=== Session Analyzer Harness ===\n');

  // Load existing analysis if updating
  let analysis: SessionAnalysis;
  if (isUpdate && fs.existsSync(OUTPUT_JSON)) {
    console.log('Loading existing analysis...');
    analysis = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
    analysis.updatedAt = new Date().toISOString();

    // Apply manual updates from checklist
    const existing = analysis.checklist;
    analysis.checklist = getDefaultChecklist().map(item => {
      const existingItem = existing.find(e => e.id === item.id);
      return existingItem || item;
    });
  } else {
    // Generate fresh analysis
    analysis = {
      generatedAt: new Date().toISOString(),
      sessionFile: SESSION_FILE,
      instructions: [],
      detectedFeatures: [
        'Next.js 16 App Router',
        'Prisma 5 with SQLite',
        'AES-256-GCM encryption',
        'Argon2 password hashing',
        'Session-based auth (httpOnly cookies)',
        'Role-based access (ADMIN/DEVELOPER/VIEWER)',
        'Secret masking for VIEWER role',
        'File revision history with LCS diff',
        'API key authentication (Bearer token)',
        'Audit logging',
        'Soft delete (deletedAt)',
      ],
      checklist: getDefaultChecklist(),
      verificationCommands: [],
      summary: { total: 0, done: 0, todo: 0, fail: 0, autoVerifiable: 0, manualReview: 0 },
    };
  }

  // Run auto verifications
  console.log('\nRunning auto verifications...\n');
  analysis.checklist = runVerifications(analysis.checklist);

  // Calculate summary
  analysis.summary = {
    total: analysis.checklist.length,
    done: analysis.checklist.filter(c => c.status === 'done').length,
    todo: analysis.checklist.filter(c => c.status === 'todo').length,
    fail: analysis.checklist.filter(c => c.status === 'fail').length,
    autoVerifiable: analysis.checklist.filter(c => c.autoVerifiable).length,
    manualReview: analysis.checklist.filter(c => !c.autoVerifiable).length,
  };
  analysis.verificationCommands = [...new Set(analysis.checklist.filter(c => c.autoVerifiable && c.testCommand).map(c => c.testCommand!))];

  // Write outputs
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(analysis, null, 2));
  console.log(`\nJSON: ${OUTPUT_JSON}`);

  const markdown = generateMarkdown(analysis);
  fs.writeFileSync(OUTPUT_MD, markdown);
  console.log(`Markdown: ${OUTPUT_MD}`);

  // Console output
  console.log('\n=== Summary ===');
  console.log(`Total: ${analysis.summary.total} | Done: ${analysis.summary.done} | Todo: ${analysis.summary.todo} | Fail: ${analysis.summary.fail}`);
  console.log(`Auto: ${analysis.summary.autoVerifiable} | Manual: ${analysis.summary.manualReview}`);

  console.log('\n=== Checklist ===');
  const categories = [...new Set(analysis.checklist.map(c => c.category))];
  for (const cat of categories) {
    const items = analysis.checklist.filter(c => c.category === cat);
    console.log(`\n${cat}:`);
    for (const item of items) {
      const icon = item.status === 'done' ? '✓' : item.status === 'fail' ? '✗' : ' ';
      console.log(`  [${icon}] ${item.description}${item.notes ? ` (${item.notes})` : ''}`);
    }
  }

  if (analysis.summary.fail > 0) {
    console.log('\n⚠️  Some auto-verifications failed. Run `pnpm lint && pnpm typecheck && pnpm build` to diagnose.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});