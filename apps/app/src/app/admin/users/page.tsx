"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.user || data.user.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        setUser(data.user);
        loadUsers();
      });
  }, [router]);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId + "-approve");
    const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
    if (res.ok) {
      await loadUsers();
    }
    setActionLoading(null);
  }

  async function handleReject(userId: string) {
    if (!confirm("Reject this user? This cannot be undone.")) return;
    setActionLoading(userId + "-reject");
    const res = await fetch(`/api/admin/users/${userId}/reject`, { method: "POST" });
    if (res.ok) {
      await loadUsers();
    }
    setActionLoading(null);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId + "-role");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      await loadUsers();
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const pendingUsers = users.filter(u => u.status === "PENDING");
  const activeUsers = users.filter(u => u.status === "APPROVED");
  const rejectedUsers = users.filter(u => u.status === "REJECTED");

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 bg-white whitespace-nowrap">Pending</span>;
      case "APPROVED":
        return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">{status}</span>;
    }
  };

  const roleBadge = (role: string) => {
    const displayRole = role.charAt(0) + role.slice(1).toLowerCase();
    if (role === "ADMIN") {
      return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 shrink-0 whitespace-nowrap">{displayRole}</span>;
    }
    if (role === "DEVELOPER") {
      return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 shrink-0 whitespace-nowrap">{displayRole}</span>;
    }
    if (role === "VIEWER") {
      return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 bg-white shrink-0 whitespace-nowrap">{displayRole}</span>;
    }
    return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 shrink-0 whitespace-nowrap">{role}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} activeTab="admin" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""} total — {pendingUsers.length} pending
          </p>
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-medium text-gray-700 mb-3">Pending Approval</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-gray-500">{u.email}</TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{u.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(u.id)}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 shrink-0 whitespace-nowrap transition-colors"
                            >
                              {actionLoading === u.id + "-approve" ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(u.id)}
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 shrink-0 whitespace-nowrap transition-colors"
                            >
                              {actionLoading === u.id + "-reject" ? "..." : "Reject"}
                            </button>
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
            <h2 className="text-base font-medium text-gray-700 mb-3">Approved Users</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                      <TableCell className="text-gray-500">{u.email}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{u.lastLoginAt ?? "—"}</TableCell>
                      <TableCell>
                        <select
                          value={u.role}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(u.id, e.target.value)}
                          disabled={!!actionLoading}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="DEVELOPER">Developer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
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
            <h2 className="text-base font-medium text-gray-700 mb-3">Rejected</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-gray-500">{u.email}</TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell>{statusBadge(u.status)}</TableCell>
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