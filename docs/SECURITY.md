# Security Guide

## Overview

Secret Vault implements multiple layers of security to protect sensitive data.

## Encryption

### Content Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **IV**: Random 16 bytes per encryption
- **Salt**: Random 32 bytes per encryption
- **Storage**: Only encrypted content + salt/IV stored in DB

### Encryption Key Management

```
VAULT_ENCRYPTION_KEY must be:
- Exactly 32 bytes
- Base64 encoded
- Stored securely (not in git)
- Backed up separately from DB
```

**WARNING**: Loss of encryption key means permanent data loss. There is no recovery.

## Password Security

- **Algorithm**: Argon2id
- **Configuration**: argon2id variant (memory-hard, resistant to GPU attacks)
- **Storage**: Only hash stored, never plaintext

## API Key Security

- **Length**: 32 random bytes
- **Storage**: SHA-256 hash only (never plaintext)
- **Display**: Prefix only shown after creation
- **Expiry**: Default 90 days
- **Revocation**: Immediate, permanent

## Session Security

- **Cookie**: httpOnly, sameSite=lax
- **Secure**: Controlled by `COOKIE_SECURE` env var (set to `true` for HTTPS)
- **Max Age**: 7 days (configurable via admin settings)
- **Renewal**: On login

## Secret Masking

Viewer role receives masked content where:
- `KEY=value` → `KEY=********`
- `KEY="value"` → `KEY=********`
- `KEY='value'` → `KEY=********`

Masked patterns include:
- API_KEY, TOKEN, SECRET, PASSWORD
- DATABASE_URL, PRIVATE_KEY
- AWS_, AZURE_, GCP_ prefixed vars
- Bearer tokens in headers

## Audit Logging

All significant events are logged:
- Auth: login success/failed, logout, register
- File: create, view, update, delete
- Admin: user approval, role change
- API Key: create, use, revoke

**Never logged**:
- Passwords
- API key values
- File content
- Session tokens

## Network Security

- Internal network only (not for external access)
- Production requires HTTPS or reverse proxy
- API key auth available for scripts

## Input Validation

- File names: No null bytes, no path traversal
- Titles: Max 255 chars
- Content: Max 1MB (configurable)
- Change summaries: Max 500 chars

## XSS Prevention

- Markdown sanitized with allowlist
- No raw HTML rendering
- Links open in new tab with rel="noopener noreferrer"

## Cache Control

Raw content responses include:
```
Cache-Control: no-store
```

## Forbidden Practices

1. **NEVER** commit `.env` with real secrets
2. **NEVER** log sensitive data (console.log)
3. **NEVER** store API keys in localStorage
4. **NEVER** client-side secret masking
5. **NEVER** disable authentication for "convenience"
6. **NEVER** skip audit logging for speed

## Backup Considerations

- Backup encryption key separately from DB
- Test restoration procedures
- Store backups securely
- Encryption key loss = data loss

## Reporting Security Issues

For security issues, contact the development team directly.
