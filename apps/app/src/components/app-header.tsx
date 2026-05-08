"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface AppHeaderProps {
  user: { name: string; email: string; role: string };
  activeTab?: "dashboard" | "docs" | "api" | "admin" | "personal";
}

export function AppHeader({ user, activeTab = "dashboard" }: AppHeaderProps) {
  const tNav = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    form.submit();
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            <Image src="/logo.png" alt="PlainVault" width={100} height={100} />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tNav("dashboard")}
            </Link>
            <Link
              href="/docs"
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeTab === "docs"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tNav("docs")}
            </Link>
            <Link
              href="/docs/api"
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeTab === "api"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tNav("api")}
            </Link>
          </nav>
        </div>

        {/* Right: Personal Menu */}
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <div className="relative" ref={adminDropdownRef}>
              <button
                type="button"
                onClick={() => setAdminOpen(!adminOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {tNav("admin")}
                <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {adminOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-100/50 z-50 overflow-hidden">
                  <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAdminOpen(false)}>
                    {tNav("users")}
                  </Link>
                  <Link href="/admin/api-keys" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAdminOpen(false)}>
                    {tNav("apiKeys")}
                  </Link>
                  <Link href="/admin/audit-logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAdminOpen(false)}>
                    {tNav("auditLogs")}
                  </Link>
                  <Link href="/admin/categories" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAdminOpen(false)}>
                    {tNav("categories")}
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAdminOpen(false)}>
                    Settings
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                activeTab === "personal"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium text-gray-900">{user.name}</span>
              {user.role === "ADMIN" && <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 shrink-0 whitespace-nowrap">{tRoles("admin")}</span>}
              {user.role === "DEVELOPER" && <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 shrink-0 whitespace-nowrap">{tRoles("developer")}</span>}
              {user.role === "VIEWER" && <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 bg-white shrink-0 whitespace-nowrap">{tRoles("viewer")}</span>}
              <svg aria-hidden="true" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-100/50 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Link
                  href="/personal"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setOpen(false)}
                >
                  {tNav("myProfile")}
                </Link>
                <Link
                  href="/personal?tab=password"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setOpen(false)}
                >
                  {tNav("changePassword")}
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1 pb-1">
                  <form action="/api/auth/logout" method="POST" onSubmit={handleSignOut}>
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {tNav("logout")}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
