import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "PlainVault - Get Started",
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={100} height={100} />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Docs
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
          <p className="mt-2 text-gray-600">
            Install PlainVault and set up your team vault in minutes.
          </p>
        </div>

        <div className="space-y-8">
          <PrerequisitesCard />
          <QuickStartCard />
          <EnvironmentVariablesCard />
          <FirstLoginCard />

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What is PlainVault?</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                PlainVault is a secure internal vault for teams to store and share secrets, configuration files, and secure notes. All content is encrypted with AES-256-GCM and access is controlled by role-based permissions.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Database connection strings and credentials</li>
                <li>API keys for third-party services</li>
                <li>Environment variable configurations (env files)</li>
                <li>SSL certificates and private keys</li>
                <li>Team notes with sensitive information</li>
                <li>Infrastructure configuration (docker-compose, kubernetes configs)</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How access works</h2>
            <div className="space-y-4">
              <StepBadge step={1} text="Request an account — go to the registration page and fill in your name, email, and password" />
              <StepBadge step={2} text="Wait for approval — your administrator will receive your request and approve or reject it" />
              <StepBadge step={3} text="Sign in and start managing files — once approved, log in and browse, create, or edit vault files based on your role" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security model</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <p>All file content is encrypted at rest using AES-256-GCM encryption. Even if the database is compromised, the content cannot be read without the encryption key.</p>
              <p>For VIEWER role users, sensitive values are automatically masked:</p>
              <CodeBlock lines={["# Raw (DEVELOPER / ADMIN)", "DATABASE_URL=postgres://user:secret123@db.example.com:5432", "API_KEY=sk_live_abcdef123456"]} />
              <CodeBlock lines={["# Masked (VIEWER)", "DATABASE_URL=********", "API_KEY=********"]} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-8 border-t border-gray-200">
            <Link
              href="/docs"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
            >
              Read the Docs →
            </Link>
            <span className="text-sm text-gray-500">For detailed usage guides and API reference</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrerequisitesCard() {
  return (
    <Card>
      <CardHeader>Prerequisites</CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Docker 20.10+</li>
          <li>Docker Compose v2 (optional)</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function QuickStartCard() {
  return (
    <Card>
      <CardHeader>Quick Start</CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-600 mb-2">1. Pull the image</p>
            <CodeBlock lines={["# TODO: Update image name after Docker publish", "docker pull boydchoi/plainvault:latest"]} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">2. Run the container</p>
            <CodeBlock lines={["docker run -d \\", "  --name plainvault \\", "  -p 13000:3000 \\", "  -e ENCRYPTION_KEY=\"your-encryption-key\" \\", "  -v plainvault-data:/app/data \\", "  boydchoi/plainvault:latest"]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EnvironmentVariablesCard() {
  return (
    <Card>
      <CardHeader>Environment Variables</CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-700">Variable</th>
              <th className="text-left py-2 pr-4 font-medium text-gray-700">Required</th>
              <th className="text-left py-2 font-medium text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-600">
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-4 font-mono text-indigo-600">ENCRYPTION_KEY</td>
              <td className="py-2 pr-4"><span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Yes</span></td>
              <td className="py-2">Master key for AES-256-GCM encryption</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-4 font-mono text-indigo-600">PORT</td>
              <td className="py-2 pr-4"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">No</span></td>
              <td className="py-2">Server port (default: 3000)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-indigo-600">NODE_ENV</td>
              <td className="py-2 pr-4"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">No</span></td>
              <td className="py-2">production / development</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
          TODO: Additional environment variables will be documented here after Docker publish.
        </p>
      </CardContent>
    </Card>
  );
}

function FirstLoginCard() {
  return (
    <Card>
      <CardHeader>First Login</CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          After starting the container, visit <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">http://localhost:13000</code> and log in:
        </p>
        <div className="bg-gray-100 rounded-md p-4 space-y-1 font-mono text-xs">
          <p><span className="text-gray-500">Email:</span> admin@plainvault.local</p>
          <p><span className="text-gray-500">Password:</span> plainvault-admin</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Override defaults with <code className="bg-gray-100 px-1 rounded">INIT_ADMIN_EMAIL</code> and <code className="bg-gray-100 px-1 rounded">INIT_ADMIN_PASSWORD</code> env vars.
        </p>
      </CardContent>
    </Card>
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
