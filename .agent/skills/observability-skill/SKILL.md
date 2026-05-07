---
name: observability
description: >
  Track audit/event logs, error signals, and operational events to detect
  suspicious behavior early.
owner: operations
scope: monitoring
---

# Observability Skill

## Trigger

- Audit log schema changes
- Error-handling refactors
- Deployment/infrastructure updates

## Checklist

- Ensure required event fields (`eventType`, `actor`, `target`, `success`) remain present
- Verify logs do not leak secrets
- Review security warning/retry/block signals
- Confirm log visibility after backup/restore and DB file updates

## Commands

```bash
pnpm --filter @plainvault/app security:check
pnpm --filter @plainvault/app test
```

## Output

- Security/operations anomaly checklist
- Suggested recurring review items (`daily/weekly`)
