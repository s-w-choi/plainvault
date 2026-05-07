#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DATA_DIR="${PROJECT_DIR}/prisma/data"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_FILE="${DATA_DIR}/vault.db"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file>"
  echo "Available backups:"
  ls -1 "${BACKUP_DIR}"/vault_*.db 2>/dev/null || echo "  (none)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
  if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: $1"
    exit 1
  fi
fi

if ! sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;" | grep -q "ok"; then
  echo "Error: Backup file failed integrity check"
  exit 1
fi

mkdir -p "${DATA_DIR}"

if [ -f "${DB_FILE}" ]; then
  CURRENT_BACKUP="${BACKUP_DIR}/vault_pre_restore_$(date +%Y%m%d_%H%M%S).db"
  echo "Creating safety backup of current DB: ${CURRENT_BACKUP}"
  sqlite3 "${DB_FILE}" ".backup '${CURRENT_BACKUP}'"
fi

echo "Restoring from: ${BACKUP_FILE}"
cp "${BACKUP_FILE}" "${DB_FILE}"

echo "Restore completed: ${DB_FILE}"
echo "Size: $(du -h "${DB_FILE}" | cut -f1)"
