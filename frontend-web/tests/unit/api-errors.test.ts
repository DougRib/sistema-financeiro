import { describe, it, expect } from "vitest";
import { friendlyError } from "@/lib/api-errors";

describe("friendlyError", () => {
  it("returns generic message for empty input", () => {
    expect(friendlyError("")).toBe("Erro interno no servidor");
    expect(friendlyError(null)).toBe("Erro interno no servidor");
    expect(friendlyError(undefined)).toBe("Erro interno no servidor");
  });

  it("translates P2002 unique constraint", () => {
    expect(friendlyError("Unique constraint failed on field email (P2002)")).toContain(
      "Já existe",
    );
  });

  it("translates P1001 connection refused", () => {
    expect(friendlyError("ECONNREFUSED 127.0.0.1:5432")).toContain("banco de dados");
  });

  it("strips Prisma/Turbopack noise", () => {
    const raw =
      "Invalid `__TURBOPACK__imported__module__$5b$project$5d.prisma.user.findUnique invocation";
    expect(friendlyError(raw)).toBe("Erro ao acessar o banco de dados.");
  });

  it("truncates very long messages", () => {
    const long = "x".repeat(500);
    expect(friendlyError(long).length).toBeLessThanOrEqual(202);
  });

  it("accepts Error instances and returns the message", () => {
    const r = friendlyError(new Error("Some custom error"));
    expect(r).toBeTypeOf("string");
    expect(r.length).toBeGreaterThan(0);
  });

  it("translates 'failed to fetch' to rede error", () => {
    expect(friendlyError("Failed to fetch")).toContain("rede");
  });
});
