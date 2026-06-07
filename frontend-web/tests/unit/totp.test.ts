import { describe, it, expect } from "vitest";
import {
  generateTotpSecret,
  generateTotpToken,
  getTotpUri,
  verifyTotpToken,
  generateBackupCodes,
  findMatchingBackupCode,
  hashCode,
} from "@/lib/totp";

describe("TOTP", () => {
  it("generates a secret with reasonable length", () => {
    const s = generateTotpSecret();
    expect(s.length).toBeGreaterThan(10);
  });

  it("builds an otpauth:// URI", () => {
    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, "user@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("FinControl");
    expect(uri).toContain("user%40example.com");
  });

  it("verifies a token generated from the same secret", () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(verifyTotpToken(token, secret)).toBe(true);
  });

  it("rejects an invalid token", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpToken("000000", secret)).toBe(false);
  });

  it("tolerates spaces in user input", () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    const withSpace = `${token.slice(0, 3)} ${token.slice(3)}`;
    expect(verifyTotpToken(withSpace, secret)).toBe(true);
  });
});

describe("backup codes", () => {
  it("generates the requested number of codes", () => {
    const { codes, hashes } = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    expect(hashes).toHaveLength(10);
  });

  it("codes follow XXXX-XXXX pattern", () => {
    const { codes } = generateBackupCodes(3);
    for (const c of codes) {
      expect(c).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    }
  });

  it("findMatchingBackupCode matches a valid code", () => {
    const { codes, hashes } = generateBackupCodes(5);
    const matched = findMatchingBackupCode(codes[2], hashes);
    expect(matched).toBe(hashCode(codes[2]));
  });

  it("findMatchingBackupCode returns null for invalid code", () => {
    const { hashes } = generateBackupCodes(5);
    expect(findMatchingBackupCode("AAAA-BBBB", hashes)).toBeNull();
  });
});
