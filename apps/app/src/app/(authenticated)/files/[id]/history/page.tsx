"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  getFileAction,
  getFileRevisionDiffAction,
  getFileRevisionsAction,
  restoreFileRevisionAction,
} from "@/actions/file-actions";

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

export default function FileHistoryPage() {
  const t = useTranslations("files");
  const tCommon = useTranslations("common");
  const tAuditLogs = useTranslations("admin.auditLogs");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useUser();
  const [file, setFile] = useState<FileDetail | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.role === "VIEWER") {
      router.push(`/files/${params.id}`);
      return;
    }

    getFileAction(params.id)
      .then((fileData) => {
        if ("error" in fileData) {
          setError(fileData.error.message || t("failedLoad"));
        } else if (fileData.file) {
          setFile(fileData.file as FileDetail);
        }
      })
      .finally(() => setLoading(false));

    getFileRevisionsAction(params.id)
      .then((data) => {
        if ("error" in data) {
          setError(prev => prev || data.error.message || t("failedLoad"));
          return;
        }
        if (data.revisions) {
          setRevisions(data.revisions as Revision[]);
        }
      })
      .catch(() => {
        setError(prev => prev || t("failedLoad"));
      });
  }, [user, router, params.id, t]);

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
      const data = await getFileRevisionDiffAction(params.id, rev.id);
      if (!("error" in data) && data.diff) {
        setDiff(data as DiffResult);
      }
    } catch {
      setError(t("failedLoadDiff"));
    } finally {
      setLoadingDiff(false);
    }
  }

  async function handleRestore(rev: Revision) {
    if (!confirm(t("restoreConfirm", { number: rev.revisionNumber }))) {
      return;
    }

    try {
      setError(null);
      const data = await restoreFileRevisionAction(params.id, rev.id);
      if ("error" in data) {
        setError(data.error?.message || t("failedRestore"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("failedRestore"));
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t("versionHistory")}</h1>
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
            <CardTitle>{t("revisions", { count: revisions.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {revisions.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("noRevisions")}</p>
            ) : (
              <div className="space-y-4">
                {revisions.map((rev, idx) => (
                  <div key={rev.id}>
                    {/* biome-ignore lint/a11y/useSemanticElements: avoid nested buttons inside a fully clickable row */}
                    <div
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors cursor-pointer ${
                        selectedRevision?.id === rev.id
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleViewDiff(rev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleViewDiff(rev);
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                          v{rev.revisionNumber}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {rev.changedBy?.name ?? tCommon("unknown")}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{rev.changedAt}</span>
                          {idx === 0 && (
                            <Badge variant="secondary" className="text-xs">{t("latest")}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rev.changeSummary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                          <span title={tAuditLogs("previous")}>← {rev.contentSha256Before?.slice(0, 12) ?? t("initial")}...</span>
                          <span title={tAuditLogs("next")}>→ {rev.contentSha256After.slice(0, 12)}...</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {idx !== 0 && ['ADMIN', 'DEVELOPER'].includes(user.role) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleRestore(rev);
                              }}
                            >
                              {t("restore")}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleViewDiff(rev);
                            }}
                          >
                            {selectedRevision?.id === rev.id ? t("hideDiff") : t("viewDiff")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Diff Panel */}
                    {selectedRevision?.id === rev.id && (
                      <div className="mt-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-300">
                            {t("diff", {
                              range: diff?.previousRevisionNumber
                                ? `v${diff.previousRevisionNumber} → v${diff.currentRevisionNumber}`
                                : `v${rev.revisionNumber} (${t("initial")})`,
                            })}
                          </span>
                          {loadingDiff && <span className="text-xs text-gray-500">{tCommon("loading")}</span>}
                        </div>
                        {diff?.diff?.lines && (
                          <div className="font-mono text-xs overflow-x-auto">
                            {diff.diff.lines.map((line) => (
                              <div
                                key={`${line.type}:${line.oldLineNumber ?? ''}:${line.newLineNumber ?? ''}:${line.content}`}
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
