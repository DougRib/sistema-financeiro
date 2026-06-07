export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/get-user-id";
import { suggestCategory } from "@/lib/auto-category";

const schema = z.object({
  description: z.string().min(1).max(255),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }

  const suggestion = await suggestCategory({
    userId,
    description: parsed.data.description,
    type: parsed.data.type,
  });

  return NextResponse.json({ ok: true, suggestion });
}
