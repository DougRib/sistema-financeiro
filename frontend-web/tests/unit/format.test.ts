import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatMonthYear, currentMonth } from "@/lib/format";

describe("format helpers", () => {
  describe("formatCurrency", () => {
    it("formats numbers in pt-BR", () => {
      const out = formatCurrency(1234.5);
      expect(out).toContain("1.234,50");
      expect(out).toContain("R$");
    });

    it("accepts string input", () => {
      expect(formatCurrency("100")).toContain("100,00");
    });

    it("handles negative", () => {
      expect(formatCurrency(-50)).toMatch(/-?\s?R\$\s?50,00/);
    });
  });

  describe("formatDate", () => {
    it("returns dd/mm/yyyy from ISO with time (UTC noon avoids TZ shift)", () => {
      expect(formatDate("2025-06-15T12:00:00.000Z")).toBe("15/06/2025");
    });
  });

  describe("formatMonthYear", () => {
    it("returns 'mês de yyyy'", () => {
      const out = formatMonthYear(6, 2025).toLowerCase();
      expect(out).toContain("junho");
      expect(out).toContain("2025");
    });
  });

  describe("currentMonth", () => {
    it("returns 1-based month and 4-digit year", () => {
      const { month, year } = currentMonth();
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(year).toBeGreaterThanOrEqual(2025);
    });
  });
});
