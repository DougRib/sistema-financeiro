export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"; 
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

// pega o token no cookie e devolve o id do usuário (sub), se o token for válido
function getUserId(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  const payload = verifyJwt<{ sub: number }>(token);
  return payload?.sub ?? null;
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // identifica o usuário logado a partir do token
  const userId = getUserId(req);

  // se não estiver logado, bloqueia com 401
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // pega o id da categoria pela URL dinâmica ([id])
  const { id } = await context.params;
  const categoryId = Number(id);

  // se o id não for um número válido, retorna erro 400
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json(
      { ok: false, error: "ID inválido" },
      { status: 400 },
    );
  }

  // busca a categoria no banco pelo id
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  // se não existir ou não pertencer ao usuário logado, retorna 404
  if (!category || category.userId !== userId) {
    return NextResponse.json(
      { ok: false, error: "Categoria não encontrada" },
      { status: 404 },
    );
  }

  // usa transação para: remover a categoria das transações e depois deletar a categoria
  
  await prisma.$transaction(async (trx) => {
    // remove o vínculo da categoria em todas as transações desse usuário (evita quebre)
    await trx.transaction.updateMany({
      where: {
        userId,
        categoryId,
      },
      data: {
        categoryId: null,
      },
    });

    // deleta a categoria do banco
    await trx.category.delete({
      where: { id: categoryId },
    });
  });

  // retorna sucesso genérico
  return NextResponse.json({ ok: true });
}
