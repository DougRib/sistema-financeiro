export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { comparePassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({ password: z.string().min(1) });

/**
 * Desativa 2FA — exige confirmação de senha como reauth.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Senha obrigatória" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, twoFactorEnabled: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ ok: false, error: "2FA não está ativado" }, { status: 400 });
    }

    const ok = await comparePassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Senha incorreta" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    await audit({ action: "auth.2fa_disabled", userId, ipAddress: ip, userAgent });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/2fa/disable]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
