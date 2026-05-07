---
name: qa
description: >
  Run prioritized quality gates and classify failures into deterministic
  remediation paths.
owner: quality
scope: end-to-end
---

# QA Skill

## Trigger

- After feature or auth/security changes
- Before merge/deploy
- App changes across `apps/app` and `apps/web`

## Command Sequence

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm --filter @plainvault/app security:check
pnpm --filter @plainvault/app smoke
pnpm --filter @plainvault/app smoke:e2e
```

## Failure Classification

- **RED**: type/lint/build/security blockers
- **YELLOW**: feature-spec failures requiring focused regression scope
- **BLUE**: unresolved manual verification (UX/a11y/docs)

## Output

- Test failure summary with stack traces
- Reproduction commands and narrowed regression scope
- Priority action list (top 3)
