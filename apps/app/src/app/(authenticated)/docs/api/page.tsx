"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";

const CODE_EXAMPLES: Record<
	string,
	{ bash: string; js: string; python: string }
> = {
	"GET /api/v1/files": {
		bash: `curl -H "Authorization: Bearer secvault_abc123def456" \\
  http://localhost:13000/api/v1/files`,
		js: `// List all files via the public v1 API
const res = await fetch('http://localhost:13000/api/v1/files', {
  headers: { Authorization: 'Bearer secvault_abc123def456' }
});
const data = await res.json();
console.log(data);`,
		python: `import requests

# List all files via the public v1 API
res = requests.get(
    'http://localhost:13000/api/v1/files',
    headers={'Authorization': 'Bearer secvault_abc123def456'}
)
print(res.json())`,
	},
	"POST /api/v1/files": {
		bash: `curl -X POST http://localhost:13000/api/v1/files \\
  -H "Authorization: Bearer secvault_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Production API Keys",
    "actualFileName": ".env.production",
    "contentType": "env",
    "content": "API_KEY=secret123"
  }'`,
		js: `// Create a new file via the public v1 API
const res = await fetch('http://localhost:13000/api/v1/files', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer secvault_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Production API Keys',
    actualFileName: '.env.production',
    contentType: 'env',
    content: 'API_KEY=secret123'
  })
});
const data = await res.json();
console.log(data);`,
		python: `import requests

# Create a new file via the public v1 API
res = requests.post(
    'http://localhost:13000/api/v1/files',
    headers={'Authorization': 'Bearer secvault_abc123def456'},
    json={
        'title': 'Production API Keys',
        'actualFileName': '.env.production',
        'contentType': 'env',
        'content': 'API_KEY=secret123'
    }
)
print(res.json())`,
	},
	"GET /api/v1/files/[id]": {
		bash: `curl -H "Authorization: Bearer secvault_abc123def456" \\
  http://localhost:13000/api/v1/files/{id}`,
		js: `// Get file metadata and content via the public v1 API
const res = await fetch('http://localhost:13000/api/v1/files/{id}', {
  headers: { Authorization: 'Bearer secvault_abc123def456' }
});
const data = await res.json();
console.log(data);`,
		python: `import requests

# Get file metadata and content via the public v1 API
res = requests.get(
    'http://localhost:13000/api/v1/files/{id}',
    headers={'Authorization': 'Bearer secvault_abc123def456'}
)
print(res.json())`,
	},
	"PATCH /api/v1/files/[id]": {
		bash: `curl -X PATCH http://localhost:13000/api/v1/files/{id} \\
  -H "Authorization: Bearer secvault_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "UPDATED content here"
  }'`,
		js: `// Update file content via the public v1 API
const res = await fetch('http://localhost:13000/api/v1/files/{id}', {
  method: 'PATCH',
  headers: {
    Authorization: 'Bearer secvault_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content: 'UPDATED content here' })
});
const data = await res.json();
console.log(data);`,
		python: `import requests

# Update file content via the public v1 API
res = requests.patch(
    'http://localhost:13000/api/v1/files/{id}',
    headers={'Authorization': 'Bearer secvault_abc123def456'},
    json={'content': 'UPDATED content here'}
)
print(res.json())`,
	},
	"GET /api/v1/files/[id]/raw": {
		bash: `curl -H "Authorization: Bearer secvault_abc123def456" \\
  http://localhost:13000/api/v1/files/{id}/raw`,
		js: `// Download raw decrypted content via the public v1 API
const res = await fetch('http://localhost:13000/api/v1/files/{id}/raw', {
  headers: { Authorization: 'Bearer secvault_abc123def456' }
});
const data = await res.json();
console.log(data.content);`,
		python: `import requests

# Download raw decrypted content via the public v1 API
res = requests.get(
    'http://localhost:13000/api/v1/files/{id}/raw',
    headers={'Authorization': 'Bearer secvault_abc123def456'}
)
print(res.json()['content'])`,
	},
};

const ENDPOINTS = [
	{
		method: "GET",
		path: "/api/v1/files",
		auth: "API Key",
		desc: "List all files",
	},
	{
		method: "POST",
		path: "/api/v1/files",
		auth: "API Key",
		desc: "Create a new file",
	},
	{
		method: "GET",
		path: "/api/v1/files/[id]",
		auth: "API Key",
		desc: "Get file metadata and content",
	},
	{
		method: "PATCH",
		path: "/api/v1/files/[id]",
		auth: "API Key",
		desc: "Update file content",
	},
	{
		method: "GET",
		path: "/api/v1/files/[id]/raw",
		auth: "API Key",
		desc: "Download raw decrypted content",
	},
];

type Lang = "bash" | "js" | "python";

function CodeBlock({ code, lang }: { code: string; lang: Lang }) {
	const ref = useRef<HTMLPreElement>(null);

	useEffect(() => {
		void code;
		void lang;
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
		<pre
			ref={ref}
			className={`language-${hljsLang[lang]} text-xs font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto`}
		>
			<code>{code}</code>
		</pre>
	);
}

function EndpointCard({ ep }: { ep: (typeof ENDPOINTS)[0] }) {
	const [lang, setLang] = useState<Lang>("bash");
	const examples = CODE_EXAMPLES[`${ep.method} ${ep.path}`];
	const tDocs = useTranslations("docs");

	const methodColors: Record<string, string> = {
		GET: "bg-green-100 text-green-700",
		POST: "bg-blue-100 text-blue-700",
		PATCH: "bg-yellow-100 text-yellow-700",
		DELETE: "bg-red-100 text-red-700",
	};

	const authColors: Record<string, string> = {
		Required: "bg-blue-50 text-blue-700 border-blue-200",
		ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
		"DEVELOPER+": "bg-green-50 text-green-700 border-green-200",
		Public: "bg-gray-50 text-gray-600 border-gray-200",
		"API Key": "bg-orange-50 text-orange-700 border-orange-200",
	};

	return (
		<div className="border border-gray-200 rounded-lg overflow-hidden">
			<div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span
						className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[ep.method]}`}
					>
						{ep.method}
					</span>
					<code className="text-sm font-mono text-gray-800">{ep.path}</code>
				</div>
				<span
					className={`px-2 py-0.5 rounded text-xs border ${authColors[ep.auth]}`}
				>
					{ep.auth}
				</span>
			</div>
			<div className="p-4">
				<p className="text-sm text-gray-600 mb-3">{ep.desc}</p>
				<div className="flex gap-1 mb-3">
					{(["bash", "js", "python"] as Lang[]).map((l) => (
						<button
							key={l}
							type="button"
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
					<p className="text-xs text-gray-400 italic">
						{tDocs("noCodeExample")}
					</p>
				)}
			</div>
		</div>
	);
}

export default function ApiDocsPage() {
	const tDocs = useTranslations("docs");
	const [active, setActive] = useState("overview");
	const user = useUser();

	if (!user) return null;

	const sections = [
		{ id: "overview", label: tDocs("overview") },
		{ id: "authentication", label: tDocs("authentication") },
		{ id: "files", label: tDocs("files") },
	];

	const filteredEndpoints = ENDPOINTS.filter((ep) => {
		if (active === "overview") return true;
		if (active === "authentication") return false;
		if (active === "files") return ep.path.startsWith("/api/v1/files");
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
									type="button"
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
							<h1 className="text-2xl font-bold text-gray-900">
								{tDocs("apiReference")}
							</h1>
							<p className="mt-1 text-sm text-gray-500">
								{tDocs("apiSubtitle")}
							</p>
						</div>

						{active === "overview" && (
							<div className="space-y-6">
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<h3 className="font-medium text-blue-800 mb-2">
										{tDocs("baseUrl")}
									</h3>
									<code className="text-sm font-mono text-blue-700">
										http://localhost:13000
									</code>
									<p className="mt-2 text-sm text-blue-700">
										Public API endpoints are versioned under{" "}
										<code className="bg-blue-100 px-1 rounded">/api/v1</code>{" "}
										and use Bearer token authentication. Internal{" "}
										<code className="bg-blue-100 px-1 rounded">/api/*</code>{" "}
										endpoints are used by the web app and are not part of the
										public API contract.
									</p>
								</div>

								<div>
									<h3 className="font-medium text-gray-800 mb-3">
										{tDocs("allEndpoints")}
									</h3>
									<div className="space-y-2">
										{ENDPOINTS.map((ep) => (
											<EndpointCard key={`${ep.method} ${ep.path}`} ep={ep} />
										))}
									</div>
								</div>
							</div>
						)}

						{active !== "overview" && active !== "authentication" && (
							<div className="space-y-4">
								{filteredEndpoints.map((ep) => (
									<EndpointCard key={`${ep.method} ${ep.path}`} ep={ep} />
								))}
							</div>
						)}

						{active === "authentication" && (
							<div className="space-y-6">
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<h3 className="font-medium text-blue-800 mb-2">
										{tDocs("api.sessionAuth")}
									</h3>
									<p className="text-sm text-blue-700 mb-2">
										{tDocs.rich("api.sessionAuthDescription", {
											loginEndpoint: (chunks) => (
												<code className="bg-blue-100 px-1 rounded">
													{chunks}
												</code>
											),
											curlFlag: (chunks) => (
												<code className="bg-blue-100 px-1 rounded">
													{chunks}
												</code>
											),
											fetchCredentials: (chunks) => (
												<code className="bg-blue-100 px-1 rounded">
													{chunks}
												</code>
											),
											pythonSession: (chunks) => (
												<code className="bg-blue-100 px-1 rounded">
													{chunks}
												</code>
											),
										})}
									</p>
									<p className="text-xs text-blue-700">
										Internal session-cookie endpoints under{" "}
										<code className="bg-blue-100 px-1 rounded">/api/*</code> are
										used by the web UI and are not part of the public API.
									</p>
								</div>

								<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
									<h3 className="font-medium text-orange-800 mb-2">
										{tDocs("api.apiKeyAuth")}
									</h3>
									<p className="text-sm text-orange-700 mb-3">
										{tDocs.rich("api.apiKeyAuthDescription", {
											createKeyEndpoint: (chunks) => (
												<code className="bg-orange-100 px-1 rounded">
													{chunks}
												</code>
											),
										})}
									</p>
									<div className="bg-gray-900 rounded p-3 font-mono text-sm text-green-400">
										<p>{tDocs("api.includeApiKeyHeader")}</p>
										<p>Authorization: Bearer secvault_your_api_key_here</p>
									</div>
									<div className="mt-3 text-xs text-orange-600 space-y-1">
										<p>
											•{" "}
											{tDocs.rich("api.apiKeyPrefix", {
												prefix: (chunks) => (
													<code className="bg-orange-100 px-1 rounded">
														{chunks}
													</code>
												),
											})}
										</p>
										<p>
											•{" "}
											{tDocs.rich("api.apiKeyScopes", {
												scope: (chunks) => (
													<code className="bg-orange-100 px-1 rounded">
														{chunks}
													</code>
												),
											})}
										</p>
										<p>
											• Available scopes:{" "}
											<code className="bg-orange-100 px-1 rounded">
												files:read
											</code>
											,{" "}
											<code className="bg-orange-100 px-1 rounded">
												files:write
											</code>
											,{" "}
											<code className="bg-orange-100 px-1 rounded">
												files:read_raw
											</code>
										</p>
										<p>• {tDocs("api.apiKeyExpiry")}</p>
										<p>
											•{" "}
											{tDocs.rich("api.apiKeyRevoked", {
												status: (chunks) => (
													<code className="bg-orange-100 px-1 rounded">
														{chunks}
													</code>
												),
											})}
										</p>
									</div>
								</div>

								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
									<h3 className="font-medium text-gray-800 mb-2">
										{tDocs("api.fileRetrievalComparison")}
									</h3>
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b">
													<th className="text-left py-2 px-3">
														{tDocs("api.method")}
													</th>
													<th className="text-left py-2 px-3">
														{tDocs("api.endpoint")}
													</th>
													<th className="text-left py-2 px-3">
														{tDocs("api.auth")}
													</th>
													<th className="text-left py-2 px-3">
														{tDocs("api.useCase")}
													</th>
												</tr>
											</thead>
											<tbody className="text-xs">
												<tr className="border-b">
													<td className="py-2 px-3 font-mono">GET</td>
													<td className="py-2 px-3 font-mono">
														/api/files/[id] (internal)
													</td>
													<td className="py-2 px-3">
														{tDocs("api.sessionCookie")}
													</td>
													<td className="py-2 px-3">
														{tDocs("api.getMetadataUseCase")}
													</td>
												</tr>
												<tr className="border-b">
													<td className="py-2 px-3 font-mono">GET</td>
													<td className="py-2 px-3 font-mono">
														/api/files/[id]/raw (internal)
													</td>
													<td className="py-2 px-3">
														{tDocs("api.sessionCookie")}
													</td>
													<td className="py-2 px-3">
														{tDocs("api.getRawContentUseCase")}
													</td>
												</tr>
												<tr>
													<td className="py-2 px-3 font-mono">GET</td>
													<td className="py-2 px-3 font-mono">
														/api/v1/files/[id]/raw
													</td>
													<td className="py-2 px-3">
														{tDocs("api.bearerToken")}
													</td>
													<td className="py-2 px-3">
														{tDocs("api.getProgrammaticUseCase")}
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
