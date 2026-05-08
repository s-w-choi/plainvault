"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = searchParams.get("registered") === "1";

  useEffect(() => {
    if (registered) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [registered, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || t("registrationFailed"));
        return;
      }

      router.push("/register?registered=1");
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
      <CardHeader>
        <CardTitle>{t("createAccount")}</CardTitle>
        <CardDescription>{t("registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {registered ? (
          <div className="space-y-4">
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <p className="font-medium">{t("waitingApproval")}</p>
              <p className="mt-1">{t("registrationSubmitted")}</p>
            </div>
            <div className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                {t("goToLoginNow")}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                {t("name")}
              </label>
              <Input
                id="name"
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>

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
                autoComplete="new-password"
                disabled={loading}
              />
              {password && (
                <p className={`text-xs ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                  {password === confirmPassword ? t("passwordsMatch") : t("passwordsDoNotMatch")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                {t("confirmPassword")}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
            {t("signIn")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40" />
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="PlainVault" width={100} height={100} className="mx-auto" />
        </div>

        <Suspense fallback={
          <Card className="rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6 text-center text-gray-500 text-sm">{tCommon("loading")}</CardContent>
          </Card>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
