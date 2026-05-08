# Secret/Markdown Vault

Internal network-only Secret and Markdown Vault for managing .env files, configuration documents, and markdown files with encrypted storage and role-based access control.

## Features

- **Authentication**: Email/password login with admin approval workflow
- **Role-Based Access Control**: Admin, Developer, Viewer roles
- **Encrypted Storage**: File content encrypted with AES-256-GCM before DB storage
- **Secret Masking**: Viewers see masked content (e.g., `KEY=********`)
- **Revision History**: Full file revision tracking with diff
- **API Keys**: Bearer token authentication for script/curl access to raw files
- **Audit Logging**: Complete audit trail for all operations
- **GitLab-like UI**: Calm white theme, table-centric layout

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite via Prisma ORM
- **UI**: React + Tailwind CSS
- **Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Password Hashing**: bcrypt
- **Markdown Rendering**: marked + sanitize-html

## Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm db:migrate

# Create initial admin user
pnpm db:seed

# Start development server
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL="file:./data/vault.db"
SESSION_SECRET="replace-with-random-session-secret-min-32-chars"
VAULT_ENCRYPTION_KEY="replace-with-32-byte-base64-encoded-key"
APP_BASE_URL="http://localhost:13000"
NODE_ENV="development"
DEFAULT_API_KEY_TTL_DAYS="90"
MAX_FILE_CONTENT_BYTES="1048576"
```

### Generating Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Warning**: Store this key securely. Loss means permanent data loss.

## Default Users (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@internal.local | admin123 | ADMIN |
| developer@internal.local | dev123 | DEVELOPER |
| viewer@internal.local | viewer123 | VIEWER |
| pending@internal.local | viewer123 | PENDING |

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript check
pnpm test         # Run unit tests
pnpm db:migrate   # Run Prisma migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Run seed script
pnpm smoke        # Run smoke tests (requires dev server)
pnpm harness      # Run integration harness
pnpm security:check # Run security checks
```

## UI Theme

- White/light gray background
- Gray borders and muted text
- Indigo/blue primary accent
- Table-centric information display
- Clear focus states
- No gradients or flashy animations

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [DEVELOPMENT.md](DEVELOPMENT.md) - Dev workflow
- [TESTING.md](TESTING.md) - Testing guide
- [SECURITY.md](SECURITY.md) - Security measures
- [API.md](API.md) - API documentation
- [AGENTS.md](AGENTS.md) - Agent workflow guide
