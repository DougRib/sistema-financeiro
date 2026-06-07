/**
 * Translate raw backend errors into user-friendly Portuguese messages.
 * Removes Prisma stack noise / Turbopack chunk names / etc.
 */
export function friendlyError(raw: unknown): string {
  if (typeof raw !== "string") {
    if (raw instanceof Error) return friendlyError(raw.message);
    return "Erro interno no servidor";
  }

  const s = raw.trim();
  if (!s) return "Erro interno no servidor";

  const lower = s.toLowerCase();

  // Prisma / database connection errors
  if (
    lower.includes("can't reach database") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused") ||
    lower.includes("p1001")
  ) {
    return "Não foi possível conectar ao banco de dados. Tente novamente em instantes.";
  }
  if (lower.includes("p1002") || lower.includes("timeout")) {
    return "O banco de dados demorou para responder. Tente novamente.";
  }
  if (lower.includes("p2002") || lower.includes("unique constraint")) {
    return "Já existe um registro com esses dados.";
  }
  if (lower.includes("p2025") || lower.includes("record to update not found")) {
    return "Registro não encontrado.";
  }
  if (lower.includes("p2003") || lower.includes("foreign key")) {
    return "Não é possível concluir: existem registros vinculados.";
  }
  if (
    lower.includes("invalid `prisma") ||
    lower.includes("turbopack") ||
    lower.includes("__ecmascript")
  ) {
    return "Erro ao acessar o banco de dados.";
  }

  // Network / fetch errors
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Erro de rede. Verifique sua conexão.";
  }

  // Trim very long messages
  if (s.length > 200) return s.slice(0, 200).trim() + "…";

  return s;
}
