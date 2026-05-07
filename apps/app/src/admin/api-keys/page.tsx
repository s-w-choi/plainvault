"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function AdminApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
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
        loadKeys();
      });
  }, [router]);

  async function loadKeys() {
    const res = await fetch("/api/admin/api-keys");
    const data = await res.json();
    setApiKeys(data.apiKeys || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: newKeyExpiry ? parseInt(newKeyExpiry, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create API key");
        setCreating(false);
        return;
      }

      setNewKey({ name: data.apiKey.name, key: data.apiKey.key });
      setNewKeyName("");
      setNewKeyExpiry("");
      setShowCreateForm(false);
      await loadKeys();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? Applications using it will stop working.")) return;

    const res = await fetch(`/api/admin/api-keys/${keyId}`, { method: "DELETE" });
    if (res.ok) {
      await loadKeys();
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

  const activeKeys = apiKeys.filter(k => k.status === "ACTIVE");
  const revokedKeys = apiKeys.filter(k => k.status === "REVOKED");

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="admin" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">API Keys</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage API keys for programmatic access
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} size="sm" disabled={showCreateForm}>
            Create API Key
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label htmlFor="keyName" className="text-sm font-medium text-gray-700">Name</label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                      placeholder="Production API Key"
                      required
                      disabled={creating}
                    />
                  </div>
                  <div className="space-y-1.5 w-40">
                    <label htmlFor="keyExpiry" className="text-sm font-medium text-gray-700">Expires (days, optional)</label>
                    <Input
                      id="keyExpiry"
                      type="number"
                      min="1"
                      value={newKeyExpiry}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyExpiry(e.target.value)}
                      placeholder="30"
                      disabled={creating}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={creating}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* New Key Display */}
        {newKey && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-green-800 mb-2">API Key created. Copy it now — you cannot see it again.</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm bg-white border border-green-200 rounded px-3 py-2 font-mono break-all">{newKey.key}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newKey.key);
                    alert("Copied to clipboard");
                  }}
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewKey(null)}
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {activeKeys.length === 0 && revokedKeys.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-gray-500">
              No API keys created yet. Create one to get started.
            </CardContent>
          </Card>
        )}

        {/* Active Keys */}
        {activeKeys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-medium text-gray-700 mb-3">Active Keys</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium text-gray-900">{key.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{key.keyPrefix}...</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((scope) => (
                              <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isExpired(key.expiresAt) ? "text-red-500" : "text-gray-500"}>
                            {key.expiresAt}
                          </span>
                          {isExpired(key.expiresAt) && (
                            <Badge variant="destructive" className="ml-1 text-xs">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{key.lastUsedAt ?? "Never"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(key.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revoked Keys */}
        {revokedKeys.length > 0 && (
          <div>
            <h2 className="text-base font-medium text-gray-700 mb-3">Revoked Keys</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Revoked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revokedKeys.map((key) => (
                      <TableRow key={key.id} className="opacity-60">
                        <TableCell className="font-medium text-gray-900">{key.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{key.keyPrefix}...</code>
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{key.revokedAt ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}