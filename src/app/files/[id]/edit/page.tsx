"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function FileEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
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
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()).catch(() => null),
      fetch(`/api/files/${params.id}`).then(r => r.json()).catch(() => null),
      fetch("/api/files").then(r => r.json()).catch(() => null),
    ]).then(([userData, fileData, filesData]) => {
      if (!userData || !userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);

      if (fileData.error) {
        setError(fileData.error.message || "Failed to load file");
      } else if (fileData.file) {
        const f = fileData.file;
        setFile(f);
        setForm({
          title: f.title,
          actualFileName: f.actualFileName,
          content: f.content,
          contentType: f.contentType,
          categoryId: f.category?.id || "",
        });
      }

      if (filesData.categories) {
        setCategories(filesData.categories);
      }

      setLoading(false);
    });
  }, [router, params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changeSummary.trim()) {
      setError("Change summary is required");
      return;
    }
    if (!file) return;

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, changeSummary }),
    });

    if (res.ok) {
      router.push(`/files/${file.id}`);
    } else {
      let errorMsg = "Failed to save";
      try {
        const data = await res.json();
        errorMsg = data.error?.message || errorMsg;
      } catch {
        errorMsg = `Server error: ${res.status}`;
      }
      setError(errorMsg);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user || !file) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Edit File</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>File Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                <Input
                  value={form.actualFileName}
                  onChange={e => setForm(f => ({ ...f, actualFileName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <Select
                  value={form.contentType}
                  onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Summary <span className="text-red-500">*</span>
                </label>
                <Input
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder="Describe what changed..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href={`/files/${file.id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
