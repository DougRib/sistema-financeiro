export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { friendlyError } from "@/lib/api-errors";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["ACCEPT", "REVOKE"]),
});

/**
 * PATCH — Accept or revoke a share.
 *  - ACCEPT: must be the invited user (sharedWithUserId)
 *  - REVOKE: must be the owner OR the invited user
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shareId = Number(id);
  if (isNaN(shareId)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Ação inválida" }, { status: 400 });
  }

  try {
    const share = await prisma.sharedAccess.findUnique({ where: { id: shareId } });
    if (!share) {
      return NextResponse.json({ ok: false, error: "Compartilhamento não encontrado" }, { status: 404 });
    }

    if (parsed.data.action === "ACCEPT") {
      if (share.sharedWithUserId !== userId) {
        return NextResponse.json({ ok: false, error: "Apenas o convidado pode aceitar." }, { status: 403 });
      }
      const updated = await prisma.sharedAccess.update({
        where: { id: shareId },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      return NextResponse.json({ ok: true, share: updated });
    }

    // REVOKE
    if (share.ownerId !== userId && share.sharedWithUserId !== userId) {
      return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
    }
    const updated = await prisma.sharedAccess.update({
      where: { id: shareId },
      data: { status: "REVOKED" },
    });
    return NextResponse.json({ ok: true, share: updated });
  } catch (err) {
    console.error("[/api/shared-access/[id] PATCH]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}

/**
 * DELETE — Permanently removes a share (owner or invited user).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shareId = Number(id);
  if (isNaN(shareId)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    const share = await prisma.sharedAccess.findUnique({ where: { id: shareId } });
    if (!share) {
      return NextResponse.json({ ok: false, error: "Compartilhamento não encontrado" }, { status: 404 });
    }
    if (share.ownerId !== userId && share.sharedWithUserId !== userId) {
      return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
    }
    await prisma.sharedAccess.delete({ where: { id: shareId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/shared-access/[id] DELETE]", err);
    return NextResponse.json({ ok: false, error: friendlyError(err) }, { status: 500 });
  }
}
