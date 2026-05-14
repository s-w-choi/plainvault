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
{
  "message": "Registration request submitted. Please wait for admin approval.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "VIEWER",
    "status": "PENDING"
  }
}
```

### POST /api/auth/login

Login with email and password.

**Request:**
```json
{
  "email": "admin@plainvault.local",
  "password": "plainvault-admin"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@plainvault.local",
    "role": "ADMIN",
    "status": "APPROVED",
    "lastLoginAt": "2026-05-06T00:00:00.000Z"
  }
}
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
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@plainvault.local",
    "role": "ADMIN",
    "status": "APPROVED",
    "lastLoginAt": "2026-05-06T00:00:00.000Z"
  }
}
```

### PATCH /api/auth/password

Change current user password.

**Request:**
```json
{
  "currentPassword": "plainvault-admin",
  "newPassword": "new-secure-password"
}
```

**Response:**
```json
{ "message": "Password updated" }
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
  }],
  "categories": [{
    "id": "uuid",
    "name": "Production",
    "color": "#ef4444",
    "fileCount": 5
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

**Response:** (201 Created)
```json
{
  "file": {
    "id": "uuid",
    "title": "Production .env",
    "actualFileName": ".env.production",
    "contentType": "env",
    "createdBy": { "email": "dev@example.com" },
    "updatedBy": { "email": "dev@example.com" },
    "createdAt": "2026-05-06T00:00:00.000Z",
    "updatedAt": "2026-05-06T00:00:00.000Z"
  }
}
```

### GET /api/files/:id

Get file details.

- **Admin/Developer**: Returns raw content
- **Viewer**: Returns masked content

**Response:**
```json
{
  "file": {
    "id": "uuid",
    "title": "Production .env",
    "actualFileName": ".env.production",
    "contentType": "env",
    "content": "DATABASE_URL=...",
    "category": {
      "id": "uuid",
      "name": "Production",
      "color": "#ef4444"
    },
    "createdBy": { "name": "Dev", "email": "dev@example.com" },
    "updatedBy": { "name": "Dev", "email": "dev@example.com" },
    "createdAt": "2026-05-06T00:00:00.000Z",
    "updatedAt": "2026-05-06 09:00:00"
  }
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

### GET /api/files/:id/raw

Get raw file content via session. DEVELOPER+ only.

**Response:**
```json
{
  "file": {
    "id": "uuid",
    "title": "Production .env",
    "actualFileName": ".env.production",
    "content": "DATABASE_URL=...\nOPENAI_API_KEY=...",
    "updatedAt": "2026-05-06 09:00:00",
    "updatedBy": "developer@plainvault.local"
  }
}
```

**Headers:**
- `Cache-Control: no-store`

## Admin APIs

### GET /api/admin/users

List all users. Admin only.

Query params: `?status=PENDING|APPROVED|REJECTED|DISABLED`

### POST /api/admin/users/:id/approve

Approve pending user. Admin only.

**Request:**
```json
{
  "role": "DEVELOPER"
}
```
> `role` is optional. Defaults to `VIEWER` if not provided.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "DEVELOPER",
    "status": "APPROVED"
  }
}
```

### POST /api/admin/users/:id/reject

Reject user. Admin only.

**Request:**
```json
{
  "reason": "Access denied"
}
```
> `reason` is optional.

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

### GET /api/admin/categories

List all categories. Admin only.

**Response:**
```json
{
  "categories": [{
    "id": "uuid",
    "name": "Production",
    "color": "#ef4444",
    "fileCount": 5,
    "createdAt": "2026-05-06T00:00:00.000Z"
  }]
}
```

### POST /api/admin/categories

Create a new category. Admin only.

**Request:**
```json
{
  "name": "Staging",
  "color": "#f59e0b"
}
```

**Response:**
```json
{
  "category": {
    "id": "uuid",
    "name": "Staging",
    "color": "#f59e0b",
    "fileCount": 0,
    "createdAt": "2026-05-06T00:00:00.000Z"
  }
}
```

### DELETE /api/admin/categories/:id

Delete a category. Admin only. Fails if category has files.

### GET /api/admin/settings

Get application settings. Admin only.

**Response:**
```json
{
  "settings": {
    "siteName": "PlainVault",
    "allowRegistration": true,
    "defaultRole": "VIEWER"
  }
}
```

### PATCH /api/admin/settings

Update application settings. Admin only.

**Request:**
```json
{
  "allowRegistration": false,
  "defaultRole": "DEVELOPER"
}
```

**Response:**
```json
{
  "settings": {
    "siteName": "PlainVault",
    "allowRegistration": false,
    "defaultRole": "DEVELOPER"
  }
}
```

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
  "updatedAt": "2026-05-06 09:00:00",
  "updatedBy": "developer@plainvault.local"
}
```

**Headers:**
- `Cache-Control: no-store`

## Health

### GET /api/health

Check server health. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2026-05-06T00:00:00.000Z"
}
```

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
