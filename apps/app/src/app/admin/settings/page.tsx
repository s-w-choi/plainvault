"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingDef {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number";
  defaultValue: string;
}

function SettingsContent() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [definitions, setDefinitions] = useState<SettingDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        if (data.user.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        return fetch("/api/admin/settings");
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data?.settings) {
          setValues(data.settings);
        }
        if (data?.definitions) {
          setDefinitions(data.definitions);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (res.ok) {
        setSuccess("Settings saved successfully.");
      }
    } finally {
      setSaving(false);
    }
  }

  function updateValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
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

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 py-5">
          <div className="absolute top-2 right-8 w-24 h-24 bg-purple-100 rounded-full blur-3xl opacity-40" />
          <div className="relative">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure application behavior and security policies.</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
        )}

        <div className="space-y-4">
          {definitions.map((def) => (
            <Card key={def.key}>
              <CardHeader>
                <CardTitle className="text-base">{def.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">{def.description}</p>
                {def.type === "boolean" ? (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={values[def.key] === "true"}
                      onChange={(e) => updateValue(def.key, String(e.target.checked))}
                    />
                    <span className="text-sm text-gray-700">{values[def.key] === "true" ? "Enabled" : "Disabled"}</span>
                  </label>
                ) : (
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={values[def.key] ?? def.defaultValue}
                    onChange={(e) => updateValue(def.key, e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
