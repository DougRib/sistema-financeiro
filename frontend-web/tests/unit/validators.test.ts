import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  transactionSchema,
  updatePasswordSchema,
} from "@/lib/validators";

describe("validators", () => {
  describe("loginSchema", () => {
    it("accepts valid credentials", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
    });
    it("rejects invalid email", () => {
      expect(loginSchema.safeParse({ email: "abc", password: "secret" }).success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("requires password >= 8", () => {
      const r = registerSchema.safeParse({ name: "X", email: "a@b.com", password: "short" });
      expect(r.success).toBe(false);
    });
    it("requires name >= 2", () => {
      const r = registerSchema.safeParse({ name: "X", email: "a@b.com", password: "12345678" });
      expect(r.success).toBe(false);
    });
    it("accepts valid input", () => {
      const r = registerSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "12345678",
      });
      expect(r.success).toBe(true);
    });
  });

  describe("transactionSchema", () => {
    it("requires positive amount", () => {
      const r = transactionSchema.safeParse({
        type: "EXPENSE",
        amount: -10,
        occurredAt: new Date().toISOString(),
        walletId: 1,
      });
      expect(r.success).toBe(false);
    });

    it("accepts INCOME", () => {
      const r = transactionSchema.safeParse({
        type: "INCOME",
        amount: 100,
        occurredAt: new Date().toISOString(),
        walletId: 1,
      });
      expect(r.success).toBe(true);
    });
  });

  describe("updatePasswordSchema", () => {
    it("requires newPassword >= 8", () => {
      const r = updatePasswordSchema.safeParse({ currentPassword: "x", newPassword: "abc" });
      expect(r.success).toBe(false);
    });
  });
});
