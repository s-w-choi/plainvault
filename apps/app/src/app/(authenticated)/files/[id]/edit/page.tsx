"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFileAction, listFilesAction, updateFileAction } from "@/actions/file-actions";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FileDetail {
  id: string;
  title: string;
  actualFileName: string;
  contentType: string;
  content: string;
  category: { id: string; name: string; color: string } | null;
}

export default function FileEditPage() {
  const t = useTranslations("files");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useUser();
  const [file, setFile] = useState<FileDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    actualFileName: "",
    content: "",
    contentType: "text",
    categoryId: "",
  });
  const [changeSummary, setChangeSummary] = useState("");

  useEffect(() => {
    if (!user) return;

    Promise.all([getFileAction(params.id), listFilesAction()])
      .then(([fileData, filesData]) => {
        if ("error" in fileData) {
          setError(fileData.error.message || t("failedLoad"));
        } else if (fileData.file) {
          const f = fileData.file as FileDetail;
          setFile(f);
          setForm({
            title: f.title,
            actualFileName: f.actualFileName,
            content: f.content,
            contentType: f.contentType,
            categoryId: f.category?.id || "",
          });
        }

        if (!("error" in filesData) && filesData.categories) {
          setCategories(filesData.categories as Category[]);
        }
      })
      .finally(() => setLoading(false));
  }, [user, params.id, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changeSummary.trim()) {
      setError(t("changeSummaryRequired"));
      return;
    }
    if (!file) return;

    setSaving(true);
    setError(null);

    const res = await updateFileAction(file.id, { ...form, changeSummary });

    if (!("error" in res)) {
      router.push(`/files/${file.id}`);
    } else {
      let errorMsg = t("failedSave");
      errorMsg = res.error?.message || errorMsg;
      setError(errorMsg);
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !file) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t("editFile")}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t("fileDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error">{error}</Alert>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">{t("titleField")}</label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label htmlFor="actualFileName" className="block text-sm font-medium text-gray-700 mb-1">{t("fileName")}</label>
                <Input
                  id="actualFileName"
                  value={form.actualFileName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, actualFileName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">{t("contentType")}</label>
                <Select
                  id="contentType"
                  value={form.contentType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, contentType: e.target.value }))}
                >
                  <option value="text">text</option>
                  <option value="json">json</option>
                  <option value="yaml">yaml</option>
                  <option value="xml">xml</option>
                  <option value="sql">sql</option>
                  <option value="env">env</option>
                  <option value="markdown">markdown</option>
                </Select>
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                <Select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">{t("noCategory")}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">{t("content")}</label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="changeSummary" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("changeSummary")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="changeSummary"
                  value={changeSummary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChangeSummary(e.target.value)}
                  placeholder={t("changeSummaryPlaceholder")}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? tCommon("saving") : t("saveChanges")}
            </Button>
            <Link href={`/files/${file.id}`}>
              <Button type="button" variant="outline">{tCommon("cancel")}</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
