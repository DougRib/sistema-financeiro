export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";
import type { Prisma } from "@/app/generated/prisma/client";
import { getUserId } from "@/lib/get-user-id";

export async function GET(req: NextRequest) {
  // identifica o usuário logado
  const userId = getUserId(req);

  // se não estiver logado, bloqueia
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // lê parâmetros de filtro (?month=...&year=...)
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  // base do filtro: sempre pelo userId
  const where: Prisma.TransactionWhereInput = { userId };

  // Date range filter: explicit from/to wins over month/year
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (fromParam || toParam) {
    const range: { gte?: Date; lt?: Date } = {};
    if (fromParam) {
      const d = new Date(fromParam);
      if (!isNaN(d.getTime())) range.gte = d;
    }
    if (toParam) {
      const d = new Date(toParam);
      if (!isNaN(d.getTime())) range.lt = d;
    }
    if (range.gte || range.lt) where.occurredAt = range;
  } else if (month && year) {
    const m = Number(month);
    const y = Number(year);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    where.occurredAt = { gte: start, lt: end };
  }

  // type filter
  const typeParam = url.searchParams.get("type");
  if (typeParam && ["INCOME", "EXPENSE", "TRANSFER"].includes(typeParam)) {
    where.type = typeParam as "INCOME" | "EXPENSE" | "TRANSFER";
  }

  // categoryId filter
  const catParam = url.searchParams.get("categoryId");
  if (catParam) {
    const catId = Number(catParam);
    if (!isNaN(catId)) where.categoryId = catId;
  }

  // walletId filter
  const wallParam = url.searchParams.get("walletId");
  if (wallParam) {
    const wallId = Number(wallParam);
    if (!isNaN(wallId)) where.walletId = wallId;
  }

  // text search
  const q = url.searchParams.get("q");
  if (q && q.trim()) {
    where.description = { contains: q.trim(), mode: "insensitive" as const };
  }

  // busca as transações do usuário (com categoria e carteira)
  const txs = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      wallet: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  // retorna a lista de transações
  return NextResponse.json({
    ok: true,
    transactions: txs,
  });
}

export async function POST(req: NextRequest) {
  // identifica o usuário logado
  const userId = getUserId(req);

  // se não estiver logado, bloqueia
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // lê o corpo da requisição
  const body = await req.json();

  // valida os dados com o schema do Zod
  const parsed = transactionSchema.safeParse(body);

  // se os dados forem inválidos, retorna erro 400
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos" },
      { status: 400 },
    );
  }

  // extrai os campos já validados
  const { type, amount, occurredAt, description, categoryId, walletId } =
    parsed.data;

  // verifica se a carteira existe e pertence ao usuário logado
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId },
  });
  if (!wallet) {
    return NextResponse.json(
      { ok: false, error: "Carteira não encontrada" },
      { status: 404 },
    );
  }

  // se foi enviada uma categoria, verifica se ela existe e pertence ao usuário (ou é padrão)
  if (categoryId != null) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!category) {
      return NextResponse.json(
        { ok: false, error: "Categoria inválida" },
        { status: 400 },
      );
    }
  }

  try {
    // usa transação para criar a transação e atualizar o saldo da carteira
    const tx = await prisma.$transaction(async (trx) => {
      // cria a transação no banco
      const created = await trx.transaction.create({
        data: {
          type,
          amount,
          occurredAt: new Date(occurredAt),
          description,
          categoryId: categoryId ?? null, // se não tiver categoria, salva como null
          walletId,
          userId,
        },
      });

      // calcula o impacto no saldo da carteira (entrada soma, saída subtrai)
      const diff =
        type === "INCOME" ? amount : type === "EXPENSE" ? -amount : 0;

      // se tiver impacto, atualiza o saldo da carteira
      if (diff !== 0) {
        await trx.wallet.update({
          where: { id: walletId },
          data: {
            balance: { increment: diff },
          },
        });
      }

      return created;
    });

    // retorna a transação criada
    return NextResponse.json({ ok: true, tx });
  } catch (err: unknown) {
    // trata erro genérico (problema na transação, banco, etc.)
    const message =
      err instanceof Error ? err.message : "Erro interno no servidor";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
