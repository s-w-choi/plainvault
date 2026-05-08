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
  { ls -1 "${BACKUP_DIR}"/vault_*.db 2>/dev/null || echo "  (none)"; } && { ls -1 "${BACKUP_DIR}"/vault_*.db.gpg 2>/dev/null | sed 's/$/ (encrypted)/' || true; }
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

# Handle encrypted backups
if [[ "${BACKUP_FILE}" == *.gpg ]]; then
  if ! command -v gpg &>/dev/null; then
    echo "Error: GPG is required to restore encrypted backups"
    exit 1
  fi
  if [ -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
    echo "Error: BACKUP_ENCRYPTION_PASSPHRASE is required to restore encrypted backups"
    exit 1
  fi
  DECRYPTED_FILE="${BACKUP_FILE%.gpg}"
  echo "Decrypting backup..."
  gpg --batch --yes --decrypt --passphrase "${BACKUP_ENCRYPTION_PASSPHRASE}" -o "${DECRYPTED_FILE}" "${BACKUP_FILE}"
  BACKUP_FILE="${DECRYPTED_FILE}"
  trap "rm -f '${DECRYPTED_FILE}'" EXIT
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
