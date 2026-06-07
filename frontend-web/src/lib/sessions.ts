import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Sessões (refresh tokens) — modelo:
 *  - Access token (JWT) é curto (1h) e fica no cookie `token`.
 *  - Refresh token é uma string aleatória opaca, ficam no cookie `refresh`.
 *  - Persistimos só o SHA-256 do refresh token (`tokenHash`).
 *  - Revogação: marcamos `revokedAt` ou deletamos a Session.
 *  - Rotação: a cada uso, geramos um novo refresh token e revogamos o antigo.
 */

const REFRESH_TTL_DAYS = 7;
const ACCESS_TTL_SECONDS = 60 * 60; // 1h
const REFRESH_TTL_SECONDS = REFRESH_TTL_DAYS * 24 * 60 * 60;

export { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS };

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  // 64 bytes -> 86 chars base64url
  return crypto.randomBytes(64).toString("base64url");
}

interface CreateSessionInput {
  userId: number;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createSession({
  userId,
  userAgent,
  ipAddress,
}: CreateSessionInput): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Validates a refresh token. Returns the active session row if valid, null otherwise.
 */
export async function findValidSession(token: string): Promise<{
  id: number;
  userId: number;
} | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const now = new Date();
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true, userId: true },
  });
  return session;
}

/**
 * Rotates the refresh token: revokes the current session and creates a new one.
 */
export async function rotateSession(
  oldSessionId: number,
  userId: number,
  userAgent: string | null,
  ipAddress: string | null,
): Promise<{ token: string; expiresAt: Date }> {
  await prisma.session.update({
    where: { id: oldSessionId },
    data: { revokedAt: new Date() },
  });
  return createSession({ userId, userAgent, ipAddress });
}

export async function revokeSessionByToken(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.session
    .updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

export async function revokeAllSessionsForUser(userId: number): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
