export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";
import { friendlyError } from "@/lib/api-errors";

/**
 * GET: gera um secret PROVISÓRIO e retorna QR + secret pra UI exibir.
 * O secret ainda NÃO ativa o 2FA — precisa do POST /verify pra confirmar.
 * Salvamos o secret provisório em `twoFactorSecret` mas mantemos
 * `twoFactorEnabled=false`.
 */
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    if (user.twoFactorEnabled) {
      return NextResponse.json({ ok: false, error: "2FA já está ativado" }, { status: 400 });
    }

    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, user.email);
    const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 240 });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      ok: true,
      secret,
      qr: qrDataUrl,
      issuer: "FinControl",
      account: user.email,
    });
  } catch (err) {
    console.error("[/api/auth/2fa/setup]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
