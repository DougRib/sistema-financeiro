"use client";

import { useEffect } from "react";

/**
 * Substitui `window.fetch` por uma versão que:
 *  - injeta X-CSRF-Token (lendo do cookie `csrf`) em writes
 *  - intercepta 401 → tenta /api/auth/refresh → retry
 *
 * Mount once no RootLayout. Sem refator de cada `fetch` no app.
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

let installed = false;
let refreshing: Promise<boolean> | null = null;

async function attemptRefresh(origFetch: typeof fetch): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await origFetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
        // Adiciona CSRF se já houver — caso clássico de refresh
        // antes de qualquer login ele simplesmente não envia.
        headers: (() => {
          const h = new Headers();
          const csrf = readCookie("csrf");
          if (csrf) h.set("X-CSRF-Token", csrf);
          return h;
        })(),
      });
      return r.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshing = null;
      }, 100);
    }
  })();
  return refreshing;
}

export function ApiClientSetup() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const origFetch = window.fetch.bind(window);

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init: RequestInit = {},
    ): Promise<Response> {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Pula recursos externos (https://outro-dominio/...)
      const isInternal = url.startsWith("/") || url.startsWith(window.location.origin);
      if (!isInternal) return origFetch(input, init);

      const method = (init.method ?? "GET").toUpperCase();
      const headers = new Headers(init.headers ?? {});

      if (MUTATING_METHODS.has(method)) {
        const csrf = readCookie("csrf");
        if (csrf) headers.set("X-CSRF-Token", csrf);
      }

      const finalInit: RequestInit = { ...init, headers, credentials: "same-origin" };

      let res = await origFetch(input, finalInit);

      // Refresh em 401 fora das rotas de auth
      const isAuthRoute = url.includes("/api/auth/");
      if (res.status === 401 && !isAuthRoute) {
        const ok = await attemptRefresh(origFetch);
        if (ok) {
          if (MUTATING_METHODS.has(method)) {
            const csrf = readCookie("csrf");
            if (csrf) headers.set("X-CSRF-Token", csrf);
          }
          res = await origFetch(input, { ...init, headers, credentials: "same-origin" });
          if (res.status === 401) {
            window.location.href = "/login";
          }
        } else {
          window.location.href = "/login";
        }
      }

      return res;
    };

    return () => {
      // Não desinstala — só monta uma vez por sessão. (Strict Mode em dev pode chamar 2x.)
    };
  }, []);

  return null;
}
