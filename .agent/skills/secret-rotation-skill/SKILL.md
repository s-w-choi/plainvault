---
name: secret-rotation
description: >
  Standardize secret lifecycle operations for MASTER_KEY, session keys, and API
  secrets across code, CI, and deployment targets.
owner: security-ops
scope: secret-lifecycle
---

# Secret Rotation Skill

## Trigger

- Secret policy changes (`.env`, CI variables, vault/secret store updates)
- Token/session/crypto pipeline changes
- API key issuance or revocation workflow changes

## Scope

- `.env*`, deployment secrets, and CI environment variables
- Encryption/session configuration paths
- API key issue/revoke routines

## Procedure

1. Refresh key usage inventory (code, scripts, docs)
2. Define issuance/revocation sequence and rollback path
3. Test data compatibility after rotation (decrypt/encrypt behavior)
4. Re-check logs/audit for masked secret leakage or stale keys

## Commands

```bash
pnpm --filter @plainvault/app security:check
pnpm --filter @plainvault/app test
pnpm --filter @plainvault/app db:seed
```

## Acceptance

- Legacy-key compatibility is preserved when required for migration paths
- Revoked keys/tokens are immediately invalidated and reflected in audit logs
