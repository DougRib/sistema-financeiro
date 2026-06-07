export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createVerificationToken } from "@/lib/verification-tokens";
import { sendEmail, verifyEmailEmail } from "@/lib/email";
import { friendlyError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);

  try {
    // Limita 1 reenvio/min/usuário pra evitar spam.
    const limited = rateLimit(`resend-verify:${userId}`, { max: 1, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Aguarde ${limited.retryAfterSeconds}s antes de reenviar.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    if (user.emailVerified) {
      return NextResponse.json({ ok: false, error: "Email já verificado" }, { status: 400 });
    }

    const token = await createVerificationToken(userId, "EMAIL_VERIFY");
    const tpl = verifyEmailEmail(user.name, token);
    await sendEmail({ ...tpl, to: user.email });

    return NextResponse.json({ ok: true, ipAddress: ip });
  } catch (err) {
    console.error("[/api/auth/resend-verification]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
