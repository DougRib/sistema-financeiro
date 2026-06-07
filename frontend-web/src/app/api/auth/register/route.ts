export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"; 
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, signJwt } from "@/lib/auth";
import { friendlyError } from "@/lib/api-errors";
import { cookies } from "next/headers";
//type RegisterResponse
type RegisterResponse =
  | {
      ok: true;
      user: {
        id: number;
        name: string;
        email: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // valida dados com Zod
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<RegisterResponse>(
        { ok: false, error: "Dados inválidos para cadastro" },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    // verifica se email já existe
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json<RegisterResponse>(
        { ok: false, error: "E-mail já cadastrado" },
        { status: 409 },
      );
    }

    // gera hash da senha
    const passwordHash = await hashPassword(password);

    // cria usuário + carteira padrão
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        wallets: {
          create: {
            name: "Carteira",
            balance: 0,
          },
        },
      },
    });


    
    const token = signJwt({ sub: user.id });

    // seta cookie httpOnly
    const cookieStore = await cookies(); 
    cookieStore.set("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
//retorna os dados do usuario
    return NextResponse.json<RegisterResponse>({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json<RegisterResponse>(
      { ok: false, error: friendlyError(err) },
      { status: 500 },
    );
  }
}
