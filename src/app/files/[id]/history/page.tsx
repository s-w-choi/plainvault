"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Revision {
  id: string;
  revisionNumber: number;
  changeSummary: string;
  contentSha256Before: string | null;
  contentSha256After: string;
  changedAt: string;
  changedBy: { id: string; name: string; email: string } | null;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffResult {
  diff: {
    lines: DiffLine[];
    hasChanges: boolean;
  };
  previousRevisionNumber: number | null;
  currentRevisionNumber: number;
}

interface FileDetail {
  id: string;
  title: string;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function FileHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [file, setFile] = useState<FileDetail | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

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

    fetch(`/api/files/${params.id}/revisions`)
      .then(r => r.json())
      .then(data => {
        if (data.revisions) {
          setRevisions(data.revisions);
        }
      })
      .catch(() => null);
  }, [router, params.id]);

  async function handleViewDiff(rev: Revision) {
    if (selectedRevision?.id === rev.id) {
      setSelectedRevision(null);
      setDiff(null);
      return;
    }
    setSelectedRevision(rev);
    setLoadingDiff(true);
    setDiff(null);

    try {
      const res = await fetch(`/api/files/${params.id}/revisions/${rev.id}/diff`);
      const data = await res.json();
      if (data.diff) {
        setDiff(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDiff(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Version History</h1>
            {file && (
              <p className="text-sm text-gray-500">{file.title}</p>
            )}
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Revisions */}
        <Card>
          <CardHeader>
            <CardTitle>Revisions ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {revisions.length === 0 ? (
              <p className="text-gray-500 text-sm">No revisions yet.</p>
            ) : (
              <div className="space-y-4">
                {revisions.map((rev, idx) => (
                  <div key={rev.id}>
                    <div
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors cursor-pointer ${
                        selectedRevision?.id === rev.id
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleViewDiff(rev)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                          v{rev.revisionNumber}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {rev.changedBy?.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{rev.changedAt}</span>
                          {idx === 0 && (
                            <Badge variant="secondary" className="text-xs">Latest</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rev.changeSummary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                          <span title="Before">← {rev.contentSha256Before?.slice(0, 12) ?? "initial"}...</span>
                          <span title="After">→ {rev.contentSha256After.slice(0, 12)}...</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDiff(rev);
                          }}
                        >
                          {selectedRevision?.id === rev.id ? "Hide Diff" : "View Diff"}
                        </Button>
                      </div>
                    </div>

                    {/* Diff Panel */}
                    {selectedRevision?.id === rev.id && (
                      <div className="mt-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-300">
                            Diff {diff?.previousRevisionNumber ? `v${diff.previousRevisionNumber} → v${diff.currentRevisionNumber}` : `v${rev.revisionNumber} (initial)`}
                          </span>
                          {loadingDiff && <span className="text-xs text-gray-500">Loading...</span>}
                        </div>
                        {diff?.diff?.lines && (
                          <div className="font-mono text-xs overflow-x-auto">
                            {diff.diff.lines.map((line, i) => (
                              <div
                                key={i}
                                className={`px-3 py-0.5 ${
                                  line.type === "added"
                                    ? "bg-green-900/50 text-green-300"
                                    : line.type === "removed"
                                    ? "bg-red-900/50 text-red-300"
                                    : "text-gray-500"
                                }`}
                              >
                                <span className="inline-block w-8 text-gray-600">
                                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                                </span>
                                {line.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
