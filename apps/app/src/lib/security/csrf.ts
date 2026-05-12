import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  if (!/^[0-9a-f]+$/i.test(cookieToken) || !/^[0-9a-f]+$/i.test(headerToken)) return false;

  let diff = 0;
  for (let i = 0; i < cookieToken.length; i += 1) {
    diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return diff === 0;
}

export function getCsrfTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}
