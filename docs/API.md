# API Documentation

## Base URL

```
http://localhost:13000/api
```

## Authentication

All API routes (except `/api/auth/login` and `/api/auth/register`) require session authentication via cookie.

Admin routes additionally require `role: ADMIN` in session.

## Auth APIs

### POST /api/auth/register

Register a new user (pending approval).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secretpassword"
}
```

**Response:**
```json
{ "message": "Registration request submitted. Please wait for admin approval." }
```

### POST /api/auth/login

Login with email and password.

**Request:**
```json
{
  "email": "admin@internal.local",
  "password": "admin123"
}
```

**Response:**
```json
{ "message": "Login successful" }
```
Sets `session_user_id`, `session_role`, `session_status` cookies.

### POST /api/auth/logout

Logout and clear session.

**Response:**
```json
{ "message": "Logged out" }
```

### GET /api/auth/me

Get current session user info.

**Response:**
```json
{
  "userId": "uuid",
  "email": "admin@internal.local",
  "name": "Admin User",
  "role": "ADMIN",
  "status": "APPROVED"
}
```

## File APIs

### GET /api/files

List all non-deleted files.

**Response:**
```json
{
  "files": [{
    "id": "uuid",
    "title": "Production .env",
    "actualFileName": ".env.production",
    "contentType": "env",
    "createdBy": { "email": "dev@example.com" },
    "updatedBy": { "email": "dev@example.com" },
    "createdAt": "2026-05-06T00:00:00.000Z",
    "updatedAt": "2026-05-06T00:00:00.000Z"
  }]
}
```

### POST /api/files

Create a new file. Admin/Developer only.

**Request:**
```json
{
  "title": "Production .env",
  "actualFileName": ".env.production",
  "contentType": "env",
  "content": "DATABASE_URL=..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "File created"
}
```

### GET /api/files/:id

Get file details.

- **Admin/Developer**: Returns raw content
- **Viewer**: Returns masked content

**Response:**
```json
{
  "id": "uuid",
  "title": "Production .env",
  "actualFileName": ".env.production",
  "contentType": "env",
  "content": "DATABASE_URL=...",
  "contentSha256": "sha256hash",
  "createdBy": { "name": "Dev", "email": "dev@example.com" },
  "updatedBy": { "name": "Dev", "email": "dev@example.com" },
  "createdAt": "2026-05-06T00:00:00.000Z",
  "updatedAtKst": "2026-05-06 09:00:00"
}
```

### PATCH /api/files/:id

Update file content. Admin/Developer only.

**Request:**
```json
{
  "content": "UPDATED_CONTENT",
  "changeSummary": "Updated DATABASE_URL"
}
```

### DELETE /api/files/:id

Soft delete file. Admin only.

### GET /api/files/:id/revisions

List revision history. Admin/Developer only.

### GET /api/files/:id/revisions/:revisionId

Get specific revision.

### GET /api/files/:id/revisions/:revisionId/diff

Get diff between revisions. Admin/Developer only.

## Admin APIs

### GET /api/admin/users

List all users. Admin only.

Query params: `?status=PENDING|APPROVED|REJECTED|DISABLED`

### POST /api/admin/users/:id/approve

Approve pending user. Admin only.

### POST /api/admin/users/:id/reject

Reject user. Admin only.

### PATCH /api/admin/users/:id

Update user role or status. Admin only.

**Request:**
```json
{
  "role": "DEVELOPER",
  "status": "DISABLED"
}
```

### GET /api/admin/api-keys

List API keys. Admin only.

### POST /api/admin/api-keys

Create new API key. Admin only.

**Request:**
```json
{
  "name": "Production Script Key",
  "expiresInDays": 90
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Production Script Key",
  "keyPrefix": "secvault_abc123",
  "key": "secvault_abc123xyz...",  // Only shown once!
  "expiresAt": "2026-08-06T00:00:00.000Z",
  "scopes": ["files:read_raw"]
}
```

### DELETE /api/admin/api-keys/:id

Revoke API key. Admin only.

### GET /api/admin/audit-logs

List audit logs. Admin only.

Query params: `?page=1&limit=20`

## API Key Raw Access

### GET /api/v1/files/:id/raw

Get raw file content via API key.

**Headers:**
```
Authorization: Bearer secvault_xxxxxxxxxxxxxxxxxx
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Production .env",
  "actualFileName": ".env.production",
  "content": "DATABASE_URL=...\nOPENAI_API_KEY=...",
  "updatedAt": "2026-05-06T00:00:00.000Z",
  "updatedAtKst": "2026-05-06 09:00:00",
  "updatedBy": "developer@internal.local"
}
```

**Headers:**
- `Cache-Control: no-store`

## Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized for this action |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| API_KEY_EXPIRED | 401 | API key has expired |
| API_KEY_REVOKED | 401 | API key has been revoked |
| API_KEY_INVALID | 401 | Invalid API key |
| INTERNAL_ERROR | 500 | Server error |
