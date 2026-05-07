"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { AppHeader } from "@/components/app-header";

const CODE_EXAMPLES: Record<string, { bash: string; js: string; python: string }> = {
  "POST /api/auth/register": {
    bash: `curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "user@example.com",
    "password": "Pass123!"
  }'`,
    js: `// Register a new account
// New accounts are PENDING until admin approves
const res = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'user@example.com',
    password: 'Pass123!'
  })
});
const data = await res.json();
// { message: "Registration accepted", user: { id, email, name, status } }`,
    python: `import requests

# Register a new account
# New accounts are PENDING until admin approves
res = requests.post('http://localhost:3000/api/auth/register', json={
    'name': 'John Doe',
    'email': 'user@example.com',
    'password': 'Pass123!'
})
print(res.json())
# {'message': 'Registration accepted', 'user': {...}}`,
  },
  "POST /api/auth/login": {
    bash: `curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{
    "email": "admin@internal.local",
    "password": "admin123"
  }'`,
    js: `// Authenticate and receive session cookies
// The server sets: session_user_id, session_role, session_status
// Include cookies in subsequent requests via credentials: 'include'
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ← Required to receive session cookie
  body: JSON.stringify({
    email: 'admin@internal.local',
    password: 'admin123'
  })
});
const { user } = await res.json();
// { user: { id, email, name, role, status } }`,
    python: `import requests

session = requests.Session()  # ← persist cookies automatically

# Authenticate and receive session cookies
res = session.post('http://localhost:3000/api/auth/login', json={
    'email': 'admin@internal.local',
    'password': 'admin123'
})
print(res.json())
# { user: { id, name, email, role, status } }`,
  },
  "POST /api/auth/logout": {
    bash: `curl -X POST http://localhost:3000/api/auth/logout \\
  -b cookies.txt`,
    js: `// Sign out the current user
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});`,
    python: `# Invalidate the current session
session.post('http://localhost:3000/api/auth/logout')`,
  },
  "GET /api/auth/me": {
    bash: `curl http://localhost:3000/api/auth/me \\
  -b cookies.txt`,
    js: `// Get the currently authenticated user
const res = await fetch('/api/auth/me', {
  credentials: 'include'
});
const { user } = await res.json();
// { user: { id, email, name, role, status } }
// Returns 401 if not logged in`,
    python: `# Get the currently authenticated user
res = session.get('http://localhost:3000/api/auth/me')
print(res.json())
# {'user': {'id': ..., 'email': '...', 'role': '...'}}
# Returns 401 if not logged in`,
  },
  "GET /api/files": {
    bash: `curl "http://localhost:3000/api/files?search=config&categoryId=..." \\
  -b cookies.txt`,
    js: `// List all files (filtered by search/category)
// Supports query params: search, categoryId
const res = await fetch('/api/files?search=config', {
  credentials: 'include'
});
const { files, categories } = await res.json();
// files: [{ id, title, actualFileName, contentType, category, updatedAt }, ...]
// categories: [{ id, name, color }, ...]`,
    python: `# List all files
res = session.get('http://localhost:3000/api/files', params={
    'search': 'config',
    'categoryId': 'uuid'
})
data = res.json()
print(data['files'])
print(data['categories'])`,
  },
  "POST /api/files": {
    bash: `curl -X POST http://localhost:3000/api/files \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "title": "API Keys",
    "actualFileName": ".env",
    "contentType": "env",
    "content": "KEY=secret123",
    "categoryId": "uuid"  // optional
  }'`,
    js: `// Create a new vault file (DEVELOPER+ only)
const res = await fetch('/api/files', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'API Keys',
    actualFileName: '.env',
    contentType: 'env',
    content: 'KEY=secret123',
    categoryId: 'uuid'  // optional
  })
});
const { file } = await res.json();
// file: { id, title, actualFileName, contentType, category, createdAt }`,
    python: `# Create a new vault file (DEVELOPER+ only)
res = session.post('http://localhost:3000/api/files', json={
    'title': 'API Keys',
    'actualFileName': '.env',
    'contentType': 'env',
    'content': 'KEY=secret123',
    'categoryId': 'uuid'  # optional
})
print(res.json()['file'])`,
  },
  "GET /api/files/[id]": {
    bash: `curl http://localhost:3000/api/files/{id} \\
  -b cookies.txt`,
    js: `// Get file metadata and content (masked for VIEWER)
// VIEWER sees masked content; DEVELOPER/ADMIN see full
const res = await fetch('/api/files/{id}', {
  credentials: 'include'
});
const { file } = await res.json();
// file: { id, title, content, contentType, category, updatedBy, updatedAt }`,
    python: `# Get file metadata and content (masked for VIEWER)
res = session.get('http://localhost:3000/api/files/{id}')
print(res.json()['file'])`,
  },
  "PATCH /api/files/[id]": {
    bash: `curl -X PATCH http://localhost:3000/api/files/{id} \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "content": "UPDATED content here",
    "changeSummary": "Updated API key value"  // ← required
  }'`,
    js: `// Update file content (DEVELOPER+ only)
// Creates a new revision automatically
// changeSummary is REQUIRED
const res = await fetch('/api/files/{id}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    content: 'UPDATED content here',
    changeSummary: 'Updated API key value'  // ← required
  })
});
const { file } = await res.json();`,
    python: `# Update file content (DEVELOPER+ only)
# Creates a new revision automatically
# changeSummary is REQUIRED
res = session.patch('http://localhost:3000/api/files/{id}', json={
    'content': 'UPDATED content here',
    'changeSummary': 'Updated API key value'  # ← required
})`,
  },
  "DELETE /api/files/[id]": {
    bash: `curl -X DELETE http://localhost:3000/api/files/{id} \\
  -b cookies.txt`,
    js: `// Soft-delete a file (ADMIN only)
// File is not permanently deleted — can be recovered
await fetch('/api/files/{id}', {
  method: 'DELETE',
  credentials: 'include'
});
// Returns 200 on success, 403 if not ADMIN`,
    python: `# Soft-delete a file (ADMIN only)
# File is not permanently deleted
session.delete('http://localhost:3000/api/files/{id}')`,
  },
  "GET /api/files/[id]/raw": {
    bash: `curl http://localhost:3000/api/files/{id}/raw -b cookies.txt`,
    js: `// Get unmasked file content
// VIEWER receives 403 Forbidden
// DEVELOPER/ADMIN receive full content
const res = await fetch('/api/files/{id}/raw', {
  credentials: 'include'
});
if (res.status === 403) {
  console.log('VIEWER cannot access raw content');
} else {
  const { content } = await res.json();
  console.log(content);
}`,
    python: `# Get unmasked file content
# VIEWER receives 403 Forbidden
res = session.get('http://localhost:3000/api/files/{id}/raw')
if res.status_code == 403:
    print('VIEWER cannot access raw content')
else:
    print(res.json()['content'])`,
  },
  "GET /api/files/[id]/revisions": {
    bash: `curl http://localhost:3000/api/files/{id}/revisions \\
  -b cookies.txt`,
    js: `// Get file revision history (DEVELOPER+ only)
const res = await fetch('/api/files/{id}/revisions', {
  credentials: 'include'
});
const { revisions } = await res.json();
// revisions: [{ revisionNumber, changeSummary, changedBy, changedAt }, ...]`,
    python: `# Get file revision history (DEVELOPER+ only)
res = session.get('http://localhost:3000/api/files/{id}/revisions')
print(res.json()['revisions'])`,
  },
  "GET /api/files/[id]/revisions/[revisionId]/diff": {
    bash: `curl "http://localhost:3000/api/files/{id}/revisions/{revisionId}/diff" \\
  -b cookies.txt`,
    js: `// Get diff between current and specific revision
const res = await fetch(
  '/api/files/{id}/revisions/{revisionId}/diff',
  { credentials: 'include' }
);
const { diff } = await res.json();
// diff: { currentContent, revisionContent, changes: [...] }`,
    python: `# Get diff between current and specific revision
res = session.get(
    'http://localhost:3000/api/files/{id}/revisions/{revisionId}/diff'
)
print(res.json()['diff'])`,
  },
  "GET /api/admin/categories": {
    bash: `curl http://localhost:3000/api/admin/categories \\
  -b cookies.txt`,
    js: `// List all categories with file counts (ADMIN only)
const res = await fetch('/api/admin/categories', {
  credentials: 'include'
});
const { categories } = await res.json();
// categories: [{ id, name, color, fileCount }, ...]`,
    python: `# List all categories with file counts (ADMIN only)
res = session.get('http://localhost:3000/api/admin/categories')
print(res.json()['categories'])`,
  },
  "POST /api/admin/categories": {
    bash: `curl -X POST http://localhost:3000/api/admin/categories \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"name": "Production", "color": "#ef4444"}'`,
    js: `// Create a new category (ADMIN only)
const res = await fetch('/api/admin/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Production',
    color: '#ef4444'
  })
});
const { category } = await res.json();`,
    python: `# Create a new category (ADMIN only)
res = session.post('http://localhost:3000/api/admin/categories', json={
    'name': 'Production',
    'color': '#ef4444'
})
print(res.json()['category'])`,
  },
  "DELETE /api/admin/categories/[id]": {
    bash: `curl -X DELETE http://localhost:3000/api/admin/categories/{id} \\
  -b cookies.txt`,
    js: `// Delete a category (ADMIN only)
// Fails if category has assigned files
await fetch('/api/admin/categories/{id}', {
  method: 'DELETE',
  credentials: 'include'
});`,
    python: `# Delete a category (ADMIN only)
# Fails if category has assigned files
session.delete('http://localhost:3000/api/admin/categories/{id}')`,
  },
  "GET /api/admin/api-keys": {
    bash: `curl http://localhost:3000/api/admin/api-keys -b cookies.txt`,
    js: `// List all API keys (ADMIN only)
// Raw key is NOT returned — only keyPrefix for security
const res = await fetch('/api/admin/api-keys', {
  credentials: 'include'
});
const { apiKeys } = await res.json();
// apiKeys: [{ id, name, keyPrefix, status, expiresAt, createdAt }, ...]`,
    python: `# List all API keys (ADMIN only)
# Raw key is NOT returned — only keyPrefix for security
res = session.get('http://localhost:3000/api/admin/api-keys')
print(res.json()['apiKeys'])`,
  },
  "POST /api/admin/api-keys": {
    bash: `curl -X POST http://localhost:3000/api/admin/api-keys \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"name": "CI/CD Pipeline", "expiresInDays": 90}'`,
    js: `// Create an API key (ADMIN only)
// ⚠️ The raw key is returned ONLY in this response
// Store it securely — it cannot be retrieved again
const res = await fetch('/api/admin/api-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'CI/CD Pipeline',
    expiresInDays: 90  // optional, null = no expiration
  })
});
const { apiKey } = await res.json();
// apiKey: { id, name, keyPrefix: "sk_test_xxxx", key: "sk_test_...", expiresAt, createdAt }
// ⚠️ apiKey.key is shown ONLY here — store it now!`,
    python: `# Create an API key (ADMIN only)
# ⚠️ The raw key is returned ONLY in this response
res = session.post('http://localhost:3000/api/admin/api-keys', json={
    'name': 'CI/CD Pipeline',
    'expiresInDays': 90
})
api_key = res.json()['apiKey']
print(f"Key prefix: {api_key['keyPrefix']}")
raw_key = api_key['key']  # ← store this now, shown only once!`,
  },
  "DELETE /api/admin/api-keys/[id]": {
    bash: `curl -X DELETE http://localhost:3000/api/admin/api-keys/{id} \\
  -b cookies.txt`,
    js: `// Revoke an API key immediately (ADMIN only)
// After revocation, the key can no longer be used for authentication
await fetch('/api/admin/api-keys/{id}', {
  method: 'DELETE',
  credentials: 'include'
});`,
    python: `# Revoke an API key immediately (ADMIN only)
# After revocation, the key cannot authenticate
session.delete('http://localhost:3000/api/admin/api-keys/{id}')`,
  },
  "GET /api/admin/users": {
    bash: `curl http://localhost:3000/api/admin/users -b cookies.txt`,
    js: `// List all users with their status and role
const res = await fetch('/api/admin/users', {
  credentials: 'include'
});
const { users } = await res.json();
// users: [{ id, email, name, role, status, createdAt }, ...]
// status: PENDING | APPROVED | REJECTED
// role: ADMIN | DEVELOPER | VIEWER`,
    python: `# List all users
res = session.get('http://localhost:3000/api/admin/users')
print(res.json()['users'])`,
  },
  "POST /api/admin/users/[id]/approve": {
    bash: `curl -X POST http://localhost:3000/api/admin/users/{id}/approve \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"role": "DEVELOPER"}'`,
    js: `// Approve a pending user and assign a role (ADMIN only)
// role can be: "VIEWER" | "DEVELOPER" | "ADMIN"
// After approval, the user can log in with their credentials
await fetch('/api/admin/users/{id}/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ role: 'DEVELOPER' })
});`,
    python: `# Approve a pending user and assign a role (ADMIN only)
session.post(
    'http://localhost:3000/api/admin/users/{id}/approve',
    json={'role': 'DEVELOPER'}  # VIEWER | DEVELOPER | ADMIN
)`,
  },
  "POST /api/admin/users/[id]/reject": {
    bash: `curl -X POST http://localhost:3000/api/admin/users/{id}/reject \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"reason": "Access denied"}'`,
    js: `// Reject a pending user registration (ADMIN only)
// The user cannot log in after rejection
await fetch('/api/admin/users/{id}/reject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ reason: 'Access denied' })  // optional
});`,
    python: `# Reject a pending user (ADMIN only)
session.post(
    'http://localhost:3000/api/admin/users/{id}/reject',
    json={'reason': 'Access denied'}  # optional
)`,
  },
  "GET /api/admin/audit-logs": {
    bash: `curl http://localhost:3000/api/admin/audit-logs \\
  -b cookies.txt`,
    js: `// Get audit trail (ADMIN only)
// Includes: event type, actor, target, time, success/fail
const res = await fetch('/api/admin/audit-logs', {
  credentials: 'include'
});
const { auditLogs } = await res.json();
// auditLogs: [{ id, eventType, actorId, targetType, targetId, success, createdAt }, ...]`,
    python: `# Get audit trail (ADMIN only)
res = session.get('http://localhost:3000/api/admin/audit-logs')
print(res.json()['auditLogs'])`,
  },
  "PATCH /api/auth/password": {
    bash: `curl -X PATCH http://localhost:3000/api/auth/password \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "currentPassword": "old123",
    "newPassword": "new123456"
  }'`,
    js: `// Change your password
// Requires current password for verification
const res = await fetch('/api/auth/password', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    currentPassword: 'old123',
    newPassword: 'new123456'  // min 8 characters
  })
});
const data = await res.json();
// { message: "Password updated successfully" } on success`,
    python: `# Change your password
res = session.patch('http://localhost:3000/api/auth/password', json={
    'currentPassword': 'old123',
    'newPassword': 'new123456'  # min 8 characters
})
print(res.json())`,
  },
};

const ENDPOINTS = [
  { method: "GET", path: "/api/auth/me", auth: "Required", desc: "Get current user info" },
  { method: "POST", path: "/api/auth/login", auth: "Public", desc: "Login and receive session cookie" },
  { method: "POST", path: "/api/auth/logout", auth: "Required", desc: "Logout and clear session" },
  { method: "POST", path: "/api/auth/register", auth: "Public", desc: "Register new account (PENDING)" },
  { method: "PATCH", path: "/api/auth/password", auth: "Required", desc: "Change current user's password" },
  { method: "GET", path: "/api/files", auth: "Required", desc: "List all files with optional search/category filter" },
  { method: "POST", path: "/api/files", auth: "DEVELOPER+", desc: "Create a new vault file" },
  { method: "GET", path: "/api/files/[id]", auth: "Required", desc: "Get file details with masked/unmasked content" },
  { method: "PATCH", path: "/api/files/[id]", auth: "DEVELOPER+", desc: "Update file content (creates revision)" },
  { method: "DELETE", path: "/api/files/[id]", auth: "ADMIN", desc: "Soft-delete a file" },
  { method: "GET", path: "/api/files/[id]/raw", auth: "DEVELOPER+", desc: "Get raw unmasked file content" },
  { method: "GET", path: "/api/files/[id]/revisions", auth: "DEVELOPER+", desc: "Get file revision history" },
  { method: "GET", path: "/api/files/[id]/revisions/[revisionId]/diff", auth: "DEVELOPER+", desc: "Compare current vs specific revision" },
  { method: "GET", path: "/api/admin/categories", auth: "ADMIN", desc: "List all categories with file counts" },
  { method: "POST", path: "/api/admin/categories", auth: "ADMIN", desc: "Create a new category" },
  { method: "DELETE", path: "/api/admin/categories/[id]", auth: "ADMIN", desc: "Delete a category (fails if has files)" },
  { method: "GET", path: "/api/admin/api-keys", auth: "ADMIN", desc: "List all API keys (no raw key)" },
  { method: "POST", path: "/api/admin/api-keys", auth: "ADMIN", desc: "Create API key (raw key returned once)" },
  { method: "DELETE", path: "/api/admin/api-keys/[id]", auth: "ADMIN", desc: "Revoke an API key" },
  { method: "GET", path: "/api/admin/users", auth: "ADMIN", desc: "List all users" },
  { method: "POST", path: "/api/admin/users/[id]/approve", auth: "ADMIN", desc: "Approve pending user and set role" },
  { method: "POST", path: "/api/admin/users/[id]/reject", auth: "ADMIN", desc: "Reject pending user" },
  { method: "GET", path: "/api/admin/audit-logs", auth: "ADMIN", desc: "Get audit trail (events, actors, targets)" },
];

type Lang = "bash" | "js" | "python";

function CodeBlock({ code, lang }: { code: string; lang: Lang }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.removeAttribute("data-highlighted");
      hljs.highlightElement(ref.current);
    }
  }, [code, lang]);

  const hljsLang: Record<Lang, string> = {
    bash: "bash",
    js: "javascript",
    python: "python",
  };

  return (
    <pre ref={ref} className={`language-${hljsLang[lang]} text-xs font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto`}>
      <code>{code}</code>
    </pre>
  );
}

function EndpointCard({ ep }: { ep: typeof ENDPOINTS[0] }) {
  const [lang, setLang] = useState<Lang>("bash");
  const examples = CODE_EXAMPLES[ep.method + " " + ep.path];

  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PATCH: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
  };

  const authColors: Record<string, string> = {
    "Required": "bg-blue-50 text-blue-700 border-blue-200",
    "ADMIN": "bg-purple-50 text-purple-700 border-purple-200",
    "DEVELOPER+": "bg-green-50 text-green-700 border-green-200",
    "Public": "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[ep.method]}`}>
            {ep.method}
          </span>
          <code className="text-sm font-mono text-gray-800">{ep.path}</code>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs border ${authColors[ep.auth]}`}>
          {ep.auth}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">{ep.desc}</p>
        <div className="flex gap-1 mb-3">
          {(["bash", "js", "python"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 text-xs rounded ${
                lang === l
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {l === "bash" ? "cURL" : l === "js" ? "JavaScript" : "Python"}
            </button>
          ))}
        </div>
        {examples ? (
          <CodeBlock code={examples[lang]} lang={lang} />
        ) : (
          <p className="text-xs text-gray-400 italic">No code example available</p>
        )}
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "authentication", label: "Authentication" },
    { id: "files", label: "Files" },
    { id: "categories", label: "Categories" },
    { id: "api-keys", label: "API Keys" },
    { id: "users", label: "Users" },
    { id: "audit-logs", label: "Audit Logs" },
  ];

  const filteredEndpoints = ENDPOINTS.filter((ep) => {
    if (active === "overview") return true;
    if (active === "authentication") return ep.path.startsWith("/api/auth");
    if (active === "files") return ep.path.startsWith("/api/files") && !ep.path.includes("admin");
    if (active === "categories") return ep.path.includes("categories");
    if (active === "api-keys") return ep.path.includes("api-keys");
    if (active === "users") return ep.path.includes("users");
    if (active === "audit-logs") return ep.path.includes("audit-logs");
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="api" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-52 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              {sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    active === item.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">API Reference</h1>
              <p className="mt-1 text-sm text-gray-500">
                PlainVault REST API — session-based authentication via cookies
              </p>
            </div>

            {active === "overview" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Base URL</h3>
                  <code className="text-sm font-mono text-blue-700">http://localhost:3000</code>
                  <p className="mt-2 text-sm text-blue-700">
                    All endpoints are relative to this URL. Include cookies in requests via{' '}
                    <code className="bg-blue-100 px-1 rounded">credentials: &apos;include&apos;</code> (fetch) or{' '}
                    <code className="bg-blue-100 px-1 rounded">requests.Session()</code> (Python).
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-3">All Endpoints</h3>
                  <div className="space-y-2">
                    {ENDPOINTS.map((ep, i) => (
                      <EndpointCard key={i} ep={ep} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {active !== "overview" && (
              <div className="space-y-4">
                {filteredEndpoints.map((ep, i) => (
                  <EndpointCard key={i} ep={ep} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}