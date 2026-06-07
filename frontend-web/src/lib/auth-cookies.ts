import crypto from "crypto";
import { cookies } from "next/headers";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "@/lib/sessions";

const isProd = process.env.NODE_ENV === "production";

const ACCESS_COOKIE = "token";
const REFRESH_COOKIE = "refresh";
const CSRF_COOKIE = "csrf";

export { ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE };

/**
 * Issues all three cookies used by the auth stack:
 *  - `token`     (httpOnly, 1h)  - access JWT
 *  - `refresh`   (httpOnly, 7d)  - refresh token (opaque)
 *  - `csrf`      (readable, 7d)  - CSRF token (double-submit pattern)
 */
export async function setAuthCookies(opts: {
  accessToken: string;
  refreshToken: string;
}): Promise<{ csrfToken: string }> {
  const store = await cookies();
  const csrfToken = crypto.randomBytes(32).toString("base64url");

  store.set(ACCESS_COOKIE, opts.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  store.set(REFRESH_COOKIE, opts.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TTL_SECONDS,
  });
  // Não httpOnly — o client precisa ler pra enviar no header X-CSRF-Token.
  store.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TTL_SECONDS,
  });

  return { csrfToken };
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE]) {
    store.set(name, "", {
      httpOnly: name !== CSRF_COOKIE,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 0,
    });
  }
}
