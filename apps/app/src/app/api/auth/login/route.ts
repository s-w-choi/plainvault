import argon2 from "argon2";
import { type NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit/audit-log";
import { setSessionCookie } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIpKey } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logging/logger";

export async function POST(request: NextRequest) {
	try {
		const clientIp = getClientIpKey(request.headers.get("x-forwarded-for"));
		const rateLimitResult = checkRateLimit(`login:${clientIp}`);
		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: {
						code: "RATE_LIMITED",
						message: "Too many login attempts. Please try again later.",
					},
				},
				{
					status: 429,
					headers: {
						"Retry-After": String(
							Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
						),
					},
				},
			);
		}

		const { email, password } = await request.json();
		const ip = request.headers.get("x-forwarded-for") || undefined;
		const userAgent = request.headers.get("user-agent") || undefined;

		if (!email || !password) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Email and password are required",
					},
				},
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user) {
			await createAuditLog({
				eventType: "auth.login.failed",
				actorType: "USER",
				ipAddress: ip,
				userAgent,
				metadata: { email },
				success: false,
				failureReason: "USER_NOT_FOUND",
			});
			return NextResponse.json(
				{ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
				{ status: 401 },
			);
		}

		if (user.status !== "APPROVED") {
			await createAuditLog({
				eventType: "auth.login.failed",
				actorType: "USER",
				actorId: user.id,
				ipAddress: ip,
				userAgent,
				metadata: { email },
				success: false,
				failureReason: "ACCOUNT_NOT_APPROVED",
			});
			return NextResponse.json(
				{ error: { code: "UNAUTHORIZED", message: "Account not approved" } },
				{ status: 401 },
			);
		}

		const valid = await argon2.verify(user.passwordHash, password);

		if (!valid) {
			await createAuditLog({
				eventType: "auth.login.failed",
				actorType: "USER",
				actorId: user.id,
				ipAddress: ip,
				userAgent,
				metadata: { email },
				success: false,
				failureReason: "INVALID_PASSWORD",
			});
			return NextResponse.json(
				{ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
				{ status: 401 },
			);
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		});

		await createAuditLog({
			eventType: "auth.login.success",
			actorType: "USER",
			actorId: user.id,
			ipAddress: ip,
			userAgent,
			metadata: { email },
		});

		await setSessionCookie(user.id);
		const response = NextResponse.json({ message: "Login successful" });

		return response;
	} catch (error) {
		logger.error("Login error:", { error: error instanceof Error ? error.message : String(error) });
		return NextResponse.json(
			{ error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
			{ status: 500 },
		);
	}
}
