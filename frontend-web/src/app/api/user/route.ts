export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { updateProfileSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const [user, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.wallet.count({ where: { userId } }),
      prisma.category.count({ where: { userId } }),
      prisma.goal.count({ where: { userId } }),
    ]),
  ]);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
  }

  const [txCount, walletCount, categoryCount, goalCount] = counts;

  return NextResponse.json({
    ok: true,
    user,
    stats: { txCount, walletCount, categoryCount, goalCount },
  });
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }

  const { name, email } = parsed.data;

  // check email uniqueness if changed
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== userId) {
    return NextResponse.json({ ok: false, error: "E-mail já em uso" }, { status: 409 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
