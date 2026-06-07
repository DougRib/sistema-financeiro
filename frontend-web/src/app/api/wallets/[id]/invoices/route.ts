export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { invoicePeriodForDate } from "@/lib/credit-card";
import { friendlyError } from "@/lib/api-errors";

/**
 * Retorna as faturas de um cartão de crédito agrupadas por mês de fechamento.
 * Cada fatura inclui o total, transações e período (start/closing/due).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const walletId = Number(id);
    if (isNaN(walletId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });
    }
    if (wallet.type !== "CREDIT" || !wallet.closingDay || !wallet.dueDay) {
      return NextResponse.json(
        { ok: false, error: "Carteira não é cartão de crédito configurado" },
        { status: 400 },
      );
    }

    // Pega 6 meses pra trás + 6 pra frente (parcelas futuras)
    const now = new Date();
    const horizon = 6;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - horizon, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + horizon + 1, 1));

    const txs = await prisma.transaction.findMany({
      where: {
        userId,
        walletId,
        type: "EXPENSE",
        occurredAt: { gte: start, lt: end },
      },
      include: { category: { select: { name: true } } },
      orderBy: { occurredAt: "asc" },
    });

    const invoiceMap = new Map<
      string,
      {
        label: string;
        closing: string;
        due: string;
        start: string;
        total: number;
        transactions: {
          id: number;
          occurredAt: string;
          description: string | null;
          amount: number;
          category: string | null;
          installmentNumber: number | null;
          installmentTotal: number | null;
        }[];
      }
    >();

    for (const tx of txs) {
      const period = invoicePeriodForDate(
        new Date(tx.occurredAt),
        wallet.closingDay,
        wallet.dueDay,
      );
      const key = period.closing.toISOString().slice(0, 10);
      const bucket = invoiceMap.get(key) ?? {
        label: period.label,
        closing: period.closing.toISOString(),
        due: period.due.toISOString(),
        start: period.start.toISOString(),
        total: 0,
        transactions: [],
      };
      bucket.total += Number(tx.amount);
      bucket.transactions.push({
        id: tx.id,
        occurredAt: tx.occurredAt.toISOString(),
        description: tx.description,
        amount: Number(tx.amount),
        category: tx.category?.name ?? null,
        installmentNumber: tx.installmentNumber,
        installmentTotal: tx.installmentTotal,
      });
      invoiceMap.set(key, bucket);
    }

    const invoices = Array.from(invoiceMap.values())
      .map((inv) => ({ ...inv, total: parseFloat(inv.total.toFixed(2)) }))
      .sort((a, b) => a.closing.localeCompare(b.closing));

    // Limite e uso atual
    const limit = wallet.creditLimit ? Number(wallet.creditLimit) : null;
    const currentInvoice =
      invoices.find((inv) => new Date(inv.due) >= now && new Date(inv.start) <= now) ?? null;

    return NextResponse.json({
      ok: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        closingDay: wallet.closingDay,
        dueDay: wallet.dueDay,
        creditLimit: limit,
      },
      currentInvoice,
      invoices,
    });
  } catch (err) {
    console.error("[/api/wallets/[id]/invoices]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
