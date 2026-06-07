export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth";
import { findValidSession, rotateSession } from "@/lib/sessions";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth-cookies";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/api-errors";

/**
 * Renova o access-token usando o refresh token.
 * Rotação obrigatória: o refresh antigo é revogado, um novo é emitido.
 * Fluxo idempotente client-side: chame via fetch wrapper quando receber 401.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    // Rate-limit moderado pra defender contra spam de refresh.
    const limited = rateLimit(`refresh:${ip}`, { max: 30, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Muitas requisições. Aguarde alguns segundos." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!refresh) {
      return NextResponse.json({ ok: false, error: "Sem sessão ativa" }, { status: 401 });
    }

    const session = await findValidSession(refresh);
    if (!session) {
      // Refresh inválido ou expirado: limpa cookies pra forçar novo login.
      await clearAuthCookies();
      return NextResponse.json({ ok: false, error: "Sessão expirada" }, { status: 401 });
    }

    // Rotaciona: revoga a sessão atual e cria uma nova com novo refresh token.
    const next = await rotateSession(session.id, session.userId, userAgent, ip);
    const accessToken = signJwt({ sub: session.userId });
    await setAuthCookies({ accessToken, refreshToken: next.token });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/refresh]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
