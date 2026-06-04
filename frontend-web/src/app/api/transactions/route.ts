export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { transactionSchema } from "@/lib/validators";
import type { Prisma } from "@/app/generated/prisma/client";

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
      { status: 401 },
    );
  }

  // lê parâmetros de filtro (?month=...&year=...)
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  // base do filtro: sempre pelo userId
  const where: Prisma.TransactionWhereInput = { userId };

  // se month e year foram informados, filtra pelas datas do mês
  if (month && year) {
    const m = Number(month);
    const y = Number(year);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));

    where.occurredAt = {
      gte: start,
      lt: end,
    };
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
