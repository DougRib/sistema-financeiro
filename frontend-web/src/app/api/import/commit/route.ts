export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const rowSchema = z.object({
  occurredAt: z.string().datetime(),
  description: z.string().max(255).nullable().optional(),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.number().int().nullable().optional(),
});

const bodySchema = z.object({
  walletId: z.number().int(),
  rows: z.array(rowSchema).min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }
  const { walletId, rows } = parsed.data;

  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
  if (!wallet) {
    return NextResponse.json({ ok: false, error: "Carteira não encontrada" }, { status: 404 });
  }

  // Validate category ownership (in batch)
  const uniqueCatIds = Array.from(
    new Set(
      rows
        .map((r) => r.categoryId)
        .filter((id): id is number => typeof id === "number"),
    ),
  );
  if (uniqueCatIds.length > 0) {
    const cats = await prisma.category.findMany({
      where: {
        id: { in: uniqueCatIds },
        OR: [{ userId }, { userId: null }],
      },
      select: { id: true },
    });
    const okIds = new Set(cats.map((c) => c.id));
    const bad = uniqueCatIds.find((id) => !okIds.has(id));
    if (bad != null) {
      return NextResponse.json({ ok: false, error: "Categoria inválida" }, { status: 400 });
    }
  }

  const incomeSum = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0);
  const expenseSum = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0);
  const diff = incomeSum - expenseSum;

  try {
    const result = await prisma.$transaction(async (trx) => {
      const created = await trx.transaction.createMany({
        data: rows.map((r) => ({
          type: r.type,
          amount: r.amount,
          occurredAt: new Date(r.occurredAt),
          description: r.description ?? null,
          categoryId: r.categoryId ?? null,
          walletId,
          userId,
        })),
      });

      if (diff !== 0) {
        await trx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: diff } },
        });
      }
      return created.count;
    });

    return NextResponse.json({ ok: true, imported: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
