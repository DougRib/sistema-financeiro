export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type HealthResponse = { ok: true } | { ok: false; error: string };

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json<HealthResponse>({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro interno no servidor";
    return NextResponse.json<HealthResponse>(
      { ok: false, error: message },
      { status: 503 },
    );
  }
}
