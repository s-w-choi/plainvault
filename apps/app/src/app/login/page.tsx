"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "UNAUTHORIZED" && data.error?.message === "Account not approved") {
          setError(t("pendingApprovalLogin"));
        } else {
          setError(data.error?.message || t("loginFailed"));
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40" />
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="PlainVault" width={100} height={100} className="mx-auto" />
        </div>

        <Card className="rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>{t("signIn")}</CardTitle>
            <CardDescription>{t("enterCredentials")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t("email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t("password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                {t("register")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
