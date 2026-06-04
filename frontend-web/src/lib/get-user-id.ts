import type { NextRequest } from "next/server";
import { verifyJwt } from "./auth";

export function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const payload = verifyJwt<{ sub: number }>(token);
  return payload?.sub ?? null;
}
