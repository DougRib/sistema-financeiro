export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().datetime().nullable().optional(),
});

type Params = { id: string };

export async function PUT(req: NextRequest, context: { params: Promise<Params> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const goalId = Number(id);
  if (isNaN(goalId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return NextResponse.json({ ok: false, error: "Meta não encontrada" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const { deadline, ...rest } = parsed.data;
  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...rest,
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    goal: {
      id: updated.id,
      name: updated.name,
      emoji: updated.emoji,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
      deadline: updated.deadline?.toISOString() ?? null,
      pct: Math.round((Number(updated.currentAmount) / Number(updated.targetAmount)) * 100),
    },
  });
}

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const goalId = Number(id);
  if (isNaN(goalId)) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return NextResponse.json({ ok: false, error: "Meta não encontrada" }, { status: 404 });

  await prisma.goal.delete({ where: { id: goalId } });
  return NextResponse.json({ ok: true });
}
