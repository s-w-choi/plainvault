---
name: docs
description: >
  Keep README, audits, and operational checklists synchronized with code changes.
owner: documentation
scope: docs
---

# Docs Skill

## Trigger

- Feature additions/removals
- Significant documentation touchpoints change
- `remaining-audit-items.md` status changes
- Security policy or command workflow updates

## Scope

- `README.md`, `docs/*`
- `.agent/tasks/remaining-audit-items.md`
- `session-analysis.md` outputs (or harness outputs)
- Related changelog/notes files

## Procedure

1. Group updates by document target.
2. Remove stale claims and align instructions with current scripts.
3. Verify cross-references and links remain valid.

## Acceptance

- Run instructions in README and docs match actual scripts
- Audit/task lists are up-to-date
- No broken docs links
