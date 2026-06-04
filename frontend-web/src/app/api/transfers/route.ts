export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const transferSchema = z.object({
  amount: z.number().positive(),
  fromWalletId: z.number().int(),
  toWalletId: z.number().int(),
  occurredAt: z.string().datetime(),
  description: z.string().max(255).optional(),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  const where: { userId: number; type: "TRANSFER"; occurredAt?: { gte: Date; lt: Date } } = {
    userId,
    type: "TRANSFER",
  };

  if (month && year) {
    const m = Number(month);
    const y = Number(year);
    where.occurredAt = {
      gte: new Date(Date.UTC(y, m - 1, 1)),
      lt: new Date(Date.UTC(y, m, 1)),
    };
  }

  // Fetch all TRANSFER transactions for the user
  const txs = await prisma.transaction.findMany({
    where,
    include: { wallet: true },
    orderBy: { occurredAt: "desc" },
  });

  // Group pairs by transferGroupId
  const groups: Record<string, typeof txs> = {};
  for (const tx of txs) {
    const key = tx.transferGroupId ?? String(tx.id);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  // Return as transfer pairs
  const transfers = Object.values(groups).map((pair) => {
    return {
      transferGroupId: pair[0].transferGroupId,
      amount: Number(pair[0].amount),
      occurredAt: pair[0].occurredAt,
      description: pair[0].description,
      from: pair[0].wallet ?? null,
      to: pair[1]?.wallet ?? null,
      transactions: pair.map((t) => ({ id: t.id, walletId: t.walletId, walletName: t.wallet?.name })),
    };
  });

  return NextResponse.json({ ok: true, transfers });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const { amount, fromWalletId, toWalletId, occurredAt, description } = parsed.data;

  if (fromWalletId === toWalletId) {
    return NextResponse.json({ ok: false, error: "Carteiras de origem e destino devem ser diferentes" }, { status: 400 });
  }

  // Verify both wallets belong to user
  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({ where: { id: fromWalletId, userId } }),
    prisma.wallet.findFirst({ where: { id: toWalletId, userId } }),
  ]);

  if (!fromWallet) return NextResponse.json({ ok: false, error: "Carteira de origem não encontrada" }, { status: 404 });
  if (!toWallet) return NextResponse.json({ ok: false, error: "Carteira de destino não encontrada" }, { status: 404 });

  const transferGroupId = crypto.randomUUID();
  const date = new Date(occurredAt);

  try {
    await prisma.$transaction(async (trx) => {
      // Create origin transaction record
      await trx.transaction.create({
        data: {
          type: "TRANSFER",
          amount,
          occurredAt: date,
          description: description ?? null,
          walletId: fromWalletId,
          userId,
          transferGroupId,
        },
      });

      // Create destination transaction record
      await trx.transaction.create({
        data: {
          type: "TRANSFER",
          amount,
          occurredAt: date,
          description: description ?? null,
          walletId: toWalletId,
          userId,
          transferGroupId,
        },
      });

      // Update balances
      await trx.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
      await trx.wallet.update({ where: { id: toWalletId }, data: { balance: { increment: amount } } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
