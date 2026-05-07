---
name: release
description: >
  Coordinate release readiness from versioning through rollout checks and rollback
  readiness.
owner: release
scope: release-process
---

# Release Skill

## Trigger

- Before tagging a release
- Before merging release train branches
- Before production rollout or environment cutover

## Scope

- App build configuration and release scripts
- Versioning metadata
- Deployment manifests and runtime environment variables

## Procedure

1. Confirm versioning scheme and changelog are updated.
2. Run full project checks (build, tests, typecheck, lint).
3. Validate deployment health checks in a staging path.
4. Confirm rollback plan and owner rotation for release window.

## Commands

```bash
pnpm install
pnpm --filter @plainvault/app lint
pnpm --filter @plainvault/app typecheck
pnpm --filter @plainvault/app test
pnpm --filter @plainvault/app build
```

## Acceptance

- Build and tests pass for release-relevant packages
- Deployment checklist and rollback trigger are documented
- No unresolved "must-fix" issues remain in release notes
