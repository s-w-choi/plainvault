"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/components/providers/user-provider";
import { getAuditLogsAction } from "@/actions/admin-actions";

interface AuditLog {
	id: string;
	eventType: string;
	actorType: string;
	actorId: string | null;
	targetType: string | null;
	targetId: string | null;
	success: boolean;
	failureReason: string | null;
	createdAt: string;
}

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

interface LogEntry {
	id: number;
	timestamp: string;
	level: "log" | "info" | "warn" | "error" | "debug";
	message: string;
	args: unknown[];
}

function TerminalModal({
	entries,
	connected,
	onToggleConnection,
	onClear,
	onClose,
}: {
	entries: LogEntry[];
	connected: boolean;
	onToggleConnection: () => void;
	onClear: () => void;
	onClose: () => void;
}) {
	const t = useTranslations("admin.auditLogs");
	const backdropRef = useRef<HTMLDivElement>(null);
	const terminalRef = useRef<HTMLDivElement>(null);

	const logCountLabel = t("logCount", { count: entries.length });

	const levelClass = useCallback((level: LogEntry["level"]) => {
		switch (level) {
			case "error":
				return "text-red-400";
			case "warn":
				return "text-yellow-400";
			case "info":
				return "text-blue-400";
			case "debug":
				return "text-gray-400";
			default:
				return "text-green-400";
		}
	}, []);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === backdropRef.current) onClose();
		},
		[onClose],
	);

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	useEffect(() => {
		const el = terminalRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	});

	return (
		<div
			ref={backdropRef}
			role="dialog"
			aria-modal="true"
			aria-label={t("serverLogsTitle")}
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		>
			<Card className="w-full max-w-3xl mx-4">
				<CardHeader>
					<CardTitle className="text-base">{t("serverLogsTitle")}</CardTitle>
					<p className="text-sm text-gray-500 mt-1">
						{t("serverLogsDescription")}
					</p>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<span
									className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
									aria-hidden="true"
								/>
								<span className="text-xs text-gray-600">
									{connected ? t("connected") : t("disconnected")}
								</span>
							</div>
							<Badge variant="outline" className="text-xs">
								{logCountLabel}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={onToggleConnection}>
								{connected ? t("disconnect") : t("connect")}
							</Button>
							<Button variant="outline" size="sm" onClick={onClear}>
								{t("clear")}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onClose}
								className="ml-2"
							>
								{t("close")}
							</Button>
						</div>
					</div>

					<div
						ref={terminalRef}
						className="bg-gray-900 text-green-400 font-mono text-xs rounded-md p-3 max-h-[500px] overflow-y-auto"
					>
						{entries.length === 0 ? (
							<p className="text-gray-400">{t("noLogs")}</p>
						) : (
							<div className="space-y-1">
								{entries.map((entry) => {
									const time = entry.timestamp
										? entry.timestamp.slice(11, 19)
										: "--:--:--";
									return (
										<div
											key={entry.id}
											className="whitespace-pre-wrap break-words"
										>
											<span className="text-gray-400">[{time}]</span>{" "}
											<span className={levelClass(entry.level)}>
												[{entry.level.toUpperCase()}]
											</span>{" "}
											<span>{entry.message}</span>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function AuditLogsContent() {
	const t = useTranslations("admin.auditLogs");

	const router = useRouter();
	const searchParams = useSearchParams();
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const user = useUser();
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});
	const [loading, setLoading] = useState(true);

	const [showTerminal, setShowTerminal] = useState(false);
	const [terminalEntries, setTerminalEntries] = useState<LogEntry[]>([]);
	const [connected, setConnected] = useState(false);
	const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(
		null,
	);
	const eventSourceRef = useRef<EventSource | null>(null);

	const currentPage = parseInt(searchParams.get("page") || "1", 10);

	const loadLogs = useCallback(async (page: number) => {
		setLoading(true);
		try {
			const data = await getAuditLogsAction(page, 20);
			if (data && "error" in data) {
				setLogs([]);
				setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
			} else {
				setLogs(data.logs || []);
				setPagination(
					data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
				);
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
			await loadLogs(currentPage);
		})();
	}, [user, router, currentPage, loadLogs]);

	const disconnectStream = useCallback(() => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			setReconnectTimer(null);
		}
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
		setConnected(false);
	}, [reconnectTimer]);

	const connectStream = useCallback((): void => {
		if (eventSourceRef.current) return;

		const open = (): void => {
			if (eventSourceRef.current) return;

			const es = new EventSource("/api/admin/logs/stream");
			eventSourceRef.current = es;
			setConnected(true);

			es.addEventListener("message", (evt) => {
				try {
					const data = JSON.parse((evt as MessageEvent).data) as LogEntry;
					setTerminalEntries((prev) => [...prev, data]);
				} catch {
					// Ignore malformed payloads
				}
			});

			es.addEventListener("error", () => {
				setConnected(false);
				if (eventSourceRef.current) {
					eventSourceRef.current.close();
					eventSourceRef.current = null;
				}
				setReconnectTimer((prev) => {
					if (prev) clearTimeout(prev);
					return setTimeout(() => {
						open();
					}, 3000);
				});
			});
		};

		open();
	}, []);

	useEffect(() => {
		return () => {
			disconnectStream();
		};
	}, [disconnectStream]);

	function navigateTo(page: number) {
		router.push(`/admin/audit-logs?page=${page}`);
	}

	if (loading) {
		return <LoadingScreen />;
	}

	if (!user) return null;

	return (
		<div className="min-h-screen bg-gray-50">
			<AppHeader user={user} activeTab="admin" />

			<main className="max-w-6xl mx-auto px-6 py-8">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							{t("title")}
						</h1>
						<p className="mt-1 text-sm text-gray-500">
							{t("totalEvents", { count: pagination.total })}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowTerminal(true)}
					>
						{t("serverLogs")}
					</Button>
				</div>

				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("timeKst")}</TableHead>
									<TableHead>{t("event")}</TableHead>
									<TableHead>{t("actor")}</TableHead>
									<TableHead>{t("target")}</TableHead>
									<TableHead>{t("result")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{logs.map((log) => (
									<TableRow key={log.id}>
										<TableCell className="font-mono text-xs text-gray-500 whitespace-nowrap">
											{log.createdAt}
										</TableCell>
										<TableCell>
											<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
												{log.eventType}
											</code>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{log.actorType}</Badge>
										</TableCell>
										<TableCell className="text-xs text-gray-500">
											{log.targetType ? (
												<span>
													{log.targetType}
													{log.targetId && (
														<span className="text-gray-400">
															#{log.targetId.slice(0, 8)}
														</span>
													)}
												</span>
											) : (
												"—"
											)}
										</TableCell>
										<TableCell>
											{log.success ? (
												<Badge variant="success">{t("ok")}</Badge>
											) : (
												<Badge
													variant="destructive"
													title={log.failureReason ?? t("fail")}
												>
													{log.failureReason ?? t("fail")}
												</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Pagination */}
				{pagination.totalPages > 1 && (
					<div className="mt-4 flex items-center justify-between">
						<p className="text-sm text-gray-500">
							{t("pageInfo", {
								current: pagination.page,
								total: pagination.totalPages,
								totalItems: pagination.total,
							})}
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigateTo(pagination.page - 1)}
								disabled={pagination.page <= 1}
							>
								{t("previous")}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigateTo(pagination.page + 1)}
								disabled={pagination.page >= pagination.totalPages}
							>
								{t("next")}
							</Button>
						</div>
					</div>
				)}
			</main>

			{showTerminal && (
				<TerminalModal
					entries={terminalEntries}
					connected={connected}
					onToggleConnection={() => {
						if (connected) {
							disconnectStream();
						} else {
							connectStream();
						}
					}}
					onClear={() => setTerminalEntries([])}
					onClose={() => {
						disconnectStream();
						setShowTerminal(false);
					}}
				/>
			)}
		</div>
	);
}

export default function AdminAuditLogsPage() {
	return (
		<Suspense fallback={<LoadingScreen />}>
			<AuditLogsContent />
		</Suspense>
	);
}
