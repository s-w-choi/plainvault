/**
 * E2E Smoke Test Script
 * Runs against live server at http://localhost:13001
 * Usage: pnpm smoke:e2e
 */

const BASE = process.env.SMOKE_BASE || "http://localhost:13000";

async function apiReq(method: string, path: string, body?: object, cookie?: string) {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (cookie) (opts.headers as Record<string,string>)["Cookie"] = cookie;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  // getSetCookie returns ALL Set-Cookie headers (not just the first)
  const cookies = res.headers.getSetCookie();
  // Extract ALL session cookies (session_user_id, session_role, session_status)
  const sessionCookie = cookies.map(c => c.split(";")[0]).join("; ");
  return { status: res.status, body: json, sessionCookie };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAILED: ${msg}`);
}

async function run() {
  console.log("=== E2E Smoke Test ===\n");

  // ── 1. Register & pending block ──────────────────────────────

  console.log("[1/8] Auth - Register & pending block");
  const pendingEmail = `e2e_${Date.now()}@test.local`;
  const reg = await apiReq("POST", "/api/auth/register", { name: "E2E User", email: pendingEmail, password: "pending123" });
  assert(reg.status === 200, `Register failed: ${reg.body?.error?.message}`);
  console.log("  ✓ Registration accepted (pending)");

  const pendingLogin = await apiReq("POST", "/api/auth/login", { email: pendingEmail, password: "pending123" });
  assert(pendingLogin.status === 401, "Pending user should be blocked");
  console.log("  ✓ Pending user blocked from login");

  // ── 2. Admin approve ────────────────────────────────────────

  console.log("\n[2/8] Auth - Admin approve pending user");
  const adminLogin = await apiReq("POST", "/api/auth/login", { email: "admin@internal.local", password: "admin123" });
  assert(adminLogin.status === 200, "Admin login failed");
  const adminCookie = adminLogin.sessionCookie!;
  console.log("  ✓ Admin logged in");

  const usersRes = await apiReq("GET", "/api/admin/users", undefined, adminCookie);
  assert(usersRes.status === 200, "Get users failed");
  const pendingUser = usersRes.body?.users?.find((u: { email: string; status: string }) => u.email === pendingEmail && u.status === "PENDING");
  assert(pendingUser, "Pending user not found");
  console.log("  ✓ Pending user found in admin list");

  const approveRes = await apiReq("POST", `/api/admin/users/${pendingUser.id}/approve`, { role: "VIEWER" }, adminCookie);
  assert(approveRes.status === 200, "User approval failed");
  console.log("  ✓ Pending user approved as VIEWER");

  // ── 3. File CRUD ─────────────────────────────────────────────

  console.log("\n[3/8] File CRUD");

  const devLogin = await apiReq("POST", "/api/auth/login", { email: "developer@internal.local", password: "dev123" });
  assert(devLogin.status === 200, "Dev login failed");
  const devCookie = devLogin.sessionCookie!;
  console.log("  ✓ Developer logged in");

  const createRes = await apiReq("POST", "/api/files", {
    title: "E2E Config",
    actualFileName: ".env.test",
    contentType: "env",
    content: "DATABASE_URL=postgresql://user:secret@localhost\nAPI_KEY=sk-test-abcdef123456\nPUBLIC_KEY=hello",
  }, devCookie);
  assert(createRes.status === 201, `Create file failed: ${createRes.body?.error?.message}`);
  const fileId = createRes.body?.file?.id;
  assert(fileId, "No file ID returned");
  console.log(`  ✓ File created (ID: ${fileId})`);

  const listRes = await apiReq("GET", "/api/files", undefined, devCookie);
  assert(listRes.status === 200 && (listRes.body?.files?.length ?? 0) > 0, "File list failed");
  console.log("  ✓ File list retrieved");

  const getRaw = await apiReq("GET", `/api/files/${fileId}`, undefined, devCookie);
  assert(getRaw.status === 200 && getRaw.body?.file?.content?.includes("sk-test-"), "Dev should see raw content");
  console.log("  ✓ Developer sees raw content");

  const updateRes = await apiReq("PATCH", `/api/files/${fileId}`, {
    content: "DATABASE_URL=postgresql://user:newsecret@localhost\nAPI_KEY=sk-test-updated",
    changeSummary: "E2E update",
  }, devCookie);
  assert(updateRes.status === 200, "Update failed");
  console.log("  ✓ File updated");

  // ── 4. Viewer masking ────────────────────────────────────────

  console.log("\n[4/8] Secret masking for viewer");

  const viewerLogin = await apiReq("POST", "/api/auth/login", { email: pendingEmail, password: "pending123" });
  assert(viewerLogin.status === 200, "Viewer login failed");
  const viewerCookie = viewerLogin.sessionCookie!;
  console.log("  ✓ Viewer logged in");

  const viewerGet = await apiReq("GET", `/api/files/${fileId}`, undefined, viewerCookie);
  assert(viewerGet.status === 200, "Viewer get failed");
  const viewerContent = viewerGet.body?.file?.content ?? "";
  assert(!viewerContent.includes("sk-test-"), "Viewer should NOT see raw API key");
  assert(viewerContent.includes("********"), "Viewer should see masked content");
  console.log("  ✓ Viewer sees masked content only");

  const viewerRaw = await apiReq("GET", `/api/files/${fileId}/raw`, undefined, viewerCookie);
  assert(viewerRaw.status === 403, "Viewer raw should be denied");
  console.log("  ✓ Viewer raw access denied (403)");

  // ── 5. Revisions & diff ─────────────────────────────────────

  console.log("\n[5/8] Revisions & diff");

  const revList = await apiReq("GET", `/api/files/${fileId}/revisions`, undefined, adminCookie);
  assert(revList.status === 200, "Revision list failed");
  assert((revList.body?.revisions?.length ?? 0) >= 2, "Should have 2+ revisions");
  console.log(`  ✓ Revision list (${revList.body.revisions.length} revisions)`);

  const revs = revList.body.revisions;
  const diffRes = await apiReq("GET", `/api/files/${fileId}/revisions/${revs[0].id}/diff`, undefined, adminCookie);
  assert(diffRes.status === 200 && diffRes.body?.diff, "Diff request failed");
  console.log("  ✓ Revision diff retrieved");

  const viewerDiff = await apiReq("GET", `/api/files/${fileId}/revisions/${revs[0].id}/diff`, undefined, viewerCookie);
  assert(viewerDiff.status === 403, "Viewer diff should be denied");
  console.log("  ✓ Viewer diff denied (403)");

  // ── 6. API Key ───────────────────────────────────────────────

  console.log("\n[6/8] API Key raw access");

  const keyRes = await apiReq("POST", "/api/admin/api-keys", {
    name: "E2E Test Key",
    expiresInDays: 7,
  }, adminCookie);
  assert(keyRes.status === 201, `API Key create failed: ${keyRes.body?.error?.message}`);
  const rawKey = keyRes.body?.apiKey?.key;
  const keyPrefix = keyRes.body?.apiKey?.keyPrefix;
  assert(rawKey && keyPrefix, "API key not returned");
  console.log(`  ✓ API Key created (prefix: ${keyPrefix})`);

  const rawAccessRes = await fetch(`${BASE}/api/v1/files/${fileId}/raw`, {
    headers: { "Authorization": `Bearer ${rawKey}` },
  });
  let rawJson;
  try { rawJson = await rawAccessRes.json(); } catch { rawJson = null; }
  assert(rawAccessRes.status === 200 && rawJson?.content?.includes("sk-test-"), "API key raw access failed");
  console.log("  ✓ API Key raw access works");

  const keyId = keyRes.body?.apiKey?.id;
  const revokeRes = await apiReq("DELETE", `/api/admin/api-keys/${keyId}`, undefined, adminCookie);
  assert(revokeRes.status === 200, "API Key revoke failed");
  console.log("  ✓ API Key revoked");

  const revokedAccess = await fetch(`${BASE}/api/v1/files/${fileId}/raw`, {
    headers: { "Authorization": `Bearer ${rawKey}` },
  });
  assert(revokedAccess.status === 401 || revokedAccess.status === 403, "Revoked key should be denied");
  console.log("  ✓ Revoked API Key denied");

  // ── 7. Audit logs ────────────────────────────────────────────

  console.log("\n[7/8] Audit logs");

  const auditRes = await apiReq("GET", "/api/admin/audit-logs", undefined, adminCookie);
  assert(auditRes.status === 200 && (auditRes.body?.logs?.length ?? 0) > 0, "Audit log fetch failed");
  const auditText = JSON.stringify(auditRes.body);
  assert(!auditText.includes("sk-test-"), "Audit logs should NOT contain raw secrets");
  console.log("  ✓ Audit logs clean (no raw secrets)");

  // ── 8. RBAC ──────────────────────────────────────────────────

  console.log("\n[8/8] RBAC enforcement");

  const adminUsers = await apiReq("GET", "/api/admin/users", undefined, adminCookie);
  assert(adminUsers.status === 200, "Admin should access admin API");
  console.log("  ✓ Admin has admin access");

  const devAdminTry = await apiReq("GET", "/api/admin/users", undefined, devCookie);
  assert(devAdminTry.status === 403, "Developer should be denied admin access");
  console.log("  ✓ Developer denied admin access");

  const deleteRes = await apiReq("DELETE", `/api/files/${fileId}`, undefined, adminCookie);
  assert(deleteRes.status === 200, "Admin delete failed");
  console.log("  ✓ Admin can delete files");

  // Dev cannot delete
  const devFileRes = await apiReq("POST", "/api/files", {
    title: "Dev File",
    actualFileName: "dev.txt",
    contentType: "text",
    content: "content",
  }, devCookie);
  if (devFileRes.status === 201) {
    const devDelete = await apiReq("DELETE", `/api/files/${devFileRes.body?.file?.id}`, undefined, devCookie);
    assert(devDelete.status === 403, "Developer should not delete");
    console.log("  ✓ Developer cannot delete files");
  }

  console.log("\n=== ALL E2E TESTS PASSED ===\n");
  process.exit(0);
}

run().catch(err => {
  console.error(`\n${err.message}\n`);
  process.exit(1);
});