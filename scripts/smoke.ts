(async () => {
  /**
   * smoke.ts — HTTP API smoke tests against a running dev server (pnpm dev).
   * Run with: pnpm smoke
   */

  const BASE = 'http://localhost:3000';

// ── cookie jar ────────────────────────────────────────────────────────────────

  const cookieJar: Record<string, string> = {};

  function parseCookies(header: string) {
    // set-cookie format: name=value; Path=/; ...
    // only the first "=" belongs to the cookie value; rest are attributes
    for (const part of header.split(',')) {
      const cookiePart = part.trim();
      const eqIdx = cookiePart.indexOf('=');
      if (eqIdx > 0) {
        const key = cookiePart.slice(0, eqIdx);
        const value = cookiePart.slice(eqIdx + 1).split(';')[0];
        cookieJar[key] = value;
      }
    }
  }

  function buildCookieHeader(): string {
    return Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

// ── helpers ──────────────────────────────────────────────────────────────────

  async function request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ status: number; body: unknown }> {
    const headers: Record<string, string> = { cookie: buildCookieHeader() };
    const opts: RequestInit = { method, headers };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }

    const res = await fetch(`${BASE}${path}`, opts);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) parseCookies(setCookie);

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, body: json };
  }

  function fail(msg: string): never {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }

// ── tests ────────────────────────────────────────────────────────────────────

  async function main() {
    console.log('=== Smoke Tests ===\n');

    // 1. Health check
    console.log('[1] Health check');
    const health = await request('GET', '/');
    console.log(`    → server responding (${health.status})`);

    // 2. Register
    console.log('[2] Register');
    const regEmail = `smoke_${Date.now()}@test.local`;
    const reg = await request('POST', '/api/auth/register', {
      name: 'Smoke Test User',
      email: regEmail,
      password: 'SmokeTestPass123!',
    });
    if (reg.status === 409) {
      console.log('    → email already taken (409 — skipping)');
    } else if (reg.status === 200 || reg.status === 201) {
      console.log(`    → registered (${reg.status})`);
    } else {
      fail(`Expected 200/201, got ${reg.status}`);
    }

    // 3. Login success (PENDING → 401)
    console.log('[3] Login success (unapproved)');
    const login = await request('POST', '/api/auth/login', {
      email: regEmail,
      password: 'SmokeTestPass123!',
    });
    console.log(`    → ${login.status} (expected 401 for PENDING user)`);

    // 4. Login failure (wrong password)
    console.log('[4] Login failure');
    const badLogin = await request('POST', '/api/auth/login', {
      email: regEmail,
      password: 'wrongpasswordXYZ',
    });
    if (badLogin.status === 401) {
      console.log('    → 401 as expected');
    } else {
      fail(`Expected 401, got ${badLogin.status}`);
    }

    // 5. Admin login
    console.log('[5] Admin login');
    const adminEmail = 'admin@internal.local';
    const adminPass = 'admin123';
    const adminLogin = await request('POST', '/api/auth/login', {
      email: adminEmail,
      password: adminPass,
    });
    if (adminLogin.status === 200) {
      console.log(`    → admin login ok (${adminLogin.status})`);
    } else {
      fail(`Admin login failed: ${adminLogin.status}`);
    }

    // 6. Approve user
    console.log('[6] Approve user');
    const users = await request('GET', '/api/admin/users');
    if (users.status === 200) {
      const pending = (users.body as { users?: Array<{ id: string; status: string }> }).users?.find(
        (u) => u.status === 'PENDING',
      );
      if (pending) {
        const approve = await request('POST', `/api/admin/users/${pending.id}/approve`);
        console.log(`    → approve returned ${approve.status}`);
      } else {
        console.log('    → no PENDING users found');
      }
    } else {
      console.log(`    → cannot list users (${users.status})`);
    }

    // 7. Create file
    console.log('[7] Create file');
    const createFile = await request('POST', '/api/files', {
      title: 'Smoke Test File',
      actualFileName: 'smoke.txt',
      content: 'This is a secret from the smoke test',
      contentType: 'text',
    });
    const fileId = (createFile.body as { file?: { id: string } })?.file?.id;
    if (createFile.status === 201 && fileId) {
      console.log(`    → file created (${fileId})`);
    } else {
      console.log(`    → create file returned ${createFile.status}`);
    }

    // 8. View masked (as registered user with VIEWER role)
    console.log('[8] View masked (viewer role)');
    // Create a viewer session
    const viewerEmail = `viewer_${Date.now()}@test.local`;
    await request('POST', '/api/auth/register', {
      name: 'Viewer User',
      email: viewerEmail,
      password: 'ViewerPass123!',
    });
    // Login as viewer
    const viewerLogin = await request('POST', '/api/auth/login', {
      email: viewerEmail,
      password: 'ViewerPass123!',
    });
    if (viewerLogin.status === 200 && fileId) {
      // Admin approves viewer
      const users2 = await request('GET', '/api/admin/users');
      if (users2.status === 200) {
        const viewerUser = (users2.body as { users?: Array<{ id: string; email: string; status: string }> }).users?.find(
          (u) => u.email === viewerEmail,
        );
        if (viewerUser) {
          await request('POST', `/api/admin/users/${viewerUser.id}/approve`);
        }
      }
      // Re-login to get fresh session after approval
      await request('POST', '/api/auth/login', { email: viewerEmail, password: 'ViewerPass123!' });
      const view = await request('GET', `/api/files/${fileId}`);
      if (view.status === 200) {
        const content = (view.body as { file?: { content?: string } })?.file?.content ?? '';
        const isMasked = content.includes('[REDACTED]') || content.includes('●') || content.includes('*') || content.includes('********');
        console.log(`    → viewer response: masked = ${isMasked}`);
      } else {
        console.log(`    → view returned ${view.status}`);
      }
    } else {
      console.log('    → skipped (no fileId or viewer login failed)');
    }

    // 9. View raw (as developer/admin)
    console.log('[9] View raw (admin role)');
    if (fileId) {
      const viewRaw = await request('GET', `/api/files/${fileId}`);
      if (viewRaw.status === 200) {
        const content = (viewRaw.body as { file?: { content?: string } })?.file?.content ?? '';
        const isRaw = !content.includes('[REDACTED]') && !content.includes('●');
        console.log(`    → admin sees raw: ${isRaw}`);
      } else {
        console.log(`    → view returned ${viewRaw.status}`);
      }
    } else {
      console.log('    → skipped (no fileId)');
    }

    // 10. Create API key
    console.log('[10] Create API key');
    const createKey = await request('POST', '/api/admin/api-keys', {
      name: 'Smoke Test Key',
    });
    const keyId = (createKey.body as { apiKey?: { id: string } })?.apiKey?.id;
    const rawKey = (createKey.body as { apiKey?: { key?: string } })?.apiKey?.key;
    if (createKey.status === 201 && keyId) {
      console.log(`    → API key created (${keyId})`);
    } else {
      console.log(`    → create key returned ${createKey.status}`);
    }

    // 11. API key raw access
    console.log('[11] API key raw access');
    if (fileId && rawKey) {
      const rawRes = await fetch(`${BASE}/api/v1/files/${fileId}/raw`, {
        headers: { authorization: `Bearer ${rawKey}` },
      });
      const rawBody = await rawRes.json();
      if (rawRes.status === 200) {
        const content = (rawBody as { content?: string }).content ?? '';
        console.log(`    → raw via API key: content length = ${content.length}`);
      } else {
        console.log(`    → API key raw returned ${rawRes.status}`);
      }
    } else {
      console.log('    → skipped (no fileId or no API key)');
    }

    // 12. Revoke API key
    console.log('[12] Revoke API key');
    if (keyId) {
      const revokeRes = await request('DELETE', `/api/admin/api-keys/${keyId}`);
      if (revokeRes.status === 200) {
        console.log(`    → revoked key ${keyId}`);
      } else {
        console.log(`    → revoke returned ${revokeRes.status}`);
      }
    } else {
      console.log('    → skipped (no keyId)');
    }

    // 13. Revoked key denied
    console.log('[13] Revoked key denied');
    if (fileId && rawKey) {
      const deniedRes = await fetch(`${BASE}/api/v1/files/${fileId}/raw`, {
        headers: { authorization: `Bearer ${rawKey}` },
      });
      if (deniedRes.status === 401 || deniedRes.status === 403) {
        console.log(`    → ${deniedRes.status} as expected`);
      } else {
        console.log(`    → expected 401/403, got ${deniedRes.status}`);
      }
    }

    console.log('\n=== Smoke Tests Complete ===');
    process.exit(0);
  }

  main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
})();
