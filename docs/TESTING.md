# Testing Guide

## Test Types

### Unit Tests

Located in `tests/unit/`, run with `pnpm test`.

```bash
# Run all unit tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

**Coverage scope:**
- Encryption/decryption
- Content masking
- Diff computation
- Input validation
- KST time formatting

### Smoke Tests

HTTP API tests against live dev server.

```bash
# Start dev server first
pnpm dev

# In another terminal
pnpm smoke
```

Tests auth, file CRUD, API key operations.

### Harness

Full integration test with isolated test DB.

```bash
pnpm harness
```

Creates test users, files, verifies encryption, masking, audit logs.

### Security Checks

Verifies no plaintext secrets in DB.

```bash
pnpm security:check
```

## Manual QA Checklist

### Auth
- [ ] Registration creates PENDING user
- [ ] Pending users cannot login
- [ ] Admin can approve users
- [ ] Login failure logged

### Files
- [ ] Admin/Developer can create files
- [ ] Developer cannot delete files
- [ ] Admin can soft delete files
- [ ] Deleted files hidden from list

### Masking
- [ ] Viewer sees `KEY=********`
- [ ] Viewer response has no raw content
- [ ] Admin sees full content

### Diff
- [ ] Revision 1 created on file create
- [ ] New revision on update
- [ ] Diff shows added/removed lines
- [ ] Viewer cannot see diff

### API Keys
- [ ] Admin can create API key
- [ ] Key shown only once
- [ ] Raw file works with valid key
- [ ] Expired key rejected
- [ ] Revoked key rejected

### Audit Logs
- [ ] Login events logged
- [ ] File events logged
- [ ] API key events logged
- [ ] No secrets in logs

## Debugging

### View DB
```bash
pnpm db:studio
```

### Check Logs
Dev server console output includes:
- Auth events
- File operations
- Errors

### Verify Encryption
```bash
# Check DB directly
sqlite3 data/vault.db "SELECT encryptedContent FROM VaultFile"

# Should be base64, not plaintext
```

## Test Fixtures

Fixtures use fake values only:
- `TEST_API_KEY=sk_fake...`
- `TEST_DATABASE_URL=postgresql://fake...`
- `TEST_PASSWORD=fake123`

Never use real production secrets in tests.
