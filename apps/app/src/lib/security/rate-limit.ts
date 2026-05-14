/**
 * Simple in-memory rate limiter.
 * Uses a fixed window counter per key (IP address or identifier).
 * For single-instance deployments only. For multi-instance, use Redis-based solution.
 */

import { isIP } from 'node:net';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Cleanup old entries every 60 seconds
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  cleanupExpiredEntries(now);
}, 60_000);
cleanupTimer.unref?.();

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

export function getDefaultRateLimitConfig(): RateLimitConfig {
  return {
    windowMs: parsePositiveInteger(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS, 300) * 1000,
    maxAttempts: parsePositiveInteger(process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS, 10),
  };
}

export function getClientIpKey(value: string | null): string | null {
  const clientIp = value?.split(',')[0]?.trim();
  return clientIp && isIP(clientIp) ? clientIp : null;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string | null, config?: Partial<RateLimitConfig>): RateLimitResult {
  if (!key) {
    return { allowed: true, remaining: Infinity, resetAt: 0 };
  }

  const { windowMs, maxAttempts } = { ...getDefaultRateLimitConfig(), ...config };
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    if (store.size >= MAX_ENTRIES) {
      cleanupExpiredEntries(now);
    }

    if (store.size >= MAX_ENTRIES) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) {
        store.delete(oldestKey);
      }
    }

    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}
