export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["CHECKING", "CREDIT", "INVESTMENT", "OTHER"]).optional(),
});

type Params = { id: string };

export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const walletId = Number(id);
  if (isNaN(walletId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
  if (!wallet) return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });

  const updated = await prisma.wallet.update({
    where: { id: walletId },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, wallet: updated });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const walletId = Number(id);
  if (isNaN(walletId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
  if (!wallet) return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });

  // Check if wallet has transactions
  const txCount = await prisma.transaction.count({ where: { walletId } });
  if (txCount > 0) {
    return NextResponse.json(
      { ok: false, error: `Não é possível excluir — carteira tem ${txCount} transações vinculadas` },
      { status: 409 },
    );
  }

  await prisma.wallet.delete({ where: { id: walletId } });
  return NextResponse.json({ ok: true });
}
