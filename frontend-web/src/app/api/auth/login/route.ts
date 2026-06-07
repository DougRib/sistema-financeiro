export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { comparePassword, signJwt } from "@/lib/auth";
import { friendlyError } from "@/lib/api-errors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createSession } from "@/lib/sessions";
import { setAuthCookies } from "@/lib/auth-cookies";
import { audit } from "@/lib/audit";

type LoginResponse =
  | { ok: true; id: number; name: string; email: string }
  | { ok: false; error: string };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    // Rate-limit: 5 tentativas/min/IP
    const limited = rateLimit(`login:${ip}`, { max: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json<LoginResponse>(
        {
          ok: false,
          error: `Muitas tentativas. Tente novamente em ${limited.retryAfterSeconds}s.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSeconds) },
        },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Credenciais inválidas" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await audit({ action: "auth.login_failed", ipAddress: ip, userAgent, metadata: { email } });
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Usuário ou senha incorretos" },
        { status: 401 },
      );
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      await audit({
        action: "auth.login_failed",
        userId: user.id,
        ipAddress: ip,
        userAgent,
        metadata: { email, reason: "wrong_password" },
      });
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Usuário ou senha incorretos" },
        { status: 401 },
      );
    }

    // Cria refresh session (DB) e access token (JWT 1h).
    const session = await createSession({ userId: user.id, userAgent, ipAddress: ip });
    const accessToken = signJwt({ sub: user.id, sid: session ? "x" : "" });

    await setAuthCookies({ accessToken, refreshToken: session.token });
    await audit({ action: "auth.login", userId: user.id, ipAddress: ip, userAgent });

    return NextResponse.json<LoginResponse>({
      ok: true,
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err: unknown) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json<LoginResponse>(
      { ok: false, error: friendlyError(err) },
      { status: 500 },
    );
  }
}
