"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { Badge, CategoryBadge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/components/providers/user-provider";
import { createFileAction, deleteFileAction, listFilesAction } from "@/actions/file-actions";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FileSummary {
  id: string;
  title: string;
  actualFileName: string;
  contentType: string;
  updatedAt: string;
  updatedBy: { id: string; name: string; email: string } | null;
  category: { id: string; name: string; color: string } | null;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const user = useUser();
  const [allFiles, setAllFiles] = useState<FileSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // New file form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    actualFileName: "",
    contentType: "text",
    content: "",
    categoryId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    listFilesAction()
      .then((filesData) => {
        if ("error" in filesData) return;
        if (filesData?.files) {
          setAllFiles(filesData.files as FileSummary[]);
          setTotalCount((filesData.files as FileSummary[]).length);
        }
        if (filesData?.categories) {
          setCategories(filesData.categories as Category[]);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const recentFiles = allFiles.slice(0, 3);

  const filteredFiles = allFiles.filter(f => {
    const matchesSearch = !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.actualFileName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || f.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) return null;

  const canCreate = user.role === "ADMIN" || user.role === "DEVELOPER";
  const isAdmin = user.role === "ADMIN";

  async function handleSave() {
    if (!formData.title || !formData.actualFileName) {
      setError(t("titleAndFileNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.categoryId) delete payload.categoryId;

    const res = await createFileAction(payload as {
      title: string;
      actualFileName: string;
      contentType: string;
      content: string;
      categoryId?: string;
    });

    setSaving(false);
    if (!("error" in res)) {
      setShowForm(false);
      setFormData({ title: "", actualFileName: "", contentType: "text", content: "", categoryId: "" });
      const filesData = await listFilesAction();
      if (!("error" in filesData)) {
        setAllFiles((filesData.files as FileSummary[]) || []);
        setTotalCount(((filesData.files as FileSummary[])?.length) || 0);
        if (filesData.categories) setCategories(filesData.categories as Category[]);
      }
    } else {
      let errorMsg = t("failedCreateFile");
      errorMsg = res.error?.message || errorMsg;
      setError(errorMsg);
    }
  }

  async function handleDelete(fileId: string, fileTitle: string) {
    if (!confirm(t("deleteConfirm", { title: fileTitle }))) return;
    setDeletingId(fileId);
    const res = await deleteFileAction(fileId);
    setDeletingId(null);
    if (!("error" in res)) {
      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      setTotalCount(prev => prev - 1);
    }
  }

  if (loading) {
    return <LoadingScreen message={tCommon("loading")} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-8 py-10">
          <div className="absolute top-4 left-4 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-4 right-8 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-40" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("welcomeBack", { name: user.name })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>{t("totalFiles")}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-600">{t("totalFiles")}</p>
                <p className="text-2xl font-bold text-indigo-900">{totalCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>{t("yourRole")}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-green-600">{t("yourRole")}</p>
                <p className="text-2xl font-bold text-green-900 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>{t("status")}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600">{t("status")}</p>
                <p className="text-2xl font-bold text-purple-900">{t("active")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Administration */}
        {(user.role === "ADMIN") && (
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
            <Card className="rounded-xl border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <title>{t("administration")}</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {t("administration")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-3">
                <p className="text-sm text-gray-500">{t("manageDescription")}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" className="rounded-lg">{tNav("users")}</Button>
                  </Link>
                  <Link href="/admin/api-keys">
                    <Button variant="outline" size="sm" className="rounded-lg">{tNav("apiKeys")}</Button>
                  </Link>
                  <Link href="/admin/audit-logs">
                    <Button variant="outline" size="sm" className="rounded-lg">{tNav("auditLogs")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Files */}
        {recentFiles.length > 0 && (
          <Card className="mb-8 rounded-xl hover:shadow-lg hover:shadow-gray-100/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <title>{t("recentFiles")}</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {t("recentFiles")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("titleField")}</TableHead>
                    <TableHead>{t("fileName")}</TableHead>
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{t("updatedBy")}</TableHead>
                    <TableHead>{t("updatedAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-indigo-50/30 transition-colors">
                      <TableCell>
                        <Link href={`/files/${file.id}`} className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
                          {file.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500">{file.actualFileName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md">{file.contentType}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{file.updatedBy?.name ?? "—"}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{file.updatedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* New File Form */}
        {showForm && canCreate && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("createNewFile")}</h2>
              {error && (
                <Alert variant="error" className="mb-4">{error}</Alert>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-file-title" className="block text-sm font-medium text-gray-700 mb-1">{t("titleField")}</label>
                    <Input id="new-file-title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={t("myConfigurationPlaceholder")} />
                  </div>
                  <div>
                    <label htmlFor="new-file-name" className="block text-sm font-medium text-gray-700 mb-1">{t("fileName")}</label>
                    <Input id="new-file-name" value={formData.actualFileName} onChange={e => setFormData({ ...formData, actualFileName: e.target.value })} placeholder={t("fileNamePlaceholder")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-file-content-type" className="block text-sm font-medium text-gray-700 mb-1">{t("contentType")}</label>
                    <Select
                      id="new-file-content-type"
                      value={formData.contentType}
                      onChange={e => setFormData({ ...formData, contentType: e.target.value })}
                    >
                      <option value="text">Text</option>
                      <option value="markdown">Markdown</option>
                      <option value="env">Environment (.env)</option>
                      <option value="json">JSON</option>
                      <option value="yaml">YAML</option>
                      <option value="xml">XML</option>
                      <option value="sql">SQL</option>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="new-file-category" className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                    <Select
                      id="new-file-category"
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">{t("noCategory")}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <label htmlFor="new-file-content" className="block text-sm font-medium text-gray-700 mb-1">{t("content")}</label>
                  <Textarea
                    id="new-file-content"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder={t("contentPlaceholder")}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving}>{saving ? tCommon("saving") : tCommon("save")}</Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setError(null); setFormData({ title: "", actualFileName: "", contentType: "text", content: "", categoryId: "" }); }}>{tCommon("cancel")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Files */}
        <Card className="rounded-xl hover:shadow-lg hover:shadow-gray-100/50 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>{t("allFiles", { count: filteredFiles.length })}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                {t("allFiles", { count: filteredFiles.length })}
              </CardTitle>
              {canCreate && !showForm && (
                <Button onClick={() => setShowForm(true)} size="sm" aria-label={t("createNewFileAria")}>{t("newFile")}</Button>
              )}
            </div>
          </CardHeader>

          {/* Search & Filter */}
          <div className="px-6 pb-3 flex flex-wrap items-center gap-3">
            <Input
              placeholder={t("searchFiles")}
              aria-label={t("searchFiles")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                aria-pressed={!selectedCategory}
                aria-label={t("showAllCategories")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${!selectedCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {tCommon("all")}
              </button>
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  aria-label={t("filterBy", { name: cat.name })}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "text-white"
                      : "hover:opacity-80"
                  }`}
                  style={
                    selectedCategory === cat.id
                      ? { backgroundColor: cat.color }
                      : {
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                          border: `1px solid ${cat.color}40`,
                        }
                  }
                >
                  <span className="w-2 h-2 rounded-full" aria-hidden="true" style={{ backgroundColor: selectedCategory === cat.id ? "white" : cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="pt-0 p-0">
            {filteredFiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>{t("noFiles")}</p>
                {canCreate && <p className="mt-1 text-sm">{t("clickNewFile")}</p>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("titleField")}</TableHead>
                    <TableHead>{t("fileName")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{t("updatedBy")}</TableHead>
                    <TableHead>{t("updatedAt")}</TableHead>
                    {isAdmin && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-indigo-50/30 transition-colors">
                      <TableCell>
                        <Link href={`/files/${file.id}`} className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
                          {file.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{file.actualFileName}</TableCell>
                      <TableCell>
                        {file.category ? (
                          <CategoryBadge name={file.category.name} color={file.category.color} />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{file.contentType}</Badge></TableCell>
                      <TableCell className="text-gray-500">{file.updatedBy?.name ?? "—"}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{file.updatedAt}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={t("deleteConfirm", { title: file.title })}
                            onClick={() => handleDelete(file.id, file.title)}
                            disabled={deletingId === file.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === file.id ? "..." : tCommon("delete")}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
