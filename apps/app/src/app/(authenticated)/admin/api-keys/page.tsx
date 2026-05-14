"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createApiKeyAction, listApiKeysAction, revokeApiKeyAction, updateApiKeyScopesAction } from "@/actions/admin-actions";

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

export default function AdminApiKeysPage() {
  const t = useTranslations("admin.apiKeys");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["files:read", "files:read_raw"]);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [error, setError] = useState("");

  const loadKeys = useCallback(async () => {
    try {
      const data = await listApiKeysAction();
      if (data && "error" in data) {
        setApiKeys([]);
      } else {
        setApiKeys(data.apiKeys || []);
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
      await loadKeys();
    })();
  }, [user, router, loadKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const result = await createApiKeyAction(
        newKeyName,
        newKeyExpiry ? parseInt(newKeyExpiry, 10) : undefined,
        newKeyScopes
      );

      if (result && "error" in result) {
        setError(result.error || tAuth("unexpectedError"));
        return;
      }

      setNewKey({ name: result.apiKey.name, key: result.apiKey.key });
      setNewKeyName("");
      setNewKeyExpiry("");
      setNewKeyScopes(["files:read", "files:read_raw"]);
      setShowCreateForm(false);
      await loadKeys();
    } catch {
      setError(tAuth("unexpectedError"));
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm(t("revokeConfirm"))) return;

    const result = await revokeApiKeyAction(keyId);
    if (result && !("error" in result)) {
      await loadKeys();
    }
  }

  async function handleSaveScopes(keyId: string) {
    const result = await updateApiKeyScopesAction(keyId, editScopes);
    if (result && !("error" in result)) {
      setEditingKeyId(null);
      await loadKeys();
    }
  }

  if (loading) {
    return <LoadingScreen />;
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
            <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("description")}
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} size="sm" disabled={showCreateForm}>
            {t("createApiKey")}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("newApiKey")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <Alert variant="error">{error}</Alert>
                )}
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label htmlFor="keyName" className="text-sm font-medium text-gray-700">{t("name")}</label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      required
                      disabled={creating}
                    />
                  </div>
                  <div className="space-y-1.5 w-40">
                    <label htmlFor="keyExpiry" className="text-sm font-medium text-gray-700">{t("expiresDays")}</label>
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
                    <Button type="submit" disabled={creating || newKeyScopes.length === 0}>
                      {creating ? t("creating") : t("create")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={creating}>
                      {tCommon("cancel")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">{t("scopes")}</label>
                  <div className="flex flex-wrap gap-3">
                    {(["files:read", "files:read_raw", "files:write"] as const).map((scope) => (
                      <label key={scope} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyScopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyScopes([...newKeyScopes, scope]);
                            } else {
                              setNewKeyScopes(newKeyScopes.filter((s) => s !== scope));
                            }
                          }}
                          disabled={creating}
                          className="rounded border-gray-300"
                        />
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{scope}</code>
                      </label>
                    ))}
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
              <p className="text-sm font-medium text-green-800 mb-2">{t("keyCreated")}</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm bg-white border border-green-200 rounded px-3 py-2 font-mono break-all">{newKey.key}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newKey.key);
                    alert(t("copied"));
                  }}
                >
                  {t("copy")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewKey(null)}
                >
                  {t("done")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {activeKeys.length === 0 && revokedKeys.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-gray-500">
              {t("noKeys")}
            </CardContent>
          </Card>
        )}

        {/* Active Keys */}
        {activeKeys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-medium text-gray-700 mb-3">{t("activeKeys")}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("prefix")}</TableHead>
                      <TableHead>{t("scopes")}</TableHead>
                      <TableHead>{t("expires")}</TableHead>
                      <TableHead>{t("lastUsed")}</TableHead>
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
                          {editingKeyId === key.id ? (
                            <div className="flex items-center gap-2">
                              {(["files:read", "files:read_raw", "files:write"] as const).map((scope) => (
                                <label key={scope} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editScopes.includes(scope)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditScopes([...editScopes, scope]);
                                      } else {
                                        setEditScopes(editScopes.filter((s) => s !== scope));
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <code className="bg-gray-100 px-1 py-0.5 rounded">{scope}</code>
                                </label>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveScopes(key.id)}
                                disabled={editScopes.length === 0}
                              >
                                {tCommon("save")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingKeyId(null)}
                              >
                                {tCommon("cancel")}
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="flex flex-wrap gap-1 cursor-pointer"
                              onClick={() => {
                                setEditingKeyId(key.id);
                                setEditScopes(key.scopes);
                              }}
                            >
                              {key.scopes.map((scope) => (
                                <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={isExpired(key.expiresAt) ? "text-red-500" : "text-gray-500"}>
                            {key.expiresAt}
                          </span>
                          {isExpired(key.expiresAt) && (
                            <Badge variant="destructive" className="ml-1 text-xs">{t("expired")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{key.lastUsedAt ?? t("never")}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(key.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {t("revoke")}
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
            <h2 className="text-base font-medium text-gray-700 mb-3">{t("revokedKeys")}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("prefix")}</TableHead>
                      <TableHead>{t("revokedAt")}</TableHead>
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
