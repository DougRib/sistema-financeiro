export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().default("🎯"),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  deadline: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    goals: goals.map(g => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline?.toISOString() ?? null,
      pct: Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100),
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });

  const { name, emoji, targetAmount, currentAmount, deadline } = parsed.data;

  const goal = await prisma.goal.create({
    data: {
      userId,
      name,
      emoji,
      targetAmount,
      currentAmount,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    goal: {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      deadline: goal.deadline?.toISOString() ?? null,
      pct: Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100),
    },
  });
}
