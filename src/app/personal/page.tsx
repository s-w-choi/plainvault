"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
}

function PersonalContent() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "password">("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading && !user) {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error?.message || "Failed to change password");
      } else {
        setPasswordSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="personal" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Personal</h1>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "profile"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setTab("password")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "password"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Change Password
          </button>
        </div>

        {tab === "profile" && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm text-gray-900 col-span-2">{user.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 col-span-2">{user.email}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <div className="col-span-2">
                    {user.role === "ADMIN" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 shrink-0 whitespace-nowrap">Admin</span>}
                    {user.role === "DEVELOPER" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 shrink-0 whitespace-nowrap">Developer</span>}
                    {user.role === "VIEWER" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 bg-white shrink-0 whitespace-nowrap">Viewer</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="col-span-2">
                    {user.status === "APPROVED" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 shrink-0 whitespace-nowrap">Approved</span>}
                    {user.status === "PENDING" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 shrink-0 whitespace-nowrap">Pending</span>}
                    {user.status === "REJECTED" && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 shrink-0 whitespace-nowrap">Rejected</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">Last Login</p>
                  <p className="text-sm text-gray-500 col-span-2 font-mono text-xs">
                    {user.lastLoginAt ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "password" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function PersonalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    }>
      <PersonalContent />
    </Suspense>
  );
}