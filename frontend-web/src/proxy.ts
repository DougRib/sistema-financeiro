import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PAGES = [
  "/dashboard",
  "/transacoes",
  "/transferencias",
  "/carteiras",
  "/importar",
  "/categorias",
  "/orcamentos",
  "/metas",
  "/agenda",
  "/relatorios",
  "/insights",
  "/configuracoes",
];

const PROTECTED_API_PREFIXES = [
  "/api/summary",
  "/api/transactions",
  "/api/transfers",
  "/api/wallets",
  "/api/categorias",
  "/api/budgets",
  "/api/goals",
  "/api/bills",
  "/api/reports",
  "/api/insights",
  "/api/import",
  "/api/user",
];

/**
 * CSRF double-submit:
 *   O cookie `csrf` é setado em login/refresh (não httpOnly, lido pelo JS).
 *   O client envia o mesmo valor em `X-CSRF-Token` em writes.
 *   Aqui validamos que header == cookie pra rotas mutantes.
 *
 *   Pulamos rotas de auth iniciais (login/register/refresh) — elas
 *   ainda não têm cookie quando são chamadas pela primeira vez.
 */
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isMutating = MUTATING_METHODS.has(req.method);

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // CSRF: para rotas mutantes (POST/PUT/PATCH/DELETE) protegidas, exige header igual ao cookie.
  if (
    isMutating &&
    isProtectedApi &&
    !CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const csrfCookie = req.cookies.get("csrf")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { ok: false, error: "CSRF token inválido ou ausente" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transacoes/:path*",
    "/transferencias/:path*",
    "/carteiras/:path*",
    "/importar/:path*",
    "/categorias/:path*",
    "/orcamentos/:path*",
    "/metas/:path*",
    "/agenda/:path*",
    "/relatorios/:path*",
    "/insights/:path*",
    "/configuracoes/:path*",
    "/api/:path*",
  ],
};
