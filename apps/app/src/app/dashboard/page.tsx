"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
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
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()).catch(() => null),
      fetch("/api/files").then(r => r.json()).catch(() => null),
    ]).then(async ([userData, filesData]) => {
      if (!userData || !userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);
      if (filesData?.files) {
        setAllFiles(filesData.files);
        setTotalCount(filesData.files.length);
      }
      if (filesData?.categories) {
        setCategories(filesData.categories);
      }
      setLoading(false);
    });
  }, [router]);

  const recentFiles = allFiles.slice(0, 3);

  const filteredFiles = allFiles.filter(f => {
    const matchesSearch = !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.actualFileName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || f.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const canCreate = user?.role === "ADMIN" || user?.role === "DEVELOPER";
  const isAdmin = user?.role === "ADMIN";

  async function handleSave() {
    if (!formData.title || !formData.actualFileName) {
      setError("Title and file name are required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.categoryId) delete payload.categoryId;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setFormData({ title: "", actualFileName: "", contentType: "text", content: "", categoryId: "" });
      const filesRes = await fetch("/api/files");
      const data = await filesRes.json();
      setAllFiles(data.files || []);
      setTotalCount(data.files?.length || 0);
    } else {
      let errorMsg = "Failed to create file";
      try {
        const data = await res.json();
        errorMsg = data.error?.message || errorMsg;
      } catch {
        errorMsg = `Server error: ${res.status}`;
      }
      setError(errorMsg);
    }
  }

  async function handleDelete(fileId: string, fileTitle: string) {
    if (!confirm(`Delete "${fileTitle}"?`)) return;
    setDeletingId(fileId);
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      setTotalCount(prev => prev - 1);
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 pb-6">
              <p className="text-sm font-medium text-gray-500">Total Files</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p className="text-sm font-medium text-gray-500">Your Role</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 capitalize">{user.role.toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Administration */}
        {(user.role === "ADMIN") && (
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
            <Card className="hover:border-gray-300 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Administration</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-3">
                <p className="text-sm text-gray-500">Manage users, API keys, and audit logs</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm">Users</Button>
                  </Link>
                  <Link href="/admin/api-keys">
                    <Button variant="outline" size="sm">API Keys</Button>
                  </Link>
                  <Link href="/admin/audit-logs">
                    <Button variant="outline" size="sm">Audit Logs</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Files */}
        {recentFiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Files</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Updated At (KST)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <Link href={`/files/${file.id}`} className="text-indigo-600 hover:text-indigo-700 hover:underline">
                          {file.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500">{file.actualFileName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.contentType}</Badge>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New File</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="My Configuration" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                    <Input value={formData.actualFileName} onChange={e => setFormData({ ...formData, actualFileName: e.target.value })} placeholder=".env, config.yaml" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                    <select
                      value={formData.contentType}
                      onChange={e => setFormData({ ...formData, contentType: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="markdown">Markdown</option>
                      <option value="env">Environment (.env)</option>
                      <option value="json">JSON</option>
                      <option value="yaml">YAML</option>
                      <option value="xml">XML</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">No category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <Textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter file content..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setError(null); setFormData({ title: "", actualFileName: "", contentType: "text", content: "", categoryId: "" }); }}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Files */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Files ({filteredFiles.length})</CardTitle>
              {canCreate && !showForm && (
                <Button onClick={() => setShowForm(true)} size="sm" aria-label="Create new file">New File</Button>
              )}
            </div>
          </CardHeader>

          {/* Search & Filter */}
          <div className="px-6 pb-3 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search files..."
              aria-label="Search files"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory("")}
                aria-pressed={!selectedCategory}
                aria-label="Show all categories"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${!selectedCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  aria-label={`Filter by ${cat.name}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "text-white"
                      : "hover:opacity-80"
                  }`}
                  style={selectedCategory === cat.id ? { backgroundColor: cat.color } : { backgroundColor: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}40` }}
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
                <p>No files found.</p>
                {canCreate && <p className="mt-1 text-sm">Click &quot;New File&quot; to create one.</p>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Updated At (KST)</TableHead>
                    {isAdmin && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <Link href={`/files/${file.id}`} className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
                          {file.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{file.actualFileName}</TableCell>
                      <TableCell>
                        {file.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: file.category.color + "20", color: file.category.color, border: `1px solid ${file.category.color}40` }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: file.category.color }} />
                            {file.category.name}
                          </span>
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
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${file.title}`}
                            onClick={() => handleDelete(file.id, file.title)}
                            disabled={deletingId === file.id}
                            className="text-red-500 hover:text-red-700"
                          >
                            {deletingId === file.id ? "..." : "Delete"}
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