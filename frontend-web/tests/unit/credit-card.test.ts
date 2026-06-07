import { describe, it, expect } from "vitest";
import { invoicePeriodForDate } from "@/lib/credit-card";

describe("invoicePeriodForDate", () => {
  it("uses current month when tx is before closing day", () => {
    const tx = new Date(Date.UTC(2025, 5, 10)); // 10/Jun
    const p = invoicePeriodForDate(tx, 25, 10);
    expect(p.closing.getUTCMonth()).toBe(5); // Jun
    expect(p.due.getUTCMonth()).toBe(6); // Jul
  });

  it("rolls to next month when tx is after closing day", () => {
    const tx = new Date(Date.UTC(2025, 5, 27)); // 27/Jun (after 25)
    const p = invoicePeriodForDate(tx, 25, 10);
    expect(p.closing.getUTCMonth()).toBe(6); // Jul
    expect(p.due.getUTCMonth()).toBe(7); // Aug
  });

  it("clamps day to month length (Feb closing on 30)", () => {
    const tx = new Date(Date.UTC(2025, 1, 5)); // Feb 5
    const p = invoicePeriodForDate(tx, 30, 10);
    // Feb 2025 has 28 days → closing clamped to 28
    expect(p.closing.getUTCDate()).toBe(28);
  });

  it("handles year boundary correctly", () => {
    const tx = new Date(Date.UTC(2025, 11, 28)); // Dec 28 (after closing 25)
    const p = invoicePeriodForDate(tx, 25, 10);
    expect(p.closing.getUTCFullYear()).toBe(2026);
    expect(p.closing.getUTCMonth()).toBe(0); // January
  });
});
