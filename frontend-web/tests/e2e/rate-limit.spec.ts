import { test, expect } from "@playwright/test";

test.describe("Rate limiting", () => {
  test("/api/auth/login bloqueia após 5 tentativas em 1 minuto", async ({ request }) => {
    const payload = { email: "naoexiste@example.com", password: "x" };

    // 5 tentativas válidas (todas devem retornar 401 — credenciais erradas)
    for (let i = 0; i < 5; i++) {
      const r = await request.post("/api/auth/login", { data: payload });
      expect([401, 429]).toContain(r.status());
    }

    // 6ª deve ser 429
    const blocked = await request.post("/api/auth/login", { data: payload });
    expect(blocked.status()).toBe(429);
    expect(blocked.headers()["retry-after"]).toBeTruthy();
  });
});
