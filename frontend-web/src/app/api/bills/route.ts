export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const billSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  dueDay: z.number().int().min(1).max(28),
  categoryId: z.number().int().optional(),
  walletId: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const bills = await prisma.recurringBill.findMany({
    where: { userId, isActive: true },
    include: { category: true, wallet: true },
    orderBy: { dueDay: "asc" },
  });

  const today = new Date().getDate();

  return NextResponse.json({
    ok: true,
    bills: bills.map(b => ({
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      dueDay: b.dueDay,
      categoryName: b.category?.name ?? null,
      walletName: b.wallet?.name ?? null,
      walletId: b.walletId,
      daysUntil: b.dueDay >= today ? b.dueDay - today : 28 - today + b.dueDay,
      isOverdue: b.dueDay < today,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const { name, amount, dueDay, categoryId, walletId } = parsed.data;

  // Validate optional foreign keys
  if (categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: categoryId, OR: [{ userId }, { userId: null }] } });
    if (!cat) return NextResponse.json({ ok: false, error: "Categoria inválida" }, { status: 400 });
  }
  if (walletId) {
    const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
    if (!wallet) return NextResponse.json({ ok: false, error: "Carteira inválida" }, { status: 400 });
  }

  const bill = await prisma.recurringBill.create({
    data: { userId, name, amount, dueDay, categoryId: categoryId ?? null, walletId: walletId ?? null },
  });

  return NextResponse.json({ ok: true, bill: { ...bill, amount: Number(bill.amount) } });
}
