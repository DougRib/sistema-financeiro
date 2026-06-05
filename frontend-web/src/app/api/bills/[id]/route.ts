export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

type Params = { id: string };

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const billId = Number(id);
  if (isNaN(billId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, userId } });
  if (!bill) return NextResponse.json({ ok: false, error: "Conta não encontrada" }, { status: 404 });

  // Soft delete — set isActive = false
  await prisma.recurringBill.update({ where: { id: billId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
