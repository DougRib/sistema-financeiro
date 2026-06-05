export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

type Params = { id: string };

export async function POST(req: NextRequest, context: { params: Promise<Params> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const billId = Number(id);
  if (isNaN(billId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const bill = await prisma.recurringBill.findFirst({
    where: { id: billId, userId },
  });
  if (!bill) return NextResponse.json({ ok: false, error: "Conta não encontrada" }, { status: 404 });

  // Validate wallet if set
  if (bill.walletId) {
    const wallet = await prisma.wallet.findFirst({ where: { id: bill.walletId, userId } });
    if (!wallet) return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });
  }

  // Create an EXPENSE transaction for this bill
  const today = new Date();
  const occurredAt = new Date(Date.UTC(today.getFullYear(), today.getMonth(), bill.dueDay));

  await prisma.$transaction(async (trx) => {
    await trx.transaction.create({
      data: {
        type: "EXPENSE",
        amount: bill.amount,
        occurredAt,
        description: bill.name,
        categoryId: bill.categoryId,
        walletId: bill.walletId ?? (await trx.wallet.findFirst({ where: { userId } }))!.id,
        userId,
      },
    });

    if (bill.walletId) {
      await trx.wallet.update({
        where: { id: bill.walletId },
        data: { balance: { decrement: bill.amount } },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
