---
name: prisma-audit
description: >
  Validate Prisma schema and migration changes before runtime and test drift
  affects production behavior.
owner: data-layer
scope: db-migration
---

# Prisma Audit Skill

## Trigger

- `prisma/schema.prisma` updates
- Migration add/remove/rename
- Database adapter changes

## Checks

- Migration SQL is consistent with ORM model
- Required indexes and foreign-key constraints exist
- Schema changes are reflected in `db:migrate` and `prisma generate`
- Soft-delete and cascade policy align with app behavior

## Commands

```bash
pnpm --filter @plainvault/app prisma:generate
pnpm --filter @plainvault/app db:migrate
pnpm --filter @plainvault/app test
pnpm --filter @plainvault/app harness
```

## Acceptance

- Migrations apply without unexpected drift or warnings
- Backward-compatible behavior is validated for existing flows
