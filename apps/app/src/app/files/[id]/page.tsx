"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FileDetail {
  id: string;
  title: string;
  actualFileName: string;
  contentType: string;
  content: string;
  contentSha256: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string } | null;
  createdBy: { id: string; name: string; email: string } | null;
  updatedBy: { id: string; name: string; email: string } | null;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function FileDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [file, setFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()).catch(() => null),
      fetch(`/api/files/${params.id}`).then(r => r.json()).catch(() => null),
    ]).then(([userData, fileData]) => {
      if (!userData || !userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);
      if (fileData.error) {
        setError(fileData.error.message || "Failed to load file");
      } else if (fileData.file) {
        setFile(fileData.file);
      }
      setLoading(false);
    });
  }, [router, params.id]);

  // Apply syntax highlighting
  useEffect(() => {
    if (contentRef.current && file) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [file]);

  async function handleDelete() {
    if (!file || !confirm(`Delete "${file.title}"?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
      setError("Failed to delete file");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const canEdit = user.role === "ADMIN" || user.role === "DEVELOPER";
  const isViewer = user.role === "VIEWER";

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user} activeTab="dashboard" />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error || "File not found"}</p>
              <Link href="/dashboard">
                <Button variant="outline" className="mt-4">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function highlightContent(content: string, contentType: string): string {
    const langMap: Record<string, string> = {
      json: "json",
      yaml: "yaml",
      xml: "xml",
      sql: "sql",
      markdown: "markdown",
      env: "bash",
      text: "plaintext",
    };
    const lang = langMap[contentType] || "plaintext";
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{file.title}</h1>
              <p className="text-sm text-gray-500 font-mono">{file.actualFileName}</p>
            </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/files/${file.id}/edit`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            )}
            <Link href={`/files/${file.id}/history`}>
              <Button variant="ghost" size="sm">History</Button>
            </Link>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
          <Badge variant="secondary">{file.contentType}</Badge>
          {file.category && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium"
              style={{ backgroundColor: file.category.color + "20", color: file.category.color, border: `1px solid ${file.category.color}40` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: file.category.color }} />
              {file.category.name}
            </span>
          )}
          <span>Created by {file.createdBy?.name ?? "—"}</span>
          <span>·</span>
          <span>Updated by {file.updatedBy?.name ?? "—"}</span>
          <span>·</span>
          <span>{file.updatedAt}</span>
          {isViewer && (
            <>
              <span>·</span>
              <span className="text-yellow-600">🔒 Masked view</span>
            </>
          )}
        </div>

        {/* Content */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              ref={contentRef}
              className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-all bg-gray-50 rounded-md p-4 border border-gray-200 max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: highlightContent(file.content, file.contentType) }}
            />
          </CardContent>
        </Card>

        {/* SHA256 */}
        <div className="mt-4 text-xs text-gray-400 font-mono">
          SHA256: {file.contentSha256}
        </div>
      </div>
    </div>
  );
}