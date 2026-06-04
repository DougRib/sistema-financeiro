export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";

// pega o token no cookie e devolve o id do usuário (sub) se o token for válido
function getUserId(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  const payload = verifyJwt<{ sub: number }>(token);
  return payload?.sub ?? null;
}

// lista categorias padrão + do usuário logado e pega o id do usuário logado a partir do token
export async function GET(req: NextRequest) {

  const userId = getUserId(req);

  // se não estiver logado, bloqueia o acesso
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // busca categorias padrão (globais, sem userId)
  const defaults = await prisma.category.findMany({
    where: { userId: null },
    orderBy: { name: "asc" },
  });

  // busca categorias criadas pelo usuário logado
  const userCats = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // retorna todas as categorias juntas
  return NextResponse.json({
    ok: true,
    categorias: [...defaults, ...userCats],
  });
}

// cria uma nova categoria para o usuário logado e verifica se o usuario esta logado
export async function POST(req: NextRequest) {
 
  const userId = getUserId(req);

  // se não estiver logado, bloqueia o acesso
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // lê o corpo da requisição e valida os dados com o schema do Zod
  const body = await req.json();
  
  const parsed = categorySchema.safeParse(body);

  // se os dados forem inválidos, retorna erro 400
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos" },
      { status: 400 },
    );
  }

  // extrai os campos já validados
  const { name, icon } = parsed.data;

  // verifica se já existe categoria com esse nome para esse usuário
  const exists = await prisma.category.findFirst({
    where: { userId, name },
  });

  // se já existir, retorna erro de conflito
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "Categoria já existe" },
      { status: 409 },
    );
  }

  // cria a nova categoria no banco
  const cat = await prisma.category.create({
    data: {
      name,
      icon,
      userId,
    },
  });

  // retorna a categoria criada
  return NextResponse.json({ ok: true, categoria: cat });
}
