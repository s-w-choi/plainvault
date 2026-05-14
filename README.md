# PlainVault

> Store secrets, configs, and secure team notes — without the complexity.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

---

## What is PlainVault?

<p align="center">
  <img src="public/logo.png" alt="PlainVault" width="200" />
</p>
PlainVault is a clean internal vault for teams to store and share sensitive information — credentials, API keys, environment configs, and secure notes — in one organized, audited place.

**Use cases:**

- Database connection strings and credentials
- Third-party API keys
- Environment variable files (`.env`, `config.yaml`)
- SSL certificates and private keys
- Team notes with sensitive information

---

## Features

### Encryption at Rest

All file content is encrypted with **AES-256-GCM** before being stored. Each file uses a unique salt and IV derived from a master key via **PBKDF2** (100,000 iterations). Even if the database is compromised, content cannot be read without the encryption key.

### Role-Based Access Control

| Feature                  | ADMIN | DEVELOPER | VIEWER |
| ------------------------ | :---: | :-------: | :----: |
| View raw content         |   ✓   |     ✓     |   —    |
| View masked content      |   ✓   |     ✓     |   ✓    |
| Create / edit files      |   ✓   |     ✓     |   —    |
| Delete files             |   ✓   |     —     |   —    |
| Manage categories        |   ✓   |     —     |   —    |
| Approve / reject users   |   ✓   |     —     |   —    |
| Create / revoke API keys |   ✓   |     —     |   —    |
| View audit logs          |   ✓   |     —     |   —    |
| View revision history    |   ✓   |     ✓     |   —    |

### Version History

Every file edit creates a revision. Browse past versions, compare diffs, and restore previous content.

### Categories

Organize files by environment, service, or team with color-coded labels.

### Audit Trail

Every action — file access, creation, modification, login — is logged for compliance and security reviews.

### API Keys

Programmatic access to files via bearer token authentication for CI/CD pipelines and integrations.

The public API is versioned under `/api/v1/`.

```bash
# List files
curl -H "Authorization: Bearer secvault_xxxxxxxxxxxxxxxxxx" \
  http://localhost:13000/api/v1/files

# Get file content
curl -H "Authorization: Bearer secvault_xxxxxxxxxxxxxxxxxx" \
  http://localhost:13000/api/v1/files/{id}

# Get raw file content (requires files:read_raw scope)
curl -H "Authorization: Bearer secvault_xxxxxxxxxxxxxxxxxx" \
  http://localhost:13000/api/v1/files/{id}/raw
```

Available API key scopes: `files:read`, `files:write`, `files:read_raw`.

---

## Architecture

```
plainvault/
├── apps/
│   ├── app/        Main service (Next.js, port 13000)
│   └── web/        Landing page (Next.js, port 13001)
├── packages/
│   ├── ui/         Shared UI component library
│   └── shared/     Shared utility libraries
└── docker/         Docker configs
```

### Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Framework  | Next.js 16 (App Router)        |
| Language   | TypeScript                     |
| Database   | SQLite via Prisma              |
| Encryption | Node.js `crypto` (AES-256-GCM) |
| Testing    | Vitest + Playwright            |

---

## Getting Started

### Docker (recommended)

```bash
docker compose up -d
```

This starts both services:

| Service | Port | Description |
|---------|------|-------------|
| **App** | [localhost:13000](http://localhost:13000) | Main vault service |
| **Web** | [localhost:13001](http://localhost:13001) | Landing page |

On first run, Docker automatically:
- Generates an encryption key and persists it in a Docker volume
- Runs database migrations
- Creates the default admin account

Log in with:

- **Email:** `admin@plainvault.local`
- **Password:** `plainvault-admin`

> **Important:** Change the admin password after first login via Account settings.

#### Custom configuration

Override environment variables in `docker-compose.yml`:

```yaml
environment:
  - INIT_ADMIN_EMAIL=you@example.com
  - INIT_ADMIN_PASSWORD=your-secure-password
  - VAULT_ENCRYPTION_KEY=your-base64-encoded-32-byte-key  # Optional — auto-generated if omitted
```

Data persists in the `vault-data` Docker volume across container restarts.

---

## Security Model

**VIEWER role** sees masked content — sensitive patterns like `KEY=value` are redacted:

```
# Raw (DEVELOPER / ADMIN)
DATABASE_URL=postgres://user:secret123@db.example.com:5432
API_KEY=secvault_abcdef123456

# Masked (VIEWER)
DATABASE_URL=********
API_KEY=********
```

**API keys** are hashed with SHA-256 before storage (never stored in plain text).

---

## License

MIT © PlainVault Team
