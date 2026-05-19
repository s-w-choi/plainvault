"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/components/providers/user-provider";

const NAV_ITEMS = [
  { id: "getting-started", labelKey: "docsGettingStarted" },
  { id: "account", labelKey: "docsAccountAndRegistration" },
  { id: "roles", labelKey: "docsRolesAndPermissions" },
  { id: "files", labelKey: "docsFileManagement" },
  { id: "categories", labelKey: "docsCategories" },
  { id: "history", labelKey: "docsHistoryAndRevisions" },
  { id: "search", labelKey: "docsSearchAndFilter" },
  { id: "api-keys", labelKey: "docsApiKeys" },
];

export default function DocsPage() {
  const tNav = useTranslations("nav");
  const [active, setActive] = useState("getting-started");
  const user = useUser();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="docs" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-52 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    active === item.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tNav(item.labelKey)}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {active === "getting-started" && <GettingStarted />}
            {active === "account" && <AccountSection />}
            {active === "roles" && <RolesSection />}
            {active === "files" && <FilesSection />}
            {active === "categories" && <CategoriesSection />}
            {active === "history" && <HistorySection />}
            {active === "search" && <SearchSection />}
            {active === "api-keys" && <ApiKeysSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

function GettingStarted() {
  const t = useTranslations("docs");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tRoles = useTranslations("roles");

  return (
    <div className="space-y-6">
      <div>
        <Image src="/docs.png" alt={tNav("docs")} width={80} height={80} className="mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">{t("userGuide")}</h1>
        <p className="mt-2 text-gray-600">
          {t("guideIntro")}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("whatIsPlainVault")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>{t("gettingStarted.whatIs.description")}</p>
          <p>{t("gettingStarted.whatIs.commonUseCases")}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t("gettingStarted.whatIs.useCases.databaseCredentials")}</li>
            <li>{t("gettingStarted.whatIs.useCases.thirdPartyApiKeys")}</li>
            <li>{t("gettingStarted.whatIs.useCases.envConfigs")}</li>
            <li>{t("gettingStarted.whatIs.useCases.sslCerts")}</li>
            <li>{t("gettingStarted.whatIs.useCases.sensitiveTeamNotes")}</li>
            <li>{t("gettingStarted.whatIs.useCases.infrastructureConfig")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("gettingStarted.access.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
            <p>
              {t("gettingStarted.access.step1.beforeLink")}{" "}
              <Link href="/register" className="text-indigo-600 hover:underline">
                {t("gettingStarted.access.step1.linkText")}
              </Link>{" "}
              {t("gettingStarted.access.step1.afterLink")}
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
            <p>{t("gettingStarted.access.step2")}</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
            <p>{t("gettingStarted.access.step3")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("gettingStarted.security.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>{t("gettingStarted.security.encryptionAtRest")}</p>
          <p>
            {t("gettingStarted.security.viewerMasking.beforeRole")} {tRoles("viewer").toUpperCase()}{" "}
            {t("gettingStarted.security.viewerMasking.afterRole")}
          </p>
          <div className="rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>DATABASE_URL=postgres://user:secret123@db.example.com:5432/prod</p>
            <p>API_KEY=sk_live_abcdef123456</p>
          </div>
          <p>
            {t("gettingStarted.security.viewerShownAs.beforeRole")} {tRoles("viewer").toUpperCase()} {t("gettingStarted.security.viewerShownAs.afterRole")}
          </p>
          <div className="rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>DATABASE_URL=********</p>
            <p>API_KEY=********</p>
          </div>
          <p>
            {tRoles("developer").toUpperCase()} {tCommon("and")} {tRoles("admin").toUpperCase()} {t("gettingStarted.security.devAdminSeeRaw")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSection() {
  const t = useTranslations("docs");
  const tAuth = useTranslations("auth");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("account")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("accountSection.requesting.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              {t("accountSection.requesting.step1.beforeLink")}{" "}
              <Link href="/register" className="text-indigo-600 hover:underline">
                {t("accountSection.requesting.step1.linkText")}
              </Link>
            </li>
            <li>{t("accountSection.requesting.step2")}</li>
            <li>
              {t("accountSection.requesting.step3.beforeButton")}{" "}
              <span className="font-medium">{tAuth("createAccount")}</span>{" "}
              {t("accountSection.requesting.step3.afterButton")}{" "}
              <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">{t("accountSection.requesting.pending")}</span>
            </li>
            <li>{t("accountSection.requesting.step4")}</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("accountSection.pendingStatus.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>{t("accountSection.pendingStatus.description")}</p>
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            {tAuth("pendingApprovalLogin")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RolesSection() {
  const t = useTranslations("docs");
  const tRoles = useTranslations("roles");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("roles")}</h2>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-700">{t("rolesSection.table.feature")}</th>
                <th className="text-center px-4 py-2 font-medium text-indigo-600">{tRoles("admin").toUpperCase()}</th>
                <th className="text-center px-4 py-2 font-medium text-green-600">{tRoles("developer").toUpperCase()}</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">{tRoles("viewer").toUpperCase()}</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                [t("rolesSection.features.viewFileRaw"), "✓", "✗", "✗"],
                [t("rolesSection.features.viewFileMasked"), "✓", "✓", "✓"],
                [t("rolesSection.features.createFile"), "✓", "✓", "✗"],
                [t("rolesSection.features.editFile"), "✓", "✓", "✗"],
                [t("rolesSection.features.deleteFile"), "✓", "✗", "✗"],
                [t("rolesSection.features.manageCategories"), "✓", "✗", "✗"],
                [t("rolesSection.features.approveRejectUsers"), "✓", "✗", "✗"],
                [t("rolesSection.features.createRevokeApiKeys"), "✓", "✓", "✓"],
                [t("rolesSection.features.viewAuditLogs"), "✓", "✗", "✗"],
                [t("rolesSection.features.viewRevisionHistory"), "✓", "✓", "✗"],
              ].map(([feature, admin, dev, viewer], i) => (
                <tr key={feature as string} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{feature}</td>
                  <td className="px-4 py-2 text-center">{admin}</td>
                  <td className="px-4 py-2 text-center">{dev}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{viewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-indigo-700">{tRoles("admin").toUpperCase()}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            {t("rolesSection.cards.admin")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-green-600">{tRoles("developer").toUpperCase()}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            {t("rolesSection.cards.developer")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-gray-600">{tRoles("viewer").toUpperCase()}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            {t("rolesSection.cards.viewer")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilesSection() {
  const t = useTranslations("docs");
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("files")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("filesSection.create.title")}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                {t("filesSection.create.step1.beforeLink")}{" "}
                <Link href="/dashboard" className="text-indigo-600 hover:underline">
                  {tDashboard("title")}
                </Link>{" "}
                {t("filesSection.create.step1.afterLink")}
              </li>
              <li>
                {t("filesSection.create.step2.beforeButton")}{" "}
                <span className="font-medium">{tDashboard("newFile")}</span>
              </li>
              <li>{t("filesSection.create.step3")}</li>
              <li>{t("filesSection.create.step4")}</li>
              <li>
                {t("filesSection.create.step5.beforeButton")} {tCommon("save")}
              </li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("filesSection.view.title")}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ul className="space-y-1">
              <li>{t("filesSection.view.item1")}</li>
              <li>
                {tRoles("developer").toUpperCase()}/{tRoles("admin").toUpperCase()} — {t("filesSection.view.item2AfterDash")}
              </li>
              <li>
                {tRoles("viewer").toUpperCase()} — {t("filesSection.view.item3AfterDash")}
              </li>
              <li>
                {t("filesSection.view.item4.beforeButton")} <span className="font-medium">{t("filesSection.view.item4.raw")}</span> {t("filesSection.view.item4.afterButton")}
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("filesSection.edit.title")}</CardTitle></CardHeader>
          <CardContent className="text-xs text-gray-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                {t("filesSection.edit.step1.beforeButton")} <span className="font-medium">{tCommon("edit")}</span>
              </li>
              <li>{t("filesSection.edit.step2")}</li>
              <li>{t("filesSection.edit.step3")}</li>
              <li>
                {t("filesSection.edit.step4.beforeButton")} {tCommon("save")} {t("filesSection.edit.step4.afterButton")}
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("filesSection.contentTypes.title")}</CardTitle></CardHeader>
        <CardContent className="text-xs text-gray-600">
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: "text", label: t("filesSection.contentTypes.types.text") },
              { id: "markdown", label: t("filesSection.contentTypes.types.markdown") },
              { id: "env", label: t("filesSection.contentTypes.types.env") },
              { id: "json", label: t("filesSection.contentTypes.types.json") },
              { id: "yaml", label: t("filesSection.contentTypes.types.yaml") },
              { id: "xml", label: t("filesSection.contentTypes.types.xml") },
              { id: "sql", label: t("filesSection.contentTypes.types.sql") },
            ].map((type) => (
              <span key={type.id} className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{type.label}</span>
            ))}
          </div>
          <p>
            {t("filesSection.contentTypes.description.beforeRole")} {tRoles("viewer").toUpperCase()}{" "}
            {t("filesSection.contentTypes.description.afterRole")}{" "}
            <code className="bg-gray-100 px-1 rounded">KEY=value</code>{" "}
            {t("filesSection.contentTypes.description.afterCode")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesSection() {
  const t = useTranslations("docs");
  const tAdminCategories = useTranslations("admin.categories");
  const tRoles = useTranslations("roles");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("categories")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("categoriesSection.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            {t("categoriesSection.description.beforeRole")} {tRoles("admin").toUpperCase()} {t("categoriesSection.description.afterRole")}
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              {t("categoriesSection.steps.step1.beforeLink")}{" "}
              <Link href="/admin/categories" className="text-indigo-600 hover:underline">
                {t("categories")}
              </Link>
            </li>
            <li>
              {t("categoriesSection.steps.step2.beforeButton")} <span className="font-medium">{tAdminCategories("newCategory")}</span>
            </li>
            <li>{t("categoriesSection.steps.step3")}</li>
            <li>
              {t("categoriesSection.steps.step4.beforeButton")} <span className="font-medium">{tAdminCategories("create")}</span>
            </li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { nameKey: "categoriesSection.samples.production", color: "#ef4444" },
              { nameKey: "categoriesSection.samples.development", color: "#22c55e" },
              { nameKey: "categoriesSection.samples.secrets", color: "#f97316" },
              { nameKey: "categoriesSection.samples.config", color: "#3b82f6" },
              { nameKey: "categoriesSection.samples.notes", color: "#8b5cf6" },
            ].map((c) => (
              <span
                key={c.nameKey}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium"
                style={{ backgroundColor: c.color + "20", color: c.color, border: `1px solid ${c.color}40` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {t(c.nameKey)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{t("categoriesSection.note")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function HistorySection() {
  const t = useTranslations("docs");
  const tFiles = useTranslations("files");
  const tRoles = useTranslations("roles");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("history")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("historySection.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>{t("historySection.description")}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>{t("historySection.steps.step1")}</li>
            <li>
              {t("historySection.steps.step2.beforeButton")} <span className="font-medium">{tFiles("history")}</span>
            </li>
            <li>{t("historySection.steps.step3")}</li>
            <li>
              {t("historySection.steps.step4.beforeButton")} <span className="font-medium">{tFiles("restore")}</span>{" "}
              {t("historySection.steps.step4.afterButton.beforeRoles")} {tRoles("admin").toUpperCase()}/{tRoles("developer").toUpperCase()}{" "}
              {t("historySection.steps.step4.afterButton.afterRoles")}
            </li>
          </ol>
          <div className="mt-3 p-3 bg-gray-100 rounded-md font-mono text-xs">
            <div className="text-green-700">+ {t("historySection.diffExample.added")}</div>
            <div className="text-red-700">- {t("historySection.diffExample.removed")}</div>
            <div className="text-gray-500">  {t("historySection.diffExample.unchanged")}</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("historySection.footer.beforeRoles")} {tRoles("developer").toUpperCase()} {t("historySection.footer.and")} {tRoles("admin").toUpperCase()} {t("historySection.footer.afterRoles")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SearchSection() {
  const t = useTranslations("docs");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("search")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("searchSection.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <ul className="space-y-2">
            <li>
              <strong>{t("searchSection.items.textSearch.title")}</strong> — {t("searchSection.items.textSearch.description")}
            </li>
            <li>
              <strong>{t("searchSection.items.categoryFilter.title")}</strong> — {t("searchSection.items.categoryFilter.description")}
            </li>
            <li>
              <strong>{t("searchSection.items.combined.title")}</strong> — {t("searchSection.items.combined.description")}
            </li>
            <li>
              <strong>{t("searchSection.items.clearFilter.title")}</strong> — {t("searchSection.items.clearFilter.description.beforeButton")}{" "}
              <span className="font-medium">{tCommon("all")}</span> {t("searchSection.items.clearFilter.description.afterButton")}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSection() {
  const t = useTranslations("docs");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("apiKeys")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("apiKeysSection.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>{t("apiKeysSection.description")}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              {t("apiKeysSection.steps.step1.beforeLink")}{" "}
              <Link href="/admin/api-keys" className="text-indigo-600 hover:underline">
                {t("apiKeys")}
              </Link>
            </li>
            <li>
              {t("apiKeysSection.steps.step2.beforeButton")} <span className="font-medium">{t("apiKeysSection.steps.step2.createKey")}</span>
            </li>
            <li>{t("apiKeysSection.steps.step3")}</li>
            <li>{t("apiKeysSection.steps.step4")}</li>
          </ol>
          <div className="mt-3 rounded-md bg-gray-100 p-3 font-mono text-xs">
            <p>Authorization: Bearer secvault_abc123</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("apiKeysSection.footer.beforeCode")}{" "}
            <code className="bg-gray-100 px-1 rounded">Authorization: Bearer your_key_here</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
