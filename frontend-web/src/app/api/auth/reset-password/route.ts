export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { consumeVerificationToken } from "@/lib/verification-tokens";
import { revokeAllSessionsForUser } from "@/lib/sessions";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error?.issues?.[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const result = await consumeVerificationToken(parsed.data.token, "PASSWORD_RESET");
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: result.userId },
      data: { passwordHash: newHash },
    });

    // Por segurança, revoga todas as sessões — o atacante (se houver) é expulso.
    await revokeAllSessionsForUser(result.userId);

    await audit({
      action: "auth.password_reset_completed",
      userId: result.userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/reset-password]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
