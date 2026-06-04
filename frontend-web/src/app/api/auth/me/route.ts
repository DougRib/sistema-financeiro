export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
//type MeResponse
type MeResponse =
  | {
      ok: true;
      authenticated: boolean;
      userId: number | null;
      name?: string;
      email?: string;
    }
  | { ok: false; error: string };
//get me
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
//verifica se o token existe
    if (!token) {
      return NextResponse.json<MeResponse>({
        ok: true,
        authenticated: false,
        userId: null,
      });
    }
//verifica se o token e valido
    const payload = verifyJwt<{ sub: number }>(token);

    if (!payload || !payload.sub) {
      return NextResponse.json<MeResponse>({
        ok: true,
        authenticated: false,
        userId: null,
      });
    }
//busca o usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });
//verifica se o usuario existe
    if (!user) {
      return NextResponse.json<MeResponse>({
        ok: true,
        authenticated: false,
        userId: null,
      });
    }
//retorna os dados do usuario
    return NextResponse.json<MeResponse>({
      ok: true,
      authenticated: true,
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro interno no servidor";
//retorna o erro
    return NextResponse.json<MeResponse>(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
