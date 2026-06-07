import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("/ retorna CSP, X-Frame-Options, X-Content-Type-Options", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["content-security-policy"]).toBeTruthy();
    expect(r.headers()["x-frame-options"]).toBe("DENY");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
    expect(r.headers()["referrer-policy"]).toBeTruthy();
  });

  test("CSP nega frame-ancestors", async ({ request }) => {
    const r = await request.get("/");
    const csp = r.headers()["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("Permissions-Policy bloqueia camera/microphone", async ({ request }) => {
    const r = await request.get("/");
    const pp = r.headers()["permissions-policy"];
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
  });
});
