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
chmod 700 "${BACKUP_DIR}"

if [ ! -f "${DB_FILE}" ]; then
  echo "Error: Database file not found at ${DB_FILE}"
  exit 1
fi

echo "Creating backup: ${BACKUP_FILE}"
sqlite3 "${DB_FILE}" ".backup '${BACKUP_FILE}'"
chmod 600 "${BACKUP_FILE}"

# Encrypt backup if GPG is available
if command -v gpg &>/dev/null && [ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
  echo "Encrypting backup..."
  gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase "${BACKUP_ENCRYPTION_PASSPHRASE}" "${BACKUP_FILE}"
  rm -f "${BACKUP_FILE}"
  BACKUP_FILE="${BACKUP_FILE}.gpg"
  chmod 600 "${BACKUP_FILE}"
  echo "Encrypted backup: ${BACKUP_FILE}"
elif command -v gpg &>/dev/null; then
  echo "WARNING: BACKUP_ENCRYPTION_PASSPHRASE not set, backup is UNENCRYPTED"
else
  echo "WARNING: GPG not available, backup is UNENCRYPTED"
fi

echo "Backup completed: ${BACKUP_FILE}"
echo "Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

ls -t "${BACKUP_DIR}"/vault_*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
ls -t "${BACKUP_DIR}"/vault_*.db.gpg 2>/dev/null | tail -n +11 | xargs -r rm -f
echo "Cleanup: retained last 10 backups"
