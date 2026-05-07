---
name: ops
description: >
  Standardize operational routines (backup, restore, local startup, DB
  initialization) and reduce recovery time.
owner: operations
scope: runbook
---

# Operations Skill

## Trigger

- Pre/post deployment checks
- Backup/restore drills
- Docker/compose changes

## Commands

```bash
pnpm --filter @plainvault/app db:migrate
pnpm --filter @plainvault/app db:seed
pnpm --filter @plainvault/app db:studio
./scripts/backup.sh
./scripts/restore.sh <backupfile>
docker-compose up -d
```

## Acceptance

- After migration/seed, baseline accounts and roles work correctly
- Backups restore successfully with key tables present
- Service responds on health endpoint after startup
