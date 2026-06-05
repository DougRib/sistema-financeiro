export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();

  // Fetch all transactions for the year (excluding TRANSFER)
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      occurredAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    include: { category: true },
    orderBy: { occurredAt: "asc" },
  });

  // Build monthly breakdown
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(year, i, 1).toLocaleDateString("pt-BR", { month: "short" }),
    income: 0,
    expense: 0,
    balance: 0,
  }));

  for (const tx of txs) {
    const m = new Date(tx.occurredAt).getUTCMonth(); // 0-indexed
    const amount = Number(tx.amount);
    if (tx.type === "INCOME") {
      months[m].income += amount;
    } else {
      months[m].expense += amount;
    }
  }

  for (const m of months) {
    m.balance = m.income - m.expense;
    m.income = parseFloat(m.income.toFixed(2));
    m.expense = parseFloat(m.expense.toFixed(2));
    m.balance = parseFloat(m.balance.toFixed(2));
  }

  // Category breakdown for the full year
  const catMap: Record<string, number> = {};
  for (const tx of txs.filter((t) => t.type === "EXPENSE")) {
    const key = tx.category?.name ?? "Sem categoria";
    catMap[key] = parseFloat(((catMap[key] ?? 0) + Number(tx.amount)).toFixed(2));
  }

  const categoriesChart = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalIncome = parseFloat(months.reduce((s, m) => s + m.income, 0).toFixed(2));
  const totalExpense = parseFloat(months.reduce((s, m) => s + m.expense, 0).toFixed(2));
  const totalBalance = parseFloat((totalIncome - totalExpense).toFixed(2));
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return NextResponse.json({
    ok: true,
    year,
    months,
    categoriesChart,
    totalIncome,
    totalExpense,
    totalBalance,
    savingsRate,
  });
}
