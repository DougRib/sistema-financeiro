import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PAGES = ["/dashboard"];

const PROTECTED_API_PREFIXES = [
  "/api/summary",
  "/api/transactions",
  "/api/budgets",
  "/api/wallets",
  "/api/categorias",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some((p) =>
    pathname.startsWith(p),
  );

  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
