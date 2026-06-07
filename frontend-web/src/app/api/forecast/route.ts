export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

interface ForecastPoint {
  date: string; // ISO yyyy-mm-dd
  day: number;
  balance: number;
  upcomingBills: { name: string; amount: number }[];
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayDay = now.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

  // Total balance across wallets right now
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { balance: true },
  });
  const startingBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  // Active recurring bills with dueDay >= today's day
  const bills = await prisma.recurringBill.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true, amount: true, dueDay: true },
  });

  // Determine which bills haven't been "paid" yet this month.
  // Heuristic: a bill is considered paid if there's a transaction this month
  // with description containing the bill name OR amount equal to bill amount.
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const txsThisMonth = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      occurredAt: { gte: monthStart, lt: monthEnd },
    },
    select: { description: true, amount: true },
  });

  function isLikelyPaid(billName: string, billAmount: number): boolean {
    const lname = billName.toLowerCase();
    return txsThisMonth.some((t) => {
      const sameAmount = Math.abs(Number(t.amount) - billAmount) < 0.01;
      const matchName = (t.description ?? "").toLowerCase().includes(lname);
      return sameAmount && matchName;
    });
  }

  // Build day-by-day forecast from today to end of month
  const points: ForecastPoint[] = [];
  let runningBalance = startingBalance;

  for (let day = todayDay; day <= lastDayOfMonth; day++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day));
    const dueBills = bills.filter((b) => {
      const dueDay = Math.min(b.dueDay, lastDayOfMonth);
      return dueDay === day && !isLikelyPaid(b.name, Number(b.amount));
    });
    const dueTotal = dueBills.reduce((s, b) => s + Number(b.amount), 0);
    runningBalance -= dueTotal;

    points.push({
      date: date.toISOString().slice(0, 10),
      day,
      balance: parseFloat(runningBalance.toFixed(2)),
      upcomingBills: dueBills.map((b) => ({
        name: b.name,
        amount: parseFloat(Number(b.amount).toFixed(2)),
      })),
    });
  }

  const endOfMonthBalance = points.length > 0 ? points[points.length - 1].balance : startingBalance;
  const totalUpcoming = points.reduce((s, p) => s + p.upcomingBills.reduce((ss, b) => ss + b.amount, 0), 0);
  const upcomingBillsList = bills
    .map((b) => ({
      id: b.id,
      name: b.name,
      amount: parseFloat(Number(b.amount).toFixed(2)),
      dueDay: b.dueDay,
      paid: isLikelyPaid(b.name, Number(b.amount)),
    }))
    .filter((b) => b.dueDay >= todayDay && !b.paid)
    .sort((a, b) => a.dueDay - b.dueDay);

  return NextResponse.json({
    ok: true,
    today: today.toISOString().slice(0, 10),
    startingBalance: parseFloat(startingBalance.toFixed(2)),
    endOfMonthBalance,
    totalUpcoming: parseFloat(totalUpcoming.toFixed(2)),
    points,
    upcomingBills: upcomingBillsList,
  });
}
