#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/prisma/data}"
KEY_FILE="$DATA_DIR/.vault_key"

# Set default DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/prisma/data/vault.db"
fi

# If VAULT_ENCRYPTION_KEY is already set (user-provided), skip generation
if [ -n "$VAULT_ENCRYPTION_KEY" ]; then
  echo "VAULT_ENCRYPTION_KEY: using provided environment variable"
else
  # Try to load existing key from persistent volume
  if [ -f "$KEY_FILE" ]; then
    export VAULT_ENCRYPTION_KEY
    VAULT_ENCRYPTION_KEY=$(cat "$KEY_FILE")
    echo "VAULT_ENCRYPTION_KEY: loaded from $KEY_FILE"
  else
    # Generate a new key on first run
    echo "VAULT_ENCRYPTION_KEY: generating new key..."
    VAULT_ENCRYPTION_KEY=$(openssl rand -base64 32)
    export VAULT_ENCRYPTION_KEY
    mkdir -p "$DATA_DIR"
    echo "$VAULT_ENCRYPTION_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    echo "VAULT_ENCRYPTION_KEY: saved to $KEY_FILE"
  fi
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed initial data (idempotent — skips if admin already exists)
echo "Seeding initial data..."
npx tsx prisma/seed.ts

echo "Starting application..."
exec "$@"
