export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

// identifica o usuário logado
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  // se não estiver logado, bloqueia
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  // busca as carteiras do usuário
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // retorna as carteiras (cache privado curto — saldo muda mas no horizonte de 15s é estável)
  return NextResponse.json(
    { ok: true, wallets },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(["CHECKING", "CREDIT", "INVESTMENT", "OTHER"]).default("CHECKING"),
    balance: z.number().default(0),
    creditLimit: z.number().positive().optional(),
    closingDay: z.number().int().min(1).max(31).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }

  const wallet = await prisma.wallet.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      balance: parsed.data.balance,
      userId,
      ...(parsed.data.type === "CREDIT"
        ? {
            creditLimit: parsed.data.creditLimit ?? null,
            closingDay: parsed.data.closingDay ?? null,
            dueDay: parsed.data.dueDay ?? null,
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, wallet }, { status: 201 });
}
