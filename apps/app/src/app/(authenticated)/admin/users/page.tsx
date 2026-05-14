"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/components/providers/user-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { approveUserAction, listUsersAction, rejectUserAction, updateUserRoleAction } from "@/actions/admin-actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("roles");

  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await listUsersAction();
      if (data && "error" in data) {
        setUsers([]);
      } else {
        setUsers(data.users || []);
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
      await loadUsers();
    })();
  }, [user, router, loadUsers]);

  async function handleApprove(userId: string) {
    setActionLoading(`${userId}-approve`);
    try {
      const target = users.find((u) => u.id === userId);
      const result = await approveUserAction(userId, target?.role);
      if (result && !("error" in result)) {
        await loadUsers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string) {
    if (!confirm(t("rejectConfirm"))) return;
    setActionLoading(`${userId}-reject`);
    try {
      const result = await rejectUserAction(userId);
      if (result && !("error" in result)) {
        await loadUsers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(`${userId}-role`);
    try {
      const result = await updateUserRoleAction(userId, newRole);
      if (result && !("error" in result)) {
        await loadUsers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return null;

  const pendingUsers = users.filter(u => u.status === "PENDING");
  const activeUsers = users.filter(u => u.status === "APPROVED");
  const rejectedUsers = users.filter(u => u.status === "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="admin" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("totalUsers", { count: users.length, pending: pendingUsers.length })}
          </p>
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-medium text-gray-700 mb-3">{t("pendingApproval")}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("requested")}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-gray-500">{u.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={u.role as "ADMIN" | "DEVELOPER" | "VIEWER"} />
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{u.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => handleApprove(u.id)}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${u.id}-approve` ? "..." : t("approve")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => handleReject(u.id)}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${u.id}-reject` ? "..." : t("reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Approved Users */}
        {activeUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-medium text-gray-700 mb-3">{t("approvedUsers")}</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("lastLogin")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                      <TableCell className="text-gray-500">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role as "ADMIN" | "DEVELOPER" | "VIEWER"} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status as "PENDING" | "APPROVED" | "REJECTED"} />
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{u.lastLoginAt ?? "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(u.id, e.target.value)}
                          disabled={!!actionLoading}
                          className="h-8 w-auto text-xs px-2 py-1"
                        >
                          <option value="VIEWER">{tRoles("viewer")}</option>
                          <option value="DEVELOPER">{tRoles("developer")}</option>
                          <option value="ADMIN">{tRoles("admin")}</option>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Rejected Users */}
        {rejectedUsers.length > 0 && (
          <div>
            <h2 className="text-base font-medium text-gray-700 mb-3">{t("rejected")}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("requested")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-gray-500">{u.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={u.role as "ADMIN" | "DEVELOPER" | "VIEWER"} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.status as "PENDING" | "APPROVED" | "REJECTED"} />
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{u.createdAt}</TableCell>
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
