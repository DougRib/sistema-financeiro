export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

type Params = { id: string };

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const budgetId = Number(id);
  if (isNaN(budgetId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) return NextResponse.json({ ok: false, error: "Orçamento não encontrado" }, { status: 404 });

  await prisma.budget.delete({ where: { id: budgetId } });
  return NextResponse.json({ ok: true });
}
