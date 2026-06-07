export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, signJwt } from "@/lib/auth";
import { friendlyError } from "@/lib/api-errors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createSession } from "@/lib/sessions";
import { setAuthCookies } from "@/lib/auth-cookies";
import { audit } from "@/lib/audit";

type RegisterResponse =
  | { ok: true; user: { id: number; name: string; email: string } }
  | { ok: false; error: string };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    // Rate-limit: 3 cadastros/hora/IP
    const limited = rateLimit(`register:${ip}`, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json<RegisterResponse>(
        {
          ok: false,
          error: `Muitas contas criadas deste endereço. Tente novamente em ${Math.ceil(limited.retryAfterSeconds / 60)} min.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<RegisterResponse>(
        { ok: false, error: "Dados inválidos para cadastro" },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json<RegisterResponse>(
        { ok: false, error: "E-mail já cadastrado" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        wallets: { create: { name: "Carteira", balance: 0 } },
      },
    });

    const session = await createSession({ userId: user.id, userAgent, ipAddress: ip });
    const accessToken = signJwt({ sub: user.id });
    await setAuthCookies({ accessToken, refreshToken: session.token });

    await audit({ action: "auth.register", userId: user.id, ipAddress: ip, userAgent });

    return NextResponse.json<RegisterResponse>({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: unknown) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json<RegisterResponse>(
      { ok: false, error: friendlyError(err) },
      { status: 500 },
    );
  }
}
