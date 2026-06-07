import { describe, it, expect } from "vitest";
import { parseCsv, parseOfx } from "@/lib/import-parsers";

describe("parseCsv", () => {
  it("parses headerless CSV with comma separator", () => {
    const csv = "2025-01-05,Salário,5000,INCOME\n2025-01-06,Mercado,-350.50,EXPENSE";
    const r = parseCsv(csv);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].type).toBe("INCOME");
    expect(r.rows[0].amount).toBe(5000);
    expect(r.rows[1].type).toBe("EXPENSE");
    expect(r.rows[1].amount).toBe(350.5);
  });

  it("detects header row", () => {
    const csv = "data,descricao,valor,tipo\n2025-01-05,Salário,5000,INCOME";
    const r = parseCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].description).toBe("Salário");
  });

  it("detects semicolon separator", () => {
    const csv = "2025-01-05;Salário;5000;INCOME";
    const r = parseCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].amount).toBe(5000);
  });

  it("infers type from negative amount when no type column", () => {
    const csv = "2025-01-05,Mercado,-100.5";
    const r = parseCsv(csv);
    expect(r.rows[0].type).toBe("EXPENSE");
    expect(r.rows[0].amount).toBe(100.5);
  });

  it("supports pt-BR amount format (1.234,56)", () => {
    const csv = "2025-01-05,Teste,\"1.234,56\",EXPENSE";
    const r = parseCsv(csv);
    expect(r.rows[0].amount).toBe(1234.56);
  });

  it("warns on invalid rows", () => {
    const csv = "abc,xyz,not-a-number,FOO";
    const r = parseCsv(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe("parseOfx", () => {
  it("parses STMTTRN blocks", () => {
    const ofx = `<OFX>
      <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20250105<TRNAMT>-150.00<MEMO>Mercado</STMTTRN>
      <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20250110<TRNAMT>5000.00<MEMO>Salário</STMTTRN>
    </OFX>`;
    const r = parseOfx(ofx);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].type).toBe("EXPENSE");
    expect(r.rows[0].amount).toBe(150);
    expect(r.rows[1].type).toBe("INCOME");
    expect(r.rows[1].amount).toBe(5000);
  });

  it("warns on empty OFX", () => {
    const r = parseOfx("<OFX></OFX>");
    expect(r.rows).toHaveLength(0);
    expect(r.warnings[0]).toContain("STMTTRN");
  });
});
