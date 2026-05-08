#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/prisma/data}"
KEY_FILE="$DATA_DIR/.vault_key"

# If VAULT_ENCRYPTION_KEY is already set (user-provided), skip generation
if [ -n "$VAULT_ENCRYPTION_KEY" ]; then
  echo "VAULT_ENCRYPTION_KEY: using provided environment variable"
  exec "$@"
fi

# Try to load existing key from persistent volume
if [ -f "$KEY_FILE" ]; then
  export VAULT_ENCRYPTION_KEY
  VAULT_ENCRYPTION_KEY=$(cat "$KEY_FILE")
  echo "VAULT_ENCRYPTION_KEY: loaded from $KEY_FILE"
  exec "$@"
fi

# Generate a new key on first run
echo "VAULT_ENCRYPTION_KEY: generating new key..."
VAULT_ENCRYPTION_KEY=$(openssl rand -base64 32)
export VAULT_ENCRYPTION_KEY
mkdir -p "$DATA_DIR"
echo "$VAULT_ENCRYPTION_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"
echo "VAULT_ENCRYPTION_KEY: saved to $KEY_FILE"

exec "$@"
