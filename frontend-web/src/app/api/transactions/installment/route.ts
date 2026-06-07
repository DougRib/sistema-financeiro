export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { friendlyError } from "@/lib/api-errors";

const schema = z.object({
  walletId: z.number().int(),
  categoryId: z.number().int().nullable().optional(),
  description: z.string().max(255).optional(),
  /** Valor total da compra (será dividido pelas parcelas). */
  totalAmount: z.number().positive(),
  installments: z.number().int().min(2).max(60),
  /** Data da compra. As parcelas seguintes ficam 1 mês depois cada. */
  occurredAt: z.string().datetime(),
});

/**
 * Cria uma compra parcelada: N transações (uma por parcela), todas marcadas com
 * installmentGroupId. installmentNumber é 1-based.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
    }

    const { walletId, categoryId, description, totalAmount, installments, occurredAt } =
      parsed.data;

    const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });
    }

    if (categoryId != null) {
      const cat = await prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId }, { userId: null }] },
      });
      if (!cat) {
        return NextResponse.json({ ok: false, error: "Categoria inválida" }, { status: 400 });
      }
    }

    const group = crypto.randomUUID();
    const baseDate = new Date(occurredAt);
    // Divide com possível ajuste no último centavo
    const per = Math.floor((totalAmount * 100) / installments) / 100;
    const remainder = parseFloat((totalAmount - per * installments).toFixed(2));

    const rows = Array.from({ length: installments }, (_, i) => {
      const d = new Date(baseDate);
      d.setUTCMonth(d.getUTCMonth() + i);
      const amount = i === installments - 1 ? parseFloat((per + remainder).toFixed(2)) : per;
      return {
        type: "EXPENSE" as const,
        amount,
        occurredAt: d,
        description: description
          ? `${description} (${i + 1}/${installments})`
          : `Parcela ${i + 1}/${installments}`,
        categoryId: categoryId ?? null,
        walletId,
        userId,
        installmentGroupId: group,
        installmentNumber: i + 1,
        installmentTotal: installments,
      };
    });

    await prisma.$transaction(async (trx) => {
      await trx.transaction.createMany({ data: rows });
      // Saldo do cartão de crédito acompanha o valor TOTAL da compra (o usuário deve a fatura completa).
      await trx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: totalAmount } },
      });
    });

    return NextResponse.json({ ok: true, installmentGroupId: group, count: installments });
  } catch (err) {
    console.error("[/api/transactions/installment]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
