---
name: dependency-upgrade
description: >
  Manage dependency lifecycle updates with minimal risk by validating lockfile
  changes, compatibility, and security impact.
owner: engineering
scope: dependency-management
---

# Dependency Upgrade Skill

## Trigger

- `package.json`, lockfiles (`pnpm-lock.yaml`) or package manager configuration changes
- Renovate/Security team requests for library version upgrades
- Runtime failures suspected from transitive dependency drift

## Scope

- `package.json`
- `pnpm-lock.yaml`
- Docker base images and CI-installed package tooling

## Procedure

1. Identify dependency impact surface and risk class (minor/major).
2. Regenerate lockfile deterministically from a clean install.
3. Run targeted checks (lint, typecheck, tests) before full test sweep.
4. Verify release/runtime compatibility for changed major APIs.
5. Record migration notes for manual action items.

## Commands

```bash
pnpm install
pnpm --filter @plainvault/app lint
pnpm --filter @plainvault/app typecheck
pnpm --filter @plainvault/app test
pnpm audit --audit-level high
```

## Acceptance

- Dependency graph changes are intentional and documented
- No unexpected breakage from typecheck/lint/test
- Security posture is reviewed for newly introduced versions
