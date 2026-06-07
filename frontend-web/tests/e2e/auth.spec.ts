import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
  test("/login mostra form de email + senha", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder(/seu@email.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Entrar$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Esqueci minha senha/i })).toBeVisible();
  });

  test("/login com credenciais inválidas mostra toast de erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/seu@email.com/i).fill("naoexiste@example.com");
    await page.getByPlaceholder(/••••••••/i).fill("senhainvalida");
    await page.getByRole("button", { name: /^Entrar$/ }).click();
    // Toast aparece no topo
    await expect(page.getByText(/Falha no login/i)).toBeVisible({ timeout: 5000 });
  });

  test("/register mostra formulário completo", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByPlaceholder(/Seu nome completo/i)).toBeVisible();
    await expect(page.getByPlaceholder(/seu@email.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Mínimo 8 caracteres/i)).toBeVisible();
  });

  test("/forgot-password mostra form de recuperação", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Esqueci a senha/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Enviar link de recuperação/i }),
    ).toBeVisible();
  });

  test("/forgot-password envia e mostra confirmação", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByPlaceholder(/seu@email.com/i).fill("qualquer@example.com");
    await page.getByRole("button", { name: /Enviar link/i }).click();
    // API sempre retorna ok=true (anti-enumeração)
    await expect(page.getByText(/Verifique seu email/i)).toBeVisible({ timeout: 5000 });
  });

  test("redireciona páginas autenticadas para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
