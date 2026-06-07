/**
 * Categorização automática por heurística + aprendizado leve.
 *
 * Estratégia:
 *   1) Memória do usuário: mapeamento (description -> categoryId) baseado nos
 *      últimos N transações. Pesa mais.
 *   2) Dicionário de keywords: combina termos comuns no varejo BR com nomes
 *      de categoria. Pesa menos.
 *
 * Sem ML. Sem fetch externo. Roda no server e responde em milissegundos.
 */

import { prisma } from "@/lib/prisma";

interface KeywordRule {
  /** Padrões (case-insensitive) que indicam essa categoria. */
  patterns: string[];
  /** Nome da categoria-alvo (deve existir como categoria do usuário ou padrão). */
  category: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    category: "Alimentação",
    patterns: [
      "ifood", "uber eats", "rappi", "mc donald", "burger king", "subway",
      "padaria", "pao", "pão", "açai", "acai", "lanche", "pizza", "sushi",
      "restaurante", "mercado", "supermercado", "mercadinho", "extra", "carrefour",
      "atacadao", "atacadão", "pao de acucar", "pão de açúcar", "assai",
    ],
  },
  {
    category: "Transporte",
    patterns: [
      "uber", "99", "99 pop", "99pop", "taxi", "táxi", "combustivel", "combustível",
      "posto", "gasolina", "etanol", "alcool", "álcool", "estacionamento",
      "pedagio", "pedágio", "metro", "metrô", "ônibus", "onibus", "bilhete",
    ],
  },
  {
    category: "Moradia",
    patterns: [
      "aluguel", "condominio", "condomínio", "iptu", "luz", "energia", "agua",
      "água", "gas", "gás", "internet", "claro", "vivo", "tim", "oi", "net",
      "sky", "iptv",
    ],
  },
  {
    category: "Lazer",
    patterns: [
      "netflix", "spotify", "amazon prime", "disney", "globoplay", "hbo", "youtube premium",
      "playstation", "xbox", "steam", "cinema", "ingresso", "show", "teatro",
      "bar ", "balada",
    ],
  },
  {
    category: "Saúde",
    patterns: [
      "drogaria", "farmacia", "farmácia", "drogasil", "raia", "pacheco",
      "hospital", "clinica", "clínica", "consulta", "medico", "médico",
      "exame", "laboratorio", "laboratório", "plano de saude", "unimed",
      "amil", "bradesco saude", "sulamerica",
    ],
  },
  {
    category: "Educação",
    patterns: [
      "udemy", "alura", "coursera", "rocketseat", "fcamara", "faculdade",
      "universidade", "escola", "curso", "mensalidade", "livro", "kindle",
    ],
  },
  {
    category: "Compras",
    patterns: [
      "shopee", "shein", "amazon", "americanas", "magalu", "magazine luiza",
      "submarino", "casas bahia", "ponto frio", "kabum", "aliexpress",
      "mercado livre", "mercadolivre", "ml ", "renner", "c&a", "riachuelo",
      "zara", "h&m", "centauro",
    ],
  },
  {
    category: "Salário",
    patterns: ["salario", "salário", "folha", "pagamento mensal", "remuneracao"],
  },
];

interface SuggestionOpts {
  userId: number;
  description: string;
  type: "INCOME" | "EXPENSE";
}

interface Suggestion {
  categoryId: number;
  categoryName: string;
  confidence: number; // 0..1
  source: "memory" | "keyword";
}

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Sugere uma categoria para uma transação nova. Retorna null se nenhum sinal claro.
 */
export async function suggestCategory({
  userId,
  description,
  type,
}: SuggestionOpts): Promise<Suggestion | null> {
  if (!description || !description.trim()) return null;
  const text = norm(description);

  // 1) Memória: olha últimas 100 transações do mesmo tipo com categoria definida
  //    e descrição similar. "Similar" = substring de pelo menos 4 chars.
  const recent = await prisma.transaction.findMany({
    where: { userId, type, categoryId: { not: null } },
    select: { description: true, categoryId: true, category: { select: { name: true } } },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  // Quantos votos cada (categoryId, name) recebeu
  const memoryVotes = new Map<number, { name: string; count: number }>();
  for (const t of recent) {
    if (!t.description || !t.category || t.categoryId == null) continue;
    const prev = norm(t.description);
    // Heurística simples: se a descrição compartilha um termo de 4+ chars
    if (
      prev === text ||
      prev.includes(text) ||
      text.includes(prev) ||
      sharesWord(prev, text, 4)
    ) {
      const entry = memoryVotes.get(t.categoryId) ?? { name: t.category.name, count: 0 };
      entry.count++;
      memoryVotes.set(t.categoryId, entry);
    }
  }

  if (memoryVotes.size > 0) {
    let best: { id: number; name: string; count: number } | null = null;
    for (const [id, { name, count }] of memoryVotes) {
      if (!best || count > best.count) best = { id, name, count };
    }
    if (best && best.count >= 2) {
      return {
        categoryId: best.id,
        categoryName: best.name,
        confidence: Math.min(1, best.count / 5),
        source: "memory",
      };
    }
  }

  // 2) Dicionário: procura palavras-chave conhecidas
  let matchedRule: KeywordRule | null = null;
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => text.includes(norm(p)))) {
      matchedRule = rule;
      break;
    }
  }
  if (!matchedRule) return null;

  // Procura categoria correspondente (do usuário OU padrão)
  const cat = await prisma.category.findFirst({
    where: {
      name: { equals: matchedRule.category, mode: "insensitive" },
      OR: [{ userId }, { userId: null }],
    },
    select: { id: true, name: true },
  });
  if (!cat) return null;

  return {
    categoryId: cat.id,
    categoryName: cat.name,
    confidence: 0.6,
    source: "keyword",
  };
}

function sharesWord(a: string, b: string, minLen: number): boolean {
  const aWords = a.split(/\s+/).filter((w) => w.length >= minLen);
  const bWords = b.split(/\s+/).filter((w) => w.length >= minLen);
  for (const w of aWords) if (bWords.includes(w)) return true;
  return false;
}
