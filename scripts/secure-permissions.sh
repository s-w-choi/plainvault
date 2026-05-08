#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Setting secure file permissions..."

# Environment files
for envfile in "${PROJECT_DIR}"/.env*; do
  if [ -f "$envfile" ]; then
    chmod 600 "$envfile"
    echo "  chmod 600 $envfile"
  fi
done

# Database files
for dbfile in "${PROJECT_DIR}/prisma/data"/vault.db*; do
  if [ -f "$dbfile" ]; then
    chmod 600 "$dbfile"
    echo "  chmod 600 $dbfile"
  fi
done

# Backup directory
if [ -d "${PROJECT_DIR}/backups" ]; then
  chmod 700 "${PROJECT_DIR}/backups"
  echo "  chmod 700 ${PROJECT_DIR}/backups"
fi

# Backup files
for backupfile in "${PROJECT_DIR}/backups"/vault_*.db; do
  if [ -f "$backupfile" ]; then
    chmod 600 "$backupfile"
    echo "  chmod 600 $backupfile"
  fi
done

echo "Done. Sensitive files are now owner-only readable."