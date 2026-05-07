"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

const FEATURE_ICONS = [
  {
    icon: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const [mounted] = useState(true);
  const features = [
    { title: t("featureRbacTitle"), description: t("featureRbacDescription"), icon: FEATURE_ICONS[0].icon },
    { title: t("featureHistoryTitle"), description: t("featureHistoryDescription"), icon: FEATURE_ICONS[1].icon },
    { title: t("featureCategoriesTitle"), description: t("featureCategoriesDescription"), icon: FEATURE_ICONS[2].icon },
    { title: t("featureAuditTitle"), description: t("featureAuditDescription"), icon: FEATURE_ICONS[3].icon },
  ];
  const steps = [
    { step: 1, title: t("stepAccountTitle"), description: t("stepAccountDescription") },
    { step: 2, title: t("stepOrganizeTitle"), description: t("stepOrganizeDescription") },
    { step: 3, title: t("stepManageTitle"), description: t("stepManageDescription") },
    { step: 4, title: t("stepAuditTitle"), description: t("stepAuditDescription") },
  ];
  const previewItems = [t("productionApiKey"), t("stripeIntegration"), t("awsCredentials")];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={32} height={32} />
            <span className="text-lg font-semibold text-gray-900">{t("title")}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t("getStarted")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div
            className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm text-indigo-700 font-medium mb-8">
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t("badge")}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              {t("heroLine1")}
              <br />
              <span className="text-indigo-600">{t("heroHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {t("heroDescription")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
              >
                {t("startFree")}
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                {t("readDocs")}
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div
            className={`mt-16 relative transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/50 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-200 border border-gray-300 rounded px-4 py-1 text-xs text-gray-500">
                    {t("dashboardPreview")}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="text-xs font-medium text-indigo-600 mb-1">{t("apiKeys")}</div>
                    <div className="text-2xl font-bold text-indigo-900">12</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="text-xs font-medium text-green-600 mb-1">{t("environments")}</div>
                    <div className="text-2xl font-bold text-green-900">4</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="text-xs font-medium text-purple-600 mb-1">{t("teamMembers")}</div>
                    <div className="text-2xl font-bold text-purple-900">8</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {previewItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg aria-hidden="true" className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item}</div>
                        <div className="text-xs text-gray-500">{t("updatedHoursAgo")}</div>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                        {tCommon("active")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              {t("featuresDescription")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t("howItWorks")}</h2>
            <p className="mt-4 text-lg text-gray-500">{t("howItWorksDescription")}</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-600 text-white text-2xl font-bold mb-4 mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            {t("ctaDescription")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              {t("createFreeAccount")}
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              {t("viewDocumentation")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={24} height={24} />
            <span className="font-semibold text-gray-900">{t("title")}</span>
          </div>
          <p className="text-sm text-gray-500">
            {t("footerDescription")}
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/docs" className="hover:text-gray-900 transition-colors">{tNav("documentation")}</Link>
            <Link href="/docs/api" className="hover:text-gray-900 transition-colors">{tNav("api")}</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">{t("signIn")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
