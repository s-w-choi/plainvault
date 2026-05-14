"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { changePasswordAction } from "@/actions/auth-actions";
import { AppHeader } from "@/components/app-header";
import { Alert } from "@/components/ui/alert";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/providers/user-provider";

function PersonalContent() {
  const t = useTranslations("personal");
  const tCommon = useTranslations("common");
  const user = useUser();
  const [tab, setTab] = useState<"profile" | "password">("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError(t("passwordMin"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("newPasswordsMismatch"));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("currentPassword", currentPassword);
      formData.set("newPassword", newPassword);

      const result = await changePasswordAction(formData);
      if ("error" in result) {
        setPasswordError(result.error || t("passwordChangeFailed"));
      } else {
        setPasswordSuccess(t("passwordChangeSuccess"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError(tCommon("unexpectedError"));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="personal" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 py-5">
          <div className="absolute top-2 right-8 w-24 h-24 bg-purple-100 rounded-full blur-3xl opacity-40" />
          <div className="relative">
            <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "profile"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("profile")}
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "password"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("changePassword")}
          </button>
        </div>

        {tab === "profile" && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">{t("name")}</p>
                  <p className="text-sm text-gray-900 col-span-2">{user.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">{t("email")}</p>
                  <p className="text-sm text-gray-900 col-span-2">{user.email}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">{t("role")}</p>
                  <div className="col-span-2">
                    <RoleBadge role={user.role as "ADMIN" | "DEVELOPER" | "VIEWER"} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">{t("status")}</p>
                  <div className="col-span-2">
                    <StatusBadge status={user.status as "PENDING" | "APPROVED" | "REJECTED"} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <p className="text-sm font-medium text-gray-500">{t("lastLogin")}</p>
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
              <CardTitle className="text-base">{t("changePassword")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <Alert variant="error">{passwordError}</Alert>
                )}
                {passwordSuccess && (
                  <Alert variant="success">{passwordSuccess}</Alert>
                )}
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("currentPassword")}
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("newPassword")}
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    placeholder={t("atLeast8")}
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("confirmNewPassword")}
                  </label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? tCommon("saving") : t("changePassword")}
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
  return <PersonalContent />;
}
