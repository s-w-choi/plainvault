"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    title: "Role-Based Access Control",
    description:
      "Granular permissions with ADMIN, DEVELOPER, and VIEWER roles. Control who can view, edit, or manage your secrets.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Version History",
    description:
      "Every change is tracked. Compare revisions, review change summaries, and restore previous versions instantly.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Organization & Categories",
    description:
      "Group secrets by environment, service, or team. Color-coded categories keep your vault organized at scale.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    title: "Audit Trail",
    description:
      "Complete visibility into who accessed or modified what. Every action is logged for compliance and security reviews.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    step: 1,
    title: "Create an Account",
    description: "Register with your email. An admin approves new users and assigns their role.",
  },
  {
    step: 2,
    title: "Organize Your Vault",
    description: "Create categories for different environments, services, or teams.",
  },
  {
    step: 3,
    title: "Add & Manage Secrets",
    description: "Store API keys, credentials, and configs. Edit with automatic version tracking.",
  },
  {
    step: 4,
    title: "Audit & Collaborate",
    description: "Review the full history of changes and maintain compliance with complete audit logs.",
  },
];

export default function LandingPage() {
  const [mounted] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={32} height={32} />
            <span className="text-lg font-semibold text-gray-900">PlainVault</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div
            className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm text-indigo-700 font-medium mb-8">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Secure. Simple. Team-ready.
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              The vault your team
              <br />
              <span className="text-indigo-600">actually wants to use</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Store API keys, credentials, and configurations in one secure place.
              Role-based access, full version history, and complete audit trails —
              without the complexity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
              >
                Start Free
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Read the Docs
              </Link>
            </div>
          </div>

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
                    PlainVault Dashboard
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="text-xs font-medium text-indigo-600 mb-1">API Keys</div>
                    <div className="text-2xl font-bold text-indigo-900">12</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="text-xs font-medium text-green-600 mb-1">Environments</div>
                    <div className="text-2xl font-bold text-green-900">4</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="text-xs font-medium text-purple-600 mb-1">Team Members</div>
                    <div className="text-2xl font-bold text-purple-900">8</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {["Production API Key", "Stripe Integration", "AWS Credentials"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item}</div>
                        <div className="text-xs text-gray-500">Updated 2 hours ago</div>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              PlainVault strips away the complexity of secret management while keeping enterprise-grade security.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
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

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
            <p className="mt-4 text-lg text-gray-500">Get started in minutes, not hours.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />
            <div className="grid md:grid-cols-4 gap-8">
              {STEPS.map((step) => (
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

      <section className="py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to secure your secrets?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join teams who trust PlainVault to manage their most sensitive data.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PlainVault" width={24} height={24} />
            <span className="font-semibold text-gray-900">PlainVault</span>
          </div>
          <p className="text-sm text-gray-500">
            Secure vault management for teams. Built with care.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/docs" className="hover:text-gray-900 transition-colors">Documentation</Link>
            <Link href="/docs/api" className="hover:text-gray-900 transition-colors">API</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}