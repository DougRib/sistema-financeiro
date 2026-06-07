export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createVerificationToken } from "@/lib/verification-tokens";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    // Limita 3 pedidos/h/IP — evita enumerar emails + spam.
    const limited = rateLimit(`forgot:${ip}`, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Muitos pedidos. Tente novamente em ${Math.ceil(limited.retryAfterSeconds / 60)} min.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Sempre retornamos sucesso pra não enumerar usuários cadastrados.
    if (user) {
      const token = await createVerificationToken(user.id, "PASSWORD_RESET");
      const tpl = passwordResetEmail(user.name, token);
      await sendEmail({ ...tpl, to: email });
      await audit({
        action: "auth.password_reset_requested",
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Se o email estiver cadastrado, enviamos as instruções.",
    });
  } catch (err) {
    console.error("[/api/auth/forgot-password]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
