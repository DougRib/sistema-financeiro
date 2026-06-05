export type ImportFormat = "csv" | "ofx";

export interface ParsedRow {
  occurredAt: string; // ISO
  description: string | null;
  amount: number; // positive
  type: "INCOME" | "EXPENSE";
  rawCategory: string | null;
}

export interface ParseResult {
  rows: ParsedRow[];
  warnings: string[];
}

const DATE_PATTERNS = [
  /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
  /^(\d{2})\/(\d{2})\/(\d{4})/, // dd/mm/yyyy
  /^(\d{2})-(\d{2})-(\d{4})/, // dd-mm-yyyy
  /^(\d{8})/, // YYYYMMDD (OFX)
];

function parseDate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  const iso = s.match(DATE_PATTERNS[0]);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])).toISOString();

  const br1 = s.match(DATE_PATTERNS[1]);
  if (br1) return new Date(Date.UTC(+br1[3], +br1[2] - 1, +br1[1])).toISOString();

  const br2 = s.match(DATE_PATTERNS[2]);
  if (br2) return new Date(Date.UTC(+br2[3], +br2[2] - 1, +br2[1])).toISOString();

  const ofx = s.match(DATE_PATTERNS[3]);
  if (ofx) {
    const y = +ofx[1].slice(0, 4);
    const m = +ofx[1].slice(4, 6);
    const d = +ofx[1].slice(6, 8);
    return new Date(Date.UTC(y, m - 1, d)).toISOString();
  }

  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) return fallback.toISOString();
  return null;
}

function parseAmount(input: string): number | null {
  let s = input.trim().replace(/\s/g, "");
  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // Brazilian "1.234,56" or US "1,234.56" — last separator is decimal
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // assume comma as decimal separator (pt-BR)
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return isNaN(n) ? null : n;
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === sep) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function detectSeparator(line: string): string {
  const semis = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

export function parseCsv(content: string): ParseResult {
  const warnings: string[] = [];
  const rows: ParsedRow[] = [];

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    warnings.push("CSV vazio.");
    return { rows, warnings };
  }

  const sep = detectSeparator(lines[0]);
  const firstFields = splitCsvLine(lines[0], sep).map((f) => f.toLowerCase());

  // Detect header
  const headerLooksReal =
    firstFields.some((f) => /data|date|occurredat/.test(f)) &&
    firstFields.some((f) => /valor|amount|value/.test(f));

  let headerMap: Record<string, number> = {
    date: 0,
    description: 1,
    amount: 2,
    type: 3,
    category: 4,
  };

  let start = 0;
  if (headerLooksReal) {
    headerMap = {} as Record<string, number>;
    firstFields.forEach((f, idx) => {
      if (/data|date|occurredat/.test(f)) headerMap.date = idx;
      else if (/desc/.test(f)) headerMap.description = idx;
      else if (/valor|amount|value/.test(f)) headerMap.amount = idx;
      else if (/tipo|type/.test(f)) headerMap.type = idx;
      else if (/categ/.test(f)) headerMap.category = idx;
    });
    start = 1;
  }

  for (let i = start; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i], sep);

    const dateRaw = fields[headerMap.date ?? 0] ?? "";
    const description = (fields[headerMap.description ?? 1] ?? "").trim() || null;
    const amountRaw = fields[headerMap.amount ?? 2] ?? "";
    const typeRaw = (fields[headerMap.type ?? 3] ?? "").trim().toUpperCase();
    const categoryRaw = (fields[headerMap.category ?? 4] ?? "").trim() || null;

    const occurredAt = parseDate(dateRaw);
    const amountSigned = parseAmount(amountRaw);

    if (!occurredAt || amountSigned == null) {
      warnings.push(`Linha ${i + 1}: data ou valor inválido — ignorada.`);
      continue;
    }

    let type: "INCOME" | "EXPENSE";
    let amount: number;
    if (typeRaw === "INCOME" || typeRaw === "RECEITA" || typeRaw === "C") {
      type = "INCOME";
      amount = Math.abs(amountSigned);
    } else if (typeRaw === "EXPENSE" || typeRaw === "DESPESA" || typeRaw === "D") {
      type = "EXPENSE";
      amount = Math.abs(amountSigned);
    } else {
      type = amountSigned < 0 ? "EXPENSE" : "INCOME";
      amount = Math.abs(amountSigned);
    }

    if (amount === 0) {
      warnings.push(`Linha ${i + 1}: valor zero — ignorada.`);
      continue;
    }

    rows.push({
      occurredAt,
      description,
      amount: Math.round(amount * 100) / 100,
      type,
      rawCategory: categoryRaw,
    });
  }

  return { rows, warnings };
}

export function parseOfx(content: string): ParseResult {
  const warnings: string[] = [];
  const rows: ParsedRow[] = [];

  const txBlocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  if (txBlocks.length === 0) {
    warnings.push("Nenhum bloco STMTTRN encontrado no OFX.");
    return { rows, warnings };
  }

  const tag = (block: string, name: string): string | null => {
    const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
    return m ? m[1].trim() : null;
  };

  for (let i = 0; i < txBlocks.length; i++) {
    const block = txBlocks[i];
    const trnType = (tag(block, "TRNTYPE") ?? "").toUpperCase();
    const dtPosted = tag(block, "DTPOSTED") ?? "";
    const trnAmt = tag(block, "TRNAMT") ?? "";
    const memo = tag(block, "MEMO");
    const name = tag(block, "NAME");

    const occurredAt = parseDate(dtPosted);
    const amountSigned = parseAmount(trnAmt);

    if (!occurredAt || amountSigned == null) {
      warnings.push(`Transação ${i + 1}: data ou valor inválido — ignorada.`);
      continue;
    }

    const type: "INCOME" | "EXPENSE" =
      trnType === "CREDIT" || trnType === "DEP" || trnType === "INT"
        ? "INCOME"
        : trnType === "DEBIT" || trnType === "POS" || trnType === "ATM" || trnType === "PAYMENT"
          ? "EXPENSE"
          : amountSigned < 0
            ? "EXPENSE"
            : "INCOME";

    const amount = Math.abs(amountSigned);
    if (amount === 0) {
      warnings.push(`Transação ${i + 1}: valor zero — ignorada.`);
      continue;
    }

    rows.push({
      occurredAt,
      description: memo || name || null,
      amount: Math.round(amount * 100) / 100,
      type,
      rawCategory: null,
    });
  }

  return { rows, warnings };
}

export function parseImport(content: string, format: ImportFormat): ParseResult {
  if (format === "ofx") return parseOfx(content);
  return parseCsv(content);
}
