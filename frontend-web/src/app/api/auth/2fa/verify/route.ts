export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { verifyTotpToken, generateBackupCodes } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({ token: z.string().min(6).max(8) });

/**
 * Confirma o setup do 2FA: verifica o primeiro código TOTP e ativa.
 * Retorna 10 backup codes em texto claro — usuário deve salvar.
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
      return NextResponse.json({ ok: false, error: "Código inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { ok: false, error: "Inicie o setup do 2FA primeiro" },
        { status: 400 },
      );
    }
    if (user.twoFactorEnabled) {
      return NextResponse.json({ ok: false, error: "2FA já está ativado" }, { status: 400 });
    }

    if (!verifyTotpToken(parsed.data.token, user.twoFactorSecret)) {
      return NextResponse.json(
        { ok: false, error: "Código incorreto. Tente novamente." },
        { status: 400 },
      );
    }

    const { codes, hashes } = generateBackupCodes(10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashes,
      },
    });

    await audit({
      action: "auth.2fa_enabled",
      userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ ok: true, backupCodes: codes });
  } catch (err) {
    console.error("[/api/auth/2fa/verify]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
