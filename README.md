# PlainVault

<p align="center">
  <img src="public/logo.png" alt="PlainVault" width="48" />
</p>

> Store secrets, configs, and secure team notes — without the complexity.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

---

## What is PlainVault?

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

| Feature | ADMIN | DEVELOPER | VIEWER |
|---|:-:|:-:|:-:|
| View raw content | ✓ | ✓ | — |
| View masked content | ✓ | ✓ | ✓ |
| Create / edit files | ✓ | ✓ | — |
| Delete files | ✓ | — | — |
| Manage categories | ✓ | — | — |
| Approve / reject users | ✓ | — | — |
| Create / revoke API keys | ✓ | — | — |
| View audit logs | ✓ | — | — |
| View revision history | ✓ | ✓ | — |

### Version History
Every file edit creates a revision. Browse past versions, compare diffs, and restore previous content.

### Categories
Organize files by environment, service, or team with color-coded labels.

### Audit Trail
Every action — file access, creation, modification, login — is logged for compliance and security reviews.

### API Keys
Programmatic access to files via bearer token authentication for CI/CD pipelines and integrations.

```bash
Authorization: Bearer sk_test_xxxx
```

---

## Architecture

```
plainvault/
├── apps/
│   ├── app/        Main service (Next.js, port 3000)
│   └── web/        Landing page (Next.js, port 3001)
├── packages/
│   ├── ui/         Shared UI component library
│   └── shared/     Shared utility libraries
└── docker/         Docker configs
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma |
| Encryption | Node.js `crypto` (AES-256-GCM) |
| Testing | Vitest + Playwright |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

```bash
# Clone and install
make install

# Start dev servers (app@3000, web@3001)
make run
```

Visit [http://localhost:3000](http://localhost:3000) and log in with:

- **Email:** `admin@plainvault.local`
- **Password:** `plainvault-admin`

---

## Security Model

**VIEWER role** sees masked content — sensitive patterns like `KEY=value` are redacted:

```
# Raw (DEVELOPER / ADMIN)
DATABASE_URL=postgres://user:secret123@db.example.com:5432
API_KEY=sk_live_abcdef123456

# Masked (VIEWER)
DATABASE_URL=********
API_KEY=********
```

**API keys** are hashed with SHA-256 before storage (never stored in plain text).

---

## License

MIT © PlainVault Team
