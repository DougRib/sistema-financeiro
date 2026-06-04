export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { comparePassword, signJwt } from "@/lib/auth";
import { cookies } from "next/headers";
//type LoginResponse
type LoginResponse =
  | { ok: true; id: number; name: string; email: string }
  | { ok: false; error: string };
//post login e validação
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Credenciais inválidas" },
        { status: 400 },
      );
    }
//extração dos dados
    const { email, password } = parsed.data;
//busca o usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Usuário ou senha incorretos" },
        { status: 401 },
      );
    }
//compara a senha
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Usuário ou senha incorretos" },
        { status: 401 },
      );
    }
//gera um token
    const token = signJwt({ sub: user.id });
//cria um cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
//retorna os dados do usuario
    return NextResponse.json<LoginResponse>({
      ok: true,
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro interno no servidor";
//retorna o erro
    return NextResponse.json<LoginResponse>(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
