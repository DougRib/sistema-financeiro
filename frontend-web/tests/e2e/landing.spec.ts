import { test, expect } from "@playwright/test";

test.describe("Landing page (público)", () => {
  test("renderiza com título e CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FinControl/);
    await expect(page.getByRole("heading", { name: /Bem-vindo ao seu controle financeiro/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Entrar no sistema/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Criar minha conta/i })).toBeVisible();
  });

  test("tem JSON-LD estruturado", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toContain("SoftwareApplication");
    expect(jsonLd).toContain("FinControl");
  });

  test("manifest.json existe e responde 200", async ({ request }) => {
    const r = await request.get("/manifest.json");
    expect(r.status()).toBe(200);
    const json = await r.json();
    expect(json.name).toContain("FinControl");
  });

  test("robots.txt e sitemap.xml existem", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const txt = await robots.text();
    expect(txt).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
  });
});
