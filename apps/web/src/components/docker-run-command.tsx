"use client";

import { useCallback, useState } from "react";

function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCommand(key: string): string {
  return `docker run -d \\
  --name plainvault \\
  -p 13000:3000 \\
  -e VAULT_ENCRYPTION_KEY="${key}" \\
  -e INIT_ADMIN_EMAIL="admin@plainvault.local" \\
  -e INIT_ADMIN_PASSWORD="plainvault-admin" \\
  -v plainvault-data:/app/prisma/data \\
  boydchoi/plainvault:latest`;
}

export function DockerRunCommand() {
  const [key, setKey] = useState<string>(() => generateKey());
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setKey(generateKey());
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCommand(key));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [key]);

  const code = key ? buildCommand(key) : "Generating encryption key...";

  return (
    <div className="relative group">
      <pre
        className="bg-gray-900 text-white text-xs rounded-lg p-4 pr-20 overflow-x-auto font-mono"
        style={{ whiteSpace: "pre", wordBreak: "break-all", userSelect: "all" }}
      >
        {code}
      </pre>
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={regenerate}
          className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Regenerate key"
          aria-label="Regenerate encryption key"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <title>Regenerate</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          title={copied ? "Copied!" : "Copy to clipboard"}
          aria-label={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Checkmark</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Copy</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
