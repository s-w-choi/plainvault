#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DATA_DIR="${PROJECT_DIR}/prisma/data"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="${DATA_DIR}/vault.db"
BACKUP_FILE="${BACKUP_DIR}/vault_${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${DB_FILE}" ]; then
  echo "Error: Database file not found at ${DB_FILE}"
  exit 1
fi

echo "Creating backup: ${BACKUP_FILE}"
sqlite3 "${DB_FILE}" ".backup '${BACKUP_FILE}'"

echo "Backup completed: ${BACKUP_FILE}"
echo "Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

ls -t "${BACKUP_DIR}"/vault_*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
echo "Cleanup: retained last 10 backups"
