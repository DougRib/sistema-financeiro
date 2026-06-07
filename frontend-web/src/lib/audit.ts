import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

interface AuditInput {
  /** ex: "auth.login", "auth.logout", "user.password_change", "share.invite", "wallet.delete" */
  action: string;
  /** Quando null, é um evento sem dono (ex: tentativa de login com email inexistente). */
  userId?: number | null;
  resourceType?: string | null;
  resourceId?: string | number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Registra uma entrada no AuditLog. Best-effort: falhas não interrompem a requisição.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId != null ? String(input.resourceId) : null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });
  } catch (err) {
    // Log mas não propaga — auditoria nunca deve quebrar a requisição.
    console.error("[audit]", input.action, err);
  }
}
