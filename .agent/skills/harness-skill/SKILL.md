---
name: harness
description: >
  Run session analyzer and integration harness checks, then keep results
  aligned with the current change set.
owner: validation
scope: verification
---

# Harness Skill

## Trigger

- Large or security-related change completed
- Quick post-change state check is needed
- PR evidence should include checklist output

## Commands

```bash
# Generate session analysis (root run)
pnpm --filter @plainvault/app tsx .agent/harnesses/session-analyzer.ts

# Update checklist notes and regenerate
pnpm --filter @plainvault/app tsx .agent/harnesses/session-analyzer.ts --update

# Run app integration harness
pnpm --filter @plainvault/app harness
```

## Inputs

- `.agent/harnesses/session-analyzer.ts`
- `.agent/harnesses/session-analyzer.json`
- `session-analysis.json` / `session-analysis.md` (or the `.agent` equivalents)
- `scripts/harness.ts`

## Outputs

- `.agent/harnesses/session-analysis.json`
- `.agent/harnesses/session-analysis.md`

## Acceptance Criteria

- Executable checklist items are marked `done/fail/todo`
- Manual review items have explicit `done/todo` states and reason
- Skipped regression checks have `not-run: <reason>`

## Risks / Notes

- Output path depends on run location because the analyzer defaults to
  `./session-analysis.*`; standardize command location in the team.
