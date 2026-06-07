export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { friendlyError } from "@/lib/api-errors";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  permission: z.enum(["READ", "WRITE"]).default("READ"),
});

/**
 * GET — Lists shared access for the current user:
 *   - sharedOut: people I invited
 *   - sharedIn:  people who invited me
 */
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const [sharedOut, sharedIn] = await Promise.all([
      prisma.sharedAccess.findMany({
        where: { ownerId: userId },
        include: {
          sharedWithUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sharedAccess.findMany({
        where: { sharedWithUserId: userId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      sharedOut: sharedOut.map((s) => ({
        id: s.id,
        user: s.sharedWithUser,
        permission: s.permission,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        acceptedAt: s.acceptedAt?.toISOString() ?? null,
      })),
      sharedIn: sharedIn.map((s) => ({
        id: s.id,
        user: s.owner,
        permission: s.permission,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        acceptedAt: s.acceptedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("[/api/shared-access GET]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}

/**
 * POST — Invites a user by email to share access.
 * Body: { email, permission }
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const { email, permission } = parsed.data;

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Nenhum usuário encontrado com esse email." },
        { status: 404 },
      );
    }
    if (target.id === userId) {
      return NextResponse.json(
        { ok: false, error: "Você não pode compartilhar com você mesmo." },
        { status: 400 },
      );
    }

    const existing = await prisma.sharedAccess.findUnique({
      where: {
        ownerId_sharedWithUserId: { ownerId: userId, sharedWithUserId: target.id },
      },
    });

    if (existing) {
      // Reativa se foi revogado, ou apenas atualiza permissão
      const updated = await prisma.sharedAccess.update({
        where: { id: existing.id },
        data: {
          permission,
          status: existing.status === "REVOKED" ? "PENDING" : existing.status,
          acceptedAt: existing.status === "REVOKED" ? null : existing.acceptedAt,
        },
      });
      return NextResponse.json({ ok: true, share: updated });
    }

    const created = await prisma.sharedAccess.create({
      data: {
        ownerId: userId,
        sharedWithUserId: target.id,
        permission,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, share: created });
  } catch (err) {
    console.error("[/api/shared-access POST]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
