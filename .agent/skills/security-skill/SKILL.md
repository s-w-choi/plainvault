---
name: security
description: >
  Check security-sensitive changes (auth, encryption, sessions, API keys, and
  audit logging) for regression risk before merge.
owner: security
scope: core-service
---

# Security Skill

## Trigger

- Authentication, session, authorization, encryption, audit-log, and API key
  related files changed
- Touching paths like `withAuth`, `auth-handler`, `crypto`, `masking`,
  `audit-log`, or `api-key`

## Scope

- `apps/app/src/lib/crypto/encryption.ts`
- `apps/app/src/lib/auth/*`
- `apps/app/src/lib/api-keys/*`
- `apps/app/src/lib/audit/*`
- `apps/app/src/lib/masking/*`
- `apps/app/src/middleware.ts`
- `apps/app/src/app/api/**/route.ts`
- DB schema changes (`prisma/schema.prisma`)

## Checks

1. Encryption path check
   - Verify no plaintext persistence in `encryptedContent`, API key hash fields, or password hashes
   - Confirm Salt/IV/Tag/PBKDF2 flow remains intact
2. Authorization checks
   - Confirm role/state gates (`admin`, `developer`, `viewer`, `PENDING`) are enforced
   - Verify API key scope (example `files:read_raw`) is required and validated
3. Audit logging
   - Ensure success/failure events exist for login/file/API-key flows
   - Verify masked values remain masked in audit metadata
4. Cookie/session
   - Confirm `httpOnly`, `sameSite`, `secure` settings are preserved where applicable
   - Verify CSRF scope and middleware coverage for sensitive routes

## Suggested Commands

```bash
pnpm --filter @plainvault/app lint
pnpm --filter @plainvault/app typecheck
pnpm --filter @plainvault/app test
pnpm --filter @plainvault/app security:check
```

## Acceptance

- Block merge if any security regression fails
- Pair with integration harness or manual security scenarios for auth/zones (`401/403`)
