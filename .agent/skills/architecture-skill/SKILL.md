---
name: architecture
description: >
  Keep module boundaries clean in the monorepo and control blast radius during
  migrations and refactors.
owner: architecture
scope: monorepo
---

# Architecture Skill

## Trigger

- `apps/app/src` and `src/` overlap or duplication is introduced
- Package boundary changes (`packages/ui`, `packages/shared`, etc.)
- Major `prisma/schema.prisma` edits

## Scope

- `apps/app/src/**`
- `packages/ui`, `packages/shared`
- `prisma/schema.prisma`
- `vitest.config.ts`, `tsconfig`, `next.config.ts`

## Procedure

1. Define the boundary and impact for each change (domain/service/route/util).
2. Validate import paths and aliases from the source graph.
3. Select cleanup path:
   - remove duplicate files
   - re-point imports
   - extract to shared package
4. Run validation suite to confirm runtime behavior.

## Checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter @plainvault/app test`
- `pnpm --filter @plainvault/app harness`

## Acceptance

- Architecture change proposal includes stability/risk and rollback plan
- No broken imports or missing references after refactor
