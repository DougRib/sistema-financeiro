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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

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
