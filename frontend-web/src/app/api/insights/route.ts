export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

type Severity = "info" | "good" | "warn" | "danger";

interface Insight {
  id: string;
  severity: Severity;
  icon: string;
  title: string;
  body: string;
  metric?: string;
}

function monthRange(year: number, month0: number) {
  return {
    start: new Date(Date.UTC(year, month0, 1)),
    end: new Date(Date.UTC(year, month0 + 1, 1)),
  };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function brl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const curr = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const prev = monthRange(now.getUTCFullYear(), now.getUTCMonth() - 1);

  const [currTxs, prevTxs, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        occurredAt: { gte: curr.start, lt: curr.end },
      },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        occurredAt: { gte: prev.start, lt: prev.end },
      },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: {
        userId,
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear(),
      },
      include: { category: true },
    }),
  ]);

  const sum = (txs: typeof currTxs, type: "INCOME" | "EXPENSE") =>
    txs.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

  const currIncome = sum(currTxs, "INCOME");
  const currExpense = sum(currTxs, "EXPENSE");
  const prevIncome = sum(prevTxs, "INCOME");
  const prevExpense = sum(prevTxs, "EXPENSE");

  const insights: Insight[] = [];

  // Savings rate
  if (currIncome > 0) {
    const rate = Math.round(((currIncome - currExpense) / currIncome) * 100);
    if (rate >= 30) {
      insights.push({
        id: "savings-rate-good",
        severity: "good",
        icon: "🏆",
        title: "Excelente taxa de poupança",
        body: `Você está economizando ${rate}% da sua renda este mês — bem acima do recomendado (20%).`,
        metric: `${rate}%`,
      });
    } else if (rate < 0) {
      insights.push({
        id: "savings-rate-neg",
        severity: "danger",
        icon: "⚠️",
        title: "Despesas acima da receita",
        body: `Você gastou ${brl(currExpense - currIncome)} a mais do que recebeu este mês. Reveja seus gastos prioritários.`,
        metric: `${rate}%`,
      });
    } else if (rate < 10) {
      insights.push({
        id: "savings-rate-low",
        severity: "warn",
        icon: "📉",
        title: "Taxa de poupança baixa",
        body: `Sua taxa de poupança está em ${rate}%. Considere reduzir gastos para alcançar pelo menos 20%.`,
        metric: `${rate}%`,
      });
    }
  }

  // Expense growth vs last month
  if (prevExpense > 0) {
    const change = pctChange(currExpense, prevExpense);
    if (change >= 25) {
      insights.push({
        id: "expense-spike",
        severity: "warn",
        icon: "🔥",
        title: "Despesas dispararam",
        body: `Suas despesas cresceram ${change}% em relação ao mês anterior (${brl(currExpense)} vs ${brl(prevExpense)}).`,
        metric: `+${change}%`,
      });
    } else if (change <= -15) {
      insights.push({
        id: "expense-down",
        severity: "good",
        icon: "✂️",
        title: "Você cortou despesas",
        body: `Despesas caíram ${Math.abs(change)}% comparado ao mês passado. Continue assim!`,
        metric: `${change}%`,
      });
    }
  }

  // Top category
  const byCat = new Map<string, number>();
  for (const tx of currTxs.filter((t) => t.type === "EXPENSE")) {
    const key = tx.category?.name ?? "Sem categoria";
    byCat.set(key, (byCat.get(key) ?? 0) + Number(tx.amount));
  }
  if (byCat.size > 0 && currExpense > 0) {
    const sortedCats = Array.from(byCat).sort((a, b) => b[1] - a[1]);
    const [topName, topValue] = sortedCats[0];
    const topPct = Math.round((topValue / currExpense) * 100);
    if (topPct >= 35) {
      insights.push({
        id: "top-cat-concentration",
        severity: "info",
        icon: "🎯",
        title: `${topName} domina seus gastos`,
        body: `${topPct}% das suas despesas este mês foram em ${topName} (${brl(topValue)}). Considere diversificar ou criar um orçamento.`,
        metric: `${topPct}%`,
      });
    }
  }

  // Category that grew the most
  const prevByCat = new Map<string, number>();
  for (const tx of prevTxs.filter((t) => t.type === "EXPENSE")) {
    const key = tx.category?.name ?? "Sem categoria";
    prevByCat.set(key, (prevByCat.get(key) ?? 0) + Number(tx.amount));
  }
  const growths: { name: string; curr: number; prev: number; delta: number; pct: number }[] = [];
  for (const [name, currVal] of byCat) {
    const prevVal = prevByCat.get(name) ?? 0;
    if (prevVal >= 50 && currVal > prevVal * 1.5) {
      growths.push({
        name,
        curr: currVal,
        prev: prevVal,
        delta: currVal - prevVal,
        pct: pctChange(currVal, prevVal),
      });
    }
  }
  growths.sort((a, b) => b.delta - a.delta);
  if (growths[0]) {
    const g = growths[0];
    insights.push({
      id: `cat-growth-${g.name}`,
      severity: "warn",
      icon: "📈",
      title: `Aumento expressivo em ${g.name}`,
      body: `Você gastou ${brl(g.curr)} em ${g.name}, ${g.pct}% a mais que no mês anterior (${brl(g.prev)}).`,
      metric: `+${g.pct}%`,
    });
  }

  // Budget breaches
  for (const b of budgets) {
    const spent = byCat.get(b.category.name) ?? 0;
    const limit = Number(b.limit);
    if (limit <= 0) continue;
    const used = Math.round((spent / limit) * 100);
    if (used >= 100) {
      insights.push({
        id: `budget-over-${b.id}`,
        severity: "danger",
        icon: "🚨",
        title: `Orçamento estourado em ${b.category.name}`,
        body: `Você já gastou ${brl(spent)} contra um limite de ${brl(limit)} (${used}% utilizado).`,
        metric: `${used}%`,
      });
    } else if (used >= 80) {
      insights.push({
        id: `budget-warn-${b.id}`,
        severity: "warn",
        icon: "⚡",
        title: `Atenção ao orçamento de ${b.category.name}`,
        body: `${used}% do limite mensal já foi utilizado (${brl(spent)} de ${brl(limit)}).`,
        metric: `${used}%`,
      });
    }
  }

  // Projection — extrapolate based on day of month
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const dayOfMonth = now.getUTCDate();
  if (dayOfMonth >= 5 && dayOfMonth <= daysInMonth - 3 && currExpense > 0) {
    const projected = Math.round((currExpense / dayOfMonth) * daysInMonth);
    if (prevExpense > 0 && projected > prevExpense * 1.2) {
      insights.push({
        id: "projection",
        severity: "info",
        icon: "🔮",
        title: "Projeção de fim de mês",
        body: `No ritmo atual, suas despesas devem fechar em ~${brl(projected)} — ${pctChange(projected, prevExpense)}% acima do mês passado.`,
        metric: brl(projected),
      });
    }
  }

  // Small frequent expenses
  const smallExpenses = currTxs.filter((t) => t.type === "EXPENSE" && Number(t.amount) <= 30);
  if (smallExpenses.length >= 15) {
    const total = smallExpenses.reduce((s, t) => s + Number(t.amount), 0);
    insights.push({
      id: "small-frequent",
      severity: "info",
      icon: "☕",
      title: "Pequenos gastos somam muito",
      body: `${smallExpenses.length} transações de até R$30 totalizam ${brl(total)} este mês.`,
      metric: `${smallExpenses.length}x`,
    });
  }

  // Empty-state
  if (insights.length === 0) {
    if (currTxs.length === 0) {
      insights.push({
        id: "empty",
        severity: "info",
        icon: "👋",
        title: "Comece a registrar transações",
        body: "Registre suas receitas e despesas para começar a receber insights personalizados.",
      });
    } else {
      insights.push({
        id: "all-good",
        severity: "good",
        icon: "✅",
        title: "Está tudo sob controle",
        body: "Não detectamos nada fora do esperado este mês. Continue acompanhando!",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    insights,
    meta: {
      currentMonth: { income: currIncome, expense: currExpense },
      previousMonth: { income: prevIncome, expense: prevExpense },
    },
  });
}
