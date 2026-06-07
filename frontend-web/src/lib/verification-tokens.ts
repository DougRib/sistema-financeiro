import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type TokenType = "EMAIL_VERIFY" | "PASSWORD_RESET";

const TTL_BY_TYPE: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

function hash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(
  userId: number,
  type: TokenType,
): Promise<string> {
  // Invalida tokens anteriores do mesmo tipo (single token live).
  await prisma.verificationToken.deleteMany({
    where: { userId, type, usedAt: null },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_BY_TYPE[type]);

  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hash(token),
      expiresAt,
    },
  });

  return token;
}

export async function consumeVerificationToken(
  token: string,
  type: TokenType,
): Promise<{ userId: number } | null> {
  if (!token) return null;
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash: hash(token) },
  });
  if (!row) return null;
  if (row.type !== type) return null;
  if (row.usedAt) return null;
  if (row.expiresAt < new Date()) return null;

  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return { userId: row.userId };
}
