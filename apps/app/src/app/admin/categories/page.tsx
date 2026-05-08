"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.user || data.user.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        setUser(data.user);
        loadCategories();
      });
  }, [router]);

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setName("");
      setColor(COLOR_PRESETS[0]);
      loadCategories();
    } else {
      const data = await res.json();
      setError(data.error?.message || "Failed to create");
    }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Delete category "${catName}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadCategories();
    } else {
      const data = await res.json();
      alert(data.error?.message || "Failed to delete");
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
      <AppHeader user={user} activeTab="admin" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">New Category</Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create Category</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="e.g. Production, Development"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
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
                        type="color"
                        value={color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
                  <Button variant="outline" type="button" onClick={() => { setShowForm(false); setError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No categories yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}40` }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{cat.name}</TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-500">{cat.color}</code>
                      </TableCell>
                      <TableCell className="text-gray-500">{cat.fileCount}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
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