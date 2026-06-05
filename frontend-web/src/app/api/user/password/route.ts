export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { comparePassword, hashPassword } from "@/lib/auth";
import { updatePasswordSchema } from "@/lib/validators";

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updatePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error?.issues?.[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { ok: false, error: "A nova senha deve ser diferente da atual" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
  }

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Senha atual incorreta" }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}
