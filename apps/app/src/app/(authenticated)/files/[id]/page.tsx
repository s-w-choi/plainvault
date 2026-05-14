"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, CategoryBadge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useUser } from "@/components/providers/user-provider";
import { deleteFileAction, getFileAction } from "@/actions/file-actions";

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

function CurlModal({
  fileId,
  onClose,
}: {
  fileId: string;
  onClose: () => void;
}) {
  const t = useTranslations("files");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1`
      : "http://localhost:13000/api/v1";

  const commands = [
    {
      label: t("getFile"),
      curl: `curl -H "Authorization: Bearer secvault_YOUR_API_KEY" \\\n  ${baseUrl}/files/${fileId}`,
    },
    {
      label: t("getRawFile"),
      curl: `curl -H "Authorization: Bearer secvault_YOUR_API_KEY" \\\n  ${baseUrl}/files/${fileId}/raw`,
    },
  ];

  const handleCopy = useCallback(
    async (text: string, index: number) => {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    },
    [],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("apiCallTitle")}
      onClick={handleBackdropClick}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="text-base">{t("apiCallTitle")}</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {t("apiCallDescription")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {commands.map((cmd) => (
            <div key={cmd.label}>
              <p className="text-xs font-medium text-gray-700 mb-1">
                {cmd.label}
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs font-mono rounded-md p-3 pr-20 overflow-x-auto whitespace-pre-wrap break-all">
                  {cmd.curl}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(cmd.curl, commands.indexOf(cmd))}
                >
                  {copiedIndex === commands.indexOf(cmd) ? t("copied") : t("copy")}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FileDetailPage() {
  const t = useTranslations("files");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useUser();
  const [file, setFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    getFileAction(params.id)
      .then((fileData) => {
        if ("error" in fileData) {
          setError(fileData.error.message || t("failedLoad"));
        } else if (fileData.file) {
          setFile(fileData.file as FileDetail);
        }
      })
      .finally(() => setLoading(false));
  }, [user, params.id, t]);

  // Apply syntax highlighting
  useEffect(() => {
    if (contentRef.current && file) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [file]);

  async function handleDelete() {
    if (!file || !confirm(t("deleteConfirm", { title: file.title }))) return;
    setDeleting(true);
    const res = await deleteFileAction(file.id);
    if (!("error" in res)) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
      setError(t("failedDelete"));
    }
  }

  if (loading) {
    return <LoadingScreen />;
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
              <p className="text-red-600">{error || t("notFound")}</p>
              <Link href="/dashboard">
                <Button variant="outline" className="mt-4">{t("backToDashboard")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function getHighlightLanguage(contentType: string): string {
    const langMap: Record<string, string> = {
      json: "json",
      yaml: "yaml",
      xml: "xml",
      sql: "sql",
      markdown: "markdown",
      env: "bash",
      text: "plaintext",
    };

    return langMap[contentType] || "plaintext";
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiModal(true)}
            >
              {t("apiCall")}
            </Button>
            {canEdit && (
              <Link href={`/files/${file.id}/edit`}>
                <Button variant="outline" size="sm">{tCommon("edit")}</Button>
              </Link>
            )}
            <Link href={`/files/${file.id}/history`}>
              <Button variant="outline" size="sm">{t("history")}</Button>
            </Link>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-700"
              >
                {deleting ? tCommon("deleting") : tCommon("delete")}
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
          <Badge variant="secondary">{file.contentType}</Badge>
          {file.category && (
            <CategoryBadge name={file.category.name} color={file.category.color} />
          )}
          <span>{t("createdBy", { name: file.createdBy?.name ?? "—" })}</span>
          <span>·</span>
          <span>{t("updatedBy", { name: file.updatedBy?.name ?? "—" })}</span>
          <span>·</span>
          <span>{file.updatedAt}</span>
          {isViewer && (
            <>
              <span>·</span>
              <span className="text-yellow-600">{t("maskedView")}</span>
            </>
          )}
        </div>

        {/* Content */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t("content")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              ref={contentRef}
              className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-all bg-gray-50 rounded-md p-4 border border-gray-200 max-h-[600px] overflow-y-auto"
            >
              <pre>
                <code className={`language-${getHighlightLanguage(file.contentType)}`}>{file.content}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* SHA256 */}
        <div className="mt-4 text-xs text-gray-400 font-mono">
          SHA256: {file.contentSha256}
        </div>
      </div>

      {/* API Call Modal */}
      {showApiModal && (
        <CurlModal fileId={file.id} onClose={() => setShowApiModal(false)} />
      )}
    </div>
  );
}
