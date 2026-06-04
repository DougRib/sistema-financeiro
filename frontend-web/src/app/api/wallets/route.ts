export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
// pega o token no cookie e devolve o id do usuário (sub), se o token for válido
function getUserId(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const payload = verifyJwt<{ sub: number }>(token);
  return payload?.sub ?? null;
}
// identifica o usuário logado
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  // se não estiver logado, bloqueia
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
// busca as carteiras do usuário
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // retorna as carteiras
  return NextResponse.json({ ok: true, wallets });
}
