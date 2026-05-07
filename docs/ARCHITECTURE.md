# Architecture

## Overview

Secret Vault is an internal network-only web application for managing encrypted secrets and markdown documents with role-based access control.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   /login │  │/register │  │/dashboard│  │  /files  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  /admin  │  │ /api/*   │  │/api/v1/* │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Auth       │  │ Vault Files │  │ Audit Logs │           │
│  │ Service    │  │ Service     │  │ Service    │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ API Key    │  │ Encryption │  │ Masking    │           │
│  │ Service    │  │ Service    │  │ Service    │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM + SQLite                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
User → Login Form → POST /api/auth/login
                            │
                            ▼
                    ┌───────────────┐
                    │ Verify bcrypt │
                    │ password hash │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Set httpOnly  │
                    │ session cookie│
                    └───────────────┘
                            │
                            ▼
                      Dashboard
```

### File Encryption Flow

```
User → File Editor → PATCH /api/files/:id
                              │
                              ▼
                      ┌───────────────┐
                      │ Encrypt with  │
                      │ AES-256-GCM  │
                      │ + PBKDF2     │
                      └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ Store SHA256  │
                      │ hash for      │
                      │ integrity     │
                      └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ Save to DB   │
                      └───────────────┘
```

### Viewer Masking Flow

```
User (viewer) → GET /api/files/:id
                            │
                            ▼
                    ┌───────────────┐
                    │ Check role    │
                    │ = VIEWER      │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Decrypt from  │
                    │ DB            │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Mask secrets │
                    │ server-side  │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Return masked │
                    │ content ONLY  │
                    └───────────────┘
```

### API Key Raw Access Flow

```
Script → GET /api/v1/files/:id/raw
         Authorization: Bearer <API_KEY>
                              │
                              ▼
                    ┌───────────────┐
                    │ Hash incoming │
                    │ API key       │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Lookup hash   │
                    │ in DB         │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Check status  │
                    │ not revoked   │
                    │ not expired   │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Decrypt file  │
                    │ content       │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Set Cache:   │
                    │ no-store     │
                    └───────────────┘
```

## Module Responsibilities

### `/src/lib/auth/auth.ts`
- Session cookie management
- Password hashing/verification via bcrypt
- Authentication helpers (requireAuth, requireRole)

### `/src/lib/crypto/encryption.ts`
- AES-256-GCM encryption/decryption
- PBKDF2 key derivation for additional security
- SHA-256 content hashing for integrity

### `/src/lib/masking/masking.ts`
- Pattern-based secret detection
- Key=value line masking
- General content sanitization

### `/src/lib/audit/audit-log.ts`
- Audit event logging to DB
- Safe metadata extraction (no secrets)
- KST timezone handling

### `/src/lib/diff/diff.ts`
- Line-by-line diff computation
- Longest Common Subsequence algorithm
- Added/removed/unchanged line tracking

### `/src/lib/api-keys/api-key.ts`
- API key generation (random bytes)
- SHA-256 hash storage
- Expiry/revocation management

## Database Schema

### User
- id, name, email, passwordHash, role, status
- createdAt, updatedAt, lastLoginAt
- Relations: vaultFiles, apiKeys, auditLogs

### VaultFile
- id, title, actualFileName, encryptedContent, contentSha256
- contentType, createdById, updatedById
- createdAt, updatedAt, deletedAt
- Relations: revisions, createdBy, updatedBy

### FileRevision
- id, fileId, revisionNumber
- encryptedContentBefore, encryptedContentAfter
- contentSha256Before, contentSha256After
- changeSummary, changedById, changedAt
- Relations: file, changedBy

### AuditLog
- id, eventType, actorType, actorId
- targetType, targetId, ipAddress, userAgent
- metadataJson, success, failureReason, createdAt

### ApiKey
- id, name, keyPrefix, keyHash
- scopesJson, status, createdById
- createdAt, expiresAt, lastUsedAt
- revokedById, revokedAt
- Relations: createdBy, revokedBy

## Security Measures

1. **Content Encryption**: AES-256-GCM with PBKDF2-derived keys
2. **Password Hashing**: bcrypt with high iteration count
3. **API Key Hashing**: SHA-256 one-way hash
4. **Session Security**: httpOnly, sameSite, secure cookies
5. **Secret Masking**: Server-side masking for viewer role
6. **Audit Logging**: Complete operation tracking
7. **No Plaintext Storage**: Content never stored unencrypted
8. **Cache Control**: Raw responses marked no-store

## Future Extension Points

- Google Workspace SSO integration
- Slack approval notifications
- Per-file ACL granularity
- Secret expiration notifications
- Git backup integration
- Webhook support
- Per-API-key scopes
