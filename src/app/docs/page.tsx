"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NAV_ITEMS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "account", label: "Account & Registration" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "files", label: "File Management" },
  { id: "categories", label: "Categories" },
  { id: "history", label: "History & Revisions" },
  { id: "search", label: "Search & Filter" },
  { id: "api-keys", label: "API Keys" },
];

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function DocsPage() {
  const router = useRouter();
  const [active, setActive] = useState("getting-started");
  const [user, setUser] = useState<UserInfo | null>(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="docs" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-52 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              {NAV_ITEMS.map((item) => (
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

          {/* Content */}
          <main className="flex-1 min-w-0">
            {active === "getting-started" && <GettingStarted />}
            {active === "account" && <AccountSection />}
            {active === "roles" && <RolesSection />}
            {active === "files" && <FilesSection />}
            {active === "categories" && <CategoriesSection />}
            {active === "history" && <HistorySection />}
            {active === "search" && <SearchSection />}
            {active === "api-keys" && <ApiKeysSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

function GettingStarted() {
  return (
    <div className="space-y-6">
      <div>
        <Image src="/docs.png" alt="Docs" width={80} height={80} className="h-20 w-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">PlainVault User Guide</h1>
        <p className="mt-2 text-gray-600">
          A clean internal vault for storing secrets, configs, and secure team notes.
          All content is encrypted with AES-256-GCM and access is controlled by role-based permissions.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>What is PlainVault?</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>PlainVault is a secure internal vault for teams to store and share secrets, configuration files, and secure notes. Think of it as a shared repository for sensitive information that your whole team needs to access but shouldn&apos;t be scattered across Slack messages, emails, or local files.</p>
          <p>Common use cases:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Database connection strings and credentials</li>
            <li>API keys for third-party services</li>
            <li>Environment variable configurations (env files)</li>
            <li>SSL certificates and private keys</li>
            <li>Team notes with sensitive information</li>
            <li>Infrastructure configuration (docker-compose, kubernetes configs)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How access works</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
            <p>Request an account from your administrator — go to the <Link href="/register" className="text-indigo-600 hover:underline">registration page</Link> and fill in your name, email, and password</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
            <p>Wait for approval — your administrator will receive your request and approve or reject it. You cannot log in until your account is activated.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
            <p>Sign in and start managing files — once approved, log in and browse, create, or edit vault files based on your role</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security model</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>All file content is encrypted at rest using AES-256-GCM encryption. Even if the database is compromised, the content cannot be read without the encryption key.</p>
          <p>For VIEWER role users, sensitive values are automatically masked. For example, an env file containing:</p>
          <div className="rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>DATABASE_URL=postgres://user:secret123@db.example.com:5432/prod</p>
            <p>API_KEY=sk_live_abcdef123456</p>
          </div>
          <p>Would be shown to a VIEWER as:</p>
          <div className="rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>DATABASE_URL=********</p>
            <p>API_KEY=********</p>
          </div>
          <p>DEVELOPER and ADMIN roles see the full raw content.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Account & Registration</h2>

      <Card>
        <CardHeader><CardTitle>Requesting an Account</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to the <Link href="/register" className="text-indigo-600 hover:underline">registration page</Link></li>
            <li>Enter your name, email, and password</li>
            <li>Click &quot;Create account&quot; — your request will be marked as <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">PENDING</span></li>
            <li>Contact your administrator to approve your account</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pending Status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>New accounts cannot log in until an administrator approves them. You&apos;ll see a message:</p>
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Your account is pending approval. Please wait for an administrator to approve your registration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RolesSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-700">Feature</th>
                <th className="text-center px-4 py-2 font-medium text-indigo-600">ADMIN</th>
                <th className="text-center px-4 py-2 font-medium text-green-600">DEVELOPER</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">VIEWER</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ["View file (raw)", "✓", "✓", "✗"],
                ["View file (masked)", "✓", "✓", "✓"],
                ["Create file", "✓", "✓", "✗"],
                ["Edit file", "✓", "✓", "✗"],
                ["Delete file", "✓", "✗", "✗"],
                ["Manage categories", "✓", "✗", "✗"],
                ["Approve/reject users", "✓", "✗", "✗"],
                ["Create/revoke API keys", "✓", "✗", "✗"],
                ["View audit logs", "✓", "✗", "✗"],
                ["View revision history", "✓", "✓", "✗"],
              ].map(([feature, admin, dev, viewer], i) => (
                <tr key={feature as string} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{feature}</td>
                  <td className="px-4 py-2 text-center">{admin}</td>
                  <td className="px-4 py-2 text-center">{dev}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{viewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-indigo-700">ADMIN</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            Full access. Manages files, categories, users, API keys, and audit logs.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-green-600">DEVELOPER</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            Create and edit files. Use API keys. View revision history.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-gray-600">VIEWER</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            View files with masked secrets (KEY=value shown as KEY=********).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilesSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">File Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Create a File</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <Link href="/dashboard" className="text-indigo-600 hover:underline">Dashboard</Link> to manage files</li>
              <li>Click &quot;New File&quot;</li>
              <li>Fill in title, file name, content type</li>
              <li>Optional: assign a category</li>
              <li>Enter content and click Save</li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">View a File</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ul className="space-y-1">
              <li>Click a file title in the list</li>
              <li>DEVELOPER/ADMIN — sees full raw content</li>
              <li>VIEWER — sees masked content</li>
              <li>Click &quot;RAW&quot; for unredacted access (dev/admin only)</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Edit a File</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>Open file detail page, click &quot;Edit&quot;</li>
              <li>Modify content</li>
              <li>Enter a change summary (required)</li>
              <li>Click Save — a new revision is created</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Content Types</CardTitle></CardHeader>
        <CardContent className="text-xs text-gray-600">
          <div className="flex flex-wrap gap-2 mb-3">
            {["text", "markdown", "env", "json", "yaml", "xml", "sql"].map(t => (
              <span key={t} className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{t}</span>
            ))}
          </div>
          <p>Content type affects how secret values are masked for VIEWER role. env, json, and yaml types mask <code className="bg-gray-100 px-1 rounded">KEY=value</code> patterns.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Categories</h2>

      <Card>
        <CardHeader><CardTitle>Managing Categories</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>Categories let you organize files with color-coded labels. Only ADMIN can manage them.</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click your role badge → <Link href="/admin/categories" className="text-indigo-600 hover:underline">Categories</Link></li>
            <li>Click &quot;New Category&quot;</li>
            <li>Enter a name and pick a color</li>
            <li>Click Create</li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { name: "Production", color: "#ef4444" },
              { name: "Development", color: "#22c55e" },
              { name: "Secrets", color: "#f97316" },
              { name: "Config", color: "#3b82f6" },
              { name: "Notes", color: "#8b5cf6" },
            ].map(c => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium"
                style={{ backgroundColor: c.color + "20", color: c.color, border: `1px solid ${c.color}40` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Note: A category with files assigned to it cannot be deleted.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function HistorySection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">History & Revisions</h2>

      <Card>
        <CardHeader><CardTitle>Revision History</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>Every file edit creates a new revision. You can browse and compare past versions.</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open a file detail page</li>
            <li>Click the &quot;History&quot; button</li>
            <li>Select a revision to view it</li>
            <li>Cmd+Click (or Ctrl+Click) to select multiple revisions</li>
            <li>Click &quot;Compare&quot; to see the diff between selected revisions</li>
          </ol>
          <div className="mt-3 p-3 bg-gray-100 rounded-md font-mono text-xs">
            <div className="text-green-700">+ Added line here</div>
            <div className="text-red-700">- Removed line here</div>
            <div className="text-gray-500">  Unchanged line</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Only DEVELOPER and ADMIN roles can access revision history.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SearchSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Search & Filter</h2>

      <Card>
        <CardHeader><CardTitle>Searching Files</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <ul className="space-y-2">
            <li><strong>Text search</strong> — Type in the search bar at the top of the files list to filter by title or file name. Results update as you type.</li>
            <li><strong>Category filter</strong> — Click a colored category chip above the file list to filter files by that category.</li>
            <li><strong>Combined</strong> — Search and category filters work together.</li>
            <li><strong>Clear filter</strong> — Click &quot;All&quot; to show all files again.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>

      <Card>
        <CardHeader><CardTitle>Using API Keys</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>API keys let you access files programmatically without a browser session. Only ADMIN can create and revoke API keys.</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click your role badge → <Link href="/admin/api-keys" className="text-indigo-600 hover:underline">API Keys</Link></li>
            <li>Click &quot;Create Key&quot;</li>
            <li>Give it a name and optionally set an expiration</li>
            <li>Copy the generated key — it&apos;s shown only once</li>
          </ol>
          <div className="mt-3 rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>Authorization: Bearer sk_test_xxxx</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">Use the key in the Authorization header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer your_key_here</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
