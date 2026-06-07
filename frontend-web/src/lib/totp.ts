import crypto from "crypto";
import { generateSecret, generateSync, verifySync, generateURI } from "otplib";

const ISSUER = "FinControl";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(secret: string, accountName: string): string {
  return generateURI({ secret, label: accountName, issuer: ISSUER });
}

/**
 * Verifica um token TOTP. Tolera um step de tolerância (±30s) por padrão.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleaned = token.replace(/\s/g, "");
  try {
    const result = verifySync({ token: cleaned, secret });
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Apenas para testes — gera um token a partir do secret.
 */
export function generateTotpToken(secret: string): string {
  return generateSync({ secret });
}

/**
 * Gera N backup codes (8 chars, alfanuméricos legíveis).
 * Retorna os codes em texto + os hashes (pra salvar no DB).
 */
export function generateBackupCodes(count = 10): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    codes.push(formatted);
    hashes.push(hashCode(formatted));
  }
  return { codes, hashes };
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function findMatchingBackupCode(code: string, hashes: string[]): string | null {
  const cleaned = code.replace(/\s/g, "").toUpperCase();
  const candidate = hashCode(cleaned);
  return hashes.includes(candidate) ? candidate : null;
}
