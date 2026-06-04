export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/client";

// pega o token no cookie e devolve o id do usuário (sub), se o token for válido
function getUserId(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  const payload = verifyJwt<{ sub: number }>(token);
  return payload?.sub ?? null;
}

export async function GET(req: NextRequest) {
  // identifica o usuário logado
  const userId = getUserId(req);

  // se não estiver logado, bloqueia
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // lê os parâmetros month e year da URL (?month=11&year=2025)
  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  // valida se month e year foram enviados e são válidos
  if (!month || !year) {
    return NextResponse.json(
      { ok: false, error: "month e year são obrigatórios" },
      { status: 400 }
    );
  }

  // calcula o intervalo do mês (início e fim em UTC)
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  // busca todas as transações do usuário nesse mês, já trazendo a categoria
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: { gte: start, lt: end },
    },
    include: {
      category: true,
    },
    orderBy: { occurredAt: "asc" },
  });

  const ZERO = new Decimal(0);

  // soma receitas com precisão decimal
  const income = txs
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc.plus(t.amount), ZERO);

  // soma despesas com precisão decimal
  const expense = txs
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc.plus(t.amount), ZERO);

  // saldo do mês
  const balance = income.minus(expense);

  // agrupa despesas por categoria
  const byCategory = new Map<string, Decimal>();
  txs
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const key = t.category?.name ?? "Sem categoria";
      byCategory.set(key, (byCategory.get(key) ?? ZERO).plus(t.amount));
    });

  const categoriesChart = Array.from(byCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  // saldo diário acumulado
  const byDay = new Map<number, Decimal>();
  txs.forEach((t) => {
    const day = new Date(t.occurredAt).getUTCDate();
    const current = byDay.get(day) ?? ZERO;
    byDay.set(
      day,
      t.type === "INCOME" ? current.plus(t.amount) : current.minus(t.amount),
    );
  });

  const dailyChart = Array.from(byDay)
    .sort((a, b) => a[0] - b[0])
    .map(([day, value]) => ({ day, value: parseFloat(value.toFixed(2)) }));

  const plainTxs = txs.map((t) => ({
    id: t.id,
    type: t.type,
    amount: parseFloat(new Decimal(t.amount).toFixed(2)),
    occurredAt: t.occurredAt.toISOString(),
    description: t.description,
    walletId: t.walletId,
    category: t.category
      ? { id: t.category.id, name: t.category.name }
      : null,
  }));

  return NextResponse.json({
    ok: true,
    income: parseFloat(income.toFixed(2)),
    expense: parseFloat(expense.toFixed(2)),
    balance: parseFloat(balance.toFixed(2)),
    categoriesChart,
    dailyChart,
    transactions: plainTxs,
  });
}
