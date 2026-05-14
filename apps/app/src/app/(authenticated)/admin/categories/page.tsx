"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";
import { Alert } from "@/components/ui/alert";
import { CategoryBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategoryAction, deleteCategoryAction, listCategoriesAction } from "@/actions/admin-actions";

interface Category {
  id: string;
  name: string;
  color: string;
  fileCount: number;
}

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#1e293b",
];

export default function AdminCategoriesPage() {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("admin.users");

  const router = useRouter();
  const user = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const data = await listCategoriesAction();
      if (data && "error" in data) {
        setCategories([]);
      } else {
        setCategories(data.categories || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    (async () => {
      await loadCategories();
    })();
  }, [user, router, loadCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await createCategoryAction(name.trim(), color);
      if (result && "error" in result) {
        setError(result.error || t("failedCreate"));
        return;
      }
      setShowForm(false);
      setName("");
      setColor(COLOR_PRESETS[0]);
      loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(t("deleteConfirm", { name: catName }))) return;
    const result = await deleteCategoryAction(id);
    if (result && "error" in result) {
      alert(result.error || t("failedDelete"));
      return;
    }
    loadCategories();
  }

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="admin" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">{t("newCategory")}</Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("createCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-4">{error}</Alert>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">{t("name")}</label>
                    <Input
                      id="category-name"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="category-color" className="block text-sm font-medium text-gray-700 mb-1">{t("color")}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {COLOR_PRESETS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className="w-6 h-6 rounded-full border-2 transition-transform"
                            style={{ backgroundColor: c, transform: color === c ? 'scale(1.2)' : 'scale(1)' }}
                          />
                        ))}
                      </div>
                      <input
                        id="category-color"
                        type="color"
                        value={color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={saving}>{saving ? t("creating") : tCommon("create")}</Button>
                  <Button variant="outline" type="button" onClick={() => { setShowForm(false); setError(""); }}>{tCommon("cancel")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>{tUsers("noCategories")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("preview")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("color")}</TableHead>
                    <TableHead>{t("files")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <CategoryBadge name={cat.name} color={cat.color} />
                        </TableCell>
                      <TableCell className="font-medium text-gray-900">{cat.name}</TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-500">{cat.color}</code>
                      </TableCell>
                      <TableCell className="text-gray-500">{cat.fileCount}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {tCommon("delete")}
                        </Button>
                      </TableCell>
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
