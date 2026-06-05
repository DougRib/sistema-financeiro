export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const budgetSchema = z.object({
  categoryId: z.number().int(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limit: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  if (!month || !year) return NextResponse.json({ ok: false, error: "month e year obrigatórios" }, { status: 400 });

  const [budgets, txs] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        occurredAt: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        },
      },
      select: { categoryId: true, amount: true },
    }),
  ]);

  // Calculate spent per category
  const spentMap: Record<number, number> = {};
  for (const tx of txs) {
    if (tx.categoryId) {
      spentMap[tx.categoryId] = (spentMap[tx.categoryId] ?? 0) + Number(tx.amount);
    }
  }

  const result = budgets.map(b => ({
    id: b.id,
    categoryId: b.categoryId,
    categoryName: b.category.name,
    month: b.month,
    year: b.year,
    limit: Number(b.limit),
    spent: spentMap[b.categoryId] ?? 0,
    pct: Math.round(((spentMap[b.categoryId] ?? 0) / Number(b.limit)) * 100),
  }));

  const totalLimit = result.reduce((s, b) => s + b.limit, 0);
  const totalSpent = result.reduce((s, b) => s + b.spent, 0);

  return NextResponse.json({ ok: true, budgets: result, totalLimit, totalSpent });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const { categoryId, month, year, limit } = parsed.data;

  // Verifica se a categoria pertence ao usuário ou é padrão (userId null)
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) {
    return NextResponse.json({ ok: false, error: "Categoria inválida" }, { status: 400 });
  }

  // Upsert — update if exists, create otherwise
  const budget = await prisma.budget.upsert({
    where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
    update: { limit },
    create: { userId, categoryId, month, year, limit },
  });

  return NextResponse.json({ ok: true, budget });
}
