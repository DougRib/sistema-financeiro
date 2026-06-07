export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/verification-tokens";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 400 });
    }

    const result = await consumeVerificationToken(parsed.data.token, "EMAIL_VERIFY");
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: result.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    await audit({
      action: "auth.email_verified",
      userId: result.userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/verify-email]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
