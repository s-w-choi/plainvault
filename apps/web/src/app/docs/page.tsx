import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "files", label: "File Management" },
  { id: "categories", label: "Categories" },
  { id: "search", label: "Search & Filter" },
  { id: "history", label: "History & Revisions" },
  { id: "api-keys", label: "API Keys" },
  { id: "security", label: "Security" },
];

export const metadata = {
  title: "PlainVault - Documentation",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={100} height={100} />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/get-started" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Get Started
            </Link>
            <a
              href="https://github.com/s-w-choi/plainvault"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" role="img" aria-label="GitHub">
                <title>GitHub</title>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <nav className="sticky top-20 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 space-y-12">
            <OverviewSection />
            <RolesSection />
            <FilesSection />
            <CategoriesSection />
            <SearchSection />
            <HistorySection />
            <ApiKeysSection />
            <SecuritySection />
          </main>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <section id="overview" className="scroll-mt-20">
      <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
      <p className="mt-2 text-gray-600">
        Everything you need to know about using PlainVault.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>What is PlainVault?</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              PlainVault is a secure internal vault for teams to store and share secrets, configuration files, and secure notes. All content is encrypted with AES-256-GCM and access is controlled by role-based permissions.
            </p>
            <p className="text-sm text-gray-600 mb-2">Common use cases:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
          <CardHeader>How access works</CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StepBadge step={1} text="Request an account from your administrator — go to the registration page and fill in your name, email, and password" />
              <StepBadge step={2} text="Wait for approval — your administrator will receive your request and approve or reject it. You cannot log in until your account is activated." />
              <StepBadge step={3} text="Sign in and start managing files — once approved, log in and browse, create, or edit vault files based on your role" />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-700">
            New to PlainVault? Check out the <Link href="/get-started" className="font-semibold hover:underline">Get Started</Link> guide for installation instructions.
          </p>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section id="roles" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
      <p className="mt-1 text-sm text-gray-500">
        PlainVault uses three roles with progressively scoped access. Administrators assign roles during user approval.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardContent>
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
                  <tr key={feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
          <RoleCard
            title="ADMIN"
            color="indigo"
            description="Full access to all features. Manages files, categories, users, API keys, and audit logs. Can approve or reject new user registrations and revoke access at any time."
          />
          <RoleCard
            title="DEVELOPER"
            color="green"
            description="Can create and edit files, use API keys for programmatic access, and view revision history. Cannot delete files or manage users and categories."
          />
          <RoleCard
            title="VIEWER"
            color="gray"
            description="Read-only access with automatic secret masking. Sensitive values like KEY=value are displayed as KEY=********. Ideal for auditors and stakeholders."
          />
        </div>
      </div>
    </section>
  );
}

function FilesSection() {
  return (
    <section id="files" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">File Management</h2>
      <p className="mt-1 text-sm text-gray-500">
        Files are the core unit in PlainVault. Each file stores encrypted content with a title, filename, and content type.
      </p>

      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>Creating a File</CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Navigate to the Dashboard</li>
                <li>Click the <strong>&quot;New File&quot;</strong> button</li>
                <li>Enter a <strong>title</strong> (human-readable display name)</li>
                <li>Set a <strong>file name</strong> (e.g. <code className="bg-gray-100 px-1 rounded text-xs">.env.production</code>)</li>
                <li>Choose a <strong>content type</strong> — this affects how secrets are masked</li>
                <li>Optionally assign a <strong>category</strong> for organization</li>
                <li>Paste or type your content and click <strong>Save</strong></li>
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Viewing a File</CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Click any file title in the dashboard list to open its detail page</li>
                <li><strong>DEVELOPER / ADMIN</strong> — sees full raw content with all values visible</li>
                <li><strong>VIEWER</strong> — sees masked content where sensitive values are replaced with <code className="bg-gray-100 px-1 rounded text-xs">********</code></li>
                <li>Click the <strong>&quot;RAW&quot;</strong> button to view unformatted content (DEVELOPER/ADMIN only)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>Editing a File</CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Open the file detail page and click <strong>&quot;Edit&quot;</strong></li>
                <li>Modify the content in the editor</li>
                <li>Enter a <strong>change summary</strong> (required) — describe what changed and why</li>
                <li>Click <strong>Save</strong> — a new revision is automatically created</li>
              </ol>
              <p className="mt-3 text-xs text-gray-500">Every edit creates a new revision. The previous version is never lost and can be restored from History.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Deleting a File</CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Only <strong>ADMIN</strong> role can delete files</li>
                <li>Open the file detail page and click <strong>&quot;Delete&quot;</strong></li>
                <li>Confirm the deletion in the dialog</li>
              </ul>
              <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                Deletion is permanent. All revisions and history for the file are removed. This action cannot be undone.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>Content Types</CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {["text", "markdown", "env", "json", "yaml", "xml", "sql"].map((t) => (
                <span key={t} className="bg-gray-100 px-2.5 py-1 rounded font-mono text-xs">{t}</span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              The content type determines how PlainVault masks sensitive values for VIEWER users:
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 font-medium text-gray-700">Masking Behavior</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono">env</td>
                  <td className="py-2">Masks all <code className="bg-gray-100 px-1 rounded">KEY=value</code> pairs</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono">json</td>
                  <td className="py-2">Masks string values in key-value pairs</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono">yaml</td>
                  <td className="py-2">Masks values in <code className="bg-gray-100 px-1 rounded">key: value</code> pairs</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono">text / others</td>
                  <td className="py-2">Full masking — entire content hidden from VIEWER</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
      <p className="mt-1 text-sm text-gray-500">
        Organize files with color-coded labels. Only ADMIN can create, edit, and delete categories.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>Managing Categories</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4">
              <li>Click your role badge in the top-right corner → <strong>Categories</strong></li>
              <li>Click <strong>&quot;New Category&quot;</strong></li>
              <li>Enter a descriptive name (e.g. &quot;Production&quot;, &quot;AWS Credentials&quot;)</li>
              <li>Pick a color to visually distinguish it in the file list</li>
              <li>Click <strong>Create</strong></li>
            </ol>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { name: "Production", color: "#ef4444" },
                { name: "Development", color: "#22c55e" },
                { name: "Secrets", color: "#f97316" },
                { name: "Config", color: "#3b82f6" },
                { name: "Notes", color: "#8b5cf6" },
              ].map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${c.color}20`,
                    color: c.color,
                    border: `1px solid ${c.color}40`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              A category that has files assigned to it cannot be deleted. Remove all files from the category first, or reassign them to a different category.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Assigning Files to Categories</CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>When <strong>creating</strong> a file — select a category from the dropdown</li>
              <li>When <strong>editing</strong> a file — change the category in the edit form</li>
              <li>Files can exist <strong>without</strong> a category (uncategorized)</li>
              <li>Use the category chips above the file list to <strong>filter</strong> by category</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SearchSection() {
  return (
    <section id="search" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">Search & Filter</h2>
      <p className="mt-1 text-sm text-gray-500">
        Find files quickly using text search and category filters.
      </p>

      <div className="mt-6">
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Text Search</h4>
                <p className="text-sm text-gray-600">Type in the search bar at the top of the files list to filter by title or file name. Results update as you type — no need to press Enter.</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Category Filter</h4>
                <p className="text-sm text-gray-600">Click a colored category chip above the file list to show only files in that category. Click &quot;All&quot; to clear the filter and show every file.</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Combined Filters</h4>
                <p className="text-sm text-gray-600">Text search and category filters work together. For example, search for &quot;api&quot; while filtering by &quot;Production&quot; to find production API-related files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function HistorySection() {
  return (
    <section id="history" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">History & Revisions</h2>
      <p className="mt-1 text-sm text-gray-500">
        Every file edit creates a revision. Browse, compare, and restore previous versions.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>Browsing Revisions</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Open a file detail page</li>
              <li>Click the <strong>&quot;History&quot;</strong> button</li>
              <li>A timeline of all revisions appears, newest first</li>
              <li>Click any revision to view its full content</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">Only DEVELOPER and ADMIN roles can access revision history.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Comparing Revisions</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4">
              <li>Open the revision history panel</li>
              <li>Click one revision to select it</li>
              <li><strong>Cmd+Click</strong> (Mac) or <strong>Ctrl+Click</strong> (Windows/Linux) to select a second revision</li>
              <li>Click <strong>&quot;Compare&quot;</strong> to see the diff</li>
            </ol>
            <p className="text-sm text-gray-600 mb-3">The diff view shows:</p>
            <div className="rounded-md bg-gray-900 p-4 font-mono text-xs space-y-0.5">
              <p className="text-green-400">+ Added line here</p>
              <p className="text-red-400">- Removed line here</p>
              <p className="text-gray-400">&nbsp;&nbsp;Unchanged line</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Restoring a Previous Version</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Open the revision you want to restore</li>
              <li>Click <strong>&quot;Restore&quot;</strong> to apply it as the current version</li>
              <li>Enter a change summary (e.g. &quot;Reverted to v3 config&quot;)</li>
              <li>The restoration itself creates a new revision — the history is never lost</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ApiKeysSection() {
  return (
    <section id="api-keys" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
      <p className="mt-1 text-sm text-gray-500">
        Access files programmatically via REST API using bearer token authentication. Only ADMIN can create and revoke keys.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>Creating an API Key</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Click your role badge in the top-right corner → <strong>API Keys</strong></li>
              <li>Click <strong>&quot;Create Key&quot;</strong></li>
              <li>Give it a descriptive name (e.g. &quot;CI/CD Pipeline&quot;, &quot;Dev Environment&quot;)</li>
              <li>Optionally set an <strong>expiration date</strong></li>
              <li>Click Create — the key is displayed <strong>only once</strong></li>
            </ol>
            <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              Copy the key immediately. It cannot be retrieved after the dialog is closed.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Using API Keys</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Include the key in the Authorization header of your HTTP requests:</p>
            <div className="rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
              <p>Authorization: Bearer sk_test_xxxx</p>
            </div>
            <p className="mt-3 text-sm text-gray-600">Example with curl:</p>
            <CodeBlock lines={["curl -H \"Authorization: Bearer your_key_here\" \\", "  http://localhost:13000/api/files"]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Revoking a Key</CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Navigate to <strong>API Keys</strong> from the admin menu</li>
              <li>Find the key you want to revoke</li>
              <li>Click <strong>&quot;Revoke&quot;</strong></li>
              <li>The key is immediately invalidated — any requests using it will be rejected</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-900">Security</h2>
      <p className="mt-1 text-sm text-gray-500">
        How PlainVault protects your data.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>Encryption at Rest</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              All file content is encrypted with <strong>AES-256-GCM</strong> before being stored in the database. Each file uses a unique salt and IV derived from a master key via <strong>PBKDF2</strong> (100,000 iterations). Even if the database is compromised, content cannot be read without the encryption key.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Secret Masking</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              VIEWER role users see automatically masked content. Sensitive patterns like <code className="bg-gray-100 px-1 rounded text-xs">KEY=value</code> are replaced with <code className="bg-gray-100 px-1 rounded text-xs">KEY=********</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Raw (DEVELOPER / ADMIN)</p>
                <CodeBlock lines={["DATABASE_URL=postgres://user:secret@db:5432", "API_KEY=sk_live_abcdef123456"]} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Masked (VIEWER)</p>
                <CodeBlock lines={["DATABASE_URL=********", "API_KEY=********"]} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>API Key Security</CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>API keys are hashed with <strong>SHA-256</strong> before storage — the raw key is never stored in the database</li>
              <li>Keys are displayed <strong>only once</strong> at creation time</li>
              <li>Keys can have an optional <strong>expiration date</strong></li>
              <li>Revoked keys are <strong>immediately invalidated</strong></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Audit Trail</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Every action is logged for compliance and security reviews. The audit trail captures:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>User login and logout events</li>
              <li>File creation, viewing, editing, and deletion</li>
              <li>Category management operations</li>
              <li>User approval and rejection decisions</li>
              <li>API key creation and revocation</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">Only ADMIN role can view audit logs.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StepBadge({ step, text }: { step: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
        {step}
      </span>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

function RoleCard({ title, color, description }: { title: string; color: string; description: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-700",
    green: "text-green-600",
    gray: "text-gray-600",
  };
  return (
    <Card>
      <CardHeader><span className={colorMap[color] ?? ""}>{title}</span></CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100">
      <h3 className="font-semibold text-gray-900 text-sm">{children}</h3>
    </div>
  );
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4">{children}</div>;
}

function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100 overflow-x-auto">
      {lines.map((line) => (
        <p key={line} className={line.startsWith("#") ? "text-gray-500" : ""}>{line}</p>
      ))}
    </div>
  );
}
