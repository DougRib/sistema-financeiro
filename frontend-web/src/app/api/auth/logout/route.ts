export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { revokeSessionByToken } from "@/lib/sessions";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth-cookies";
import { getUserId } from "@/lib/get-user-id";
import { getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    await revokeSessionByToken(refresh);
  }
  await clearAuthCookies();
  if (userId) {
    await audit({ action: "auth.logout", userId, ipAddress: ip, userAgent });
  }

  return NextResponse.json({ ok: true });
}
