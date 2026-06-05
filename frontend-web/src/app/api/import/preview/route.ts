export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { parseImport, type ImportFormat } from "@/lib/import-parsers";

const MAX_CONTENT_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 2000;

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string") {
    return NextResponse.json({ ok: false, error: "Conteúdo ausente" }, { status: 400 });
  }

  if (body.content.length > MAX_CONTENT_BYTES) {
    return NextResponse.json({ ok: false, error: "Arquivo muito grande (máx 2 MB)" }, { status: 413 });
  }

  const format: ImportFormat = body.format === "ofx" ? "ofx" : "csv";
  const { rows, warnings } = parseImport(body.content, format);

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { ok: false, error: `Máximo de ${MAX_ROWS} transações por importação` },
      { status: 413 },
    );
  }

  const totalIncome = rows
    .filter((r) => r.type === "INCOME")
    .reduce((s, r) => s + r.amount, 0);
  const totalExpense = rows
    .filter((r) => r.type === "EXPENSE")
    .reduce((s, r) => s + r.amount, 0);

  return NextResponse.json({
    ok: true,
    rows,
    warnings,
    summary: {
      count: rows.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
    },
  });
}
