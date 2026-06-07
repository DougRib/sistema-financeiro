/**
 * Wrapper de fetch que:
 *  1) injeta o header X-CSRF-Token (lendo do cookie `csrf`) em requisições mutantes.
 *  2) intercepta 401 → tenta /api/auth/refresh uma vez → retry da request original.
 *  3) se o refresh também falhar, redireciona pra /login.
 *
 * Use `apiFetch` em vez de `fetch` em qualquer chamada autenticada do client.
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// Marcador para evitar refresh loop infinito.
let refreshing: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
      return r.ok;
    } catch {
      return false;
    } finally {
      // Limpa o latch após pequeno delay pra coalescer requests simultâneos
      setTimeout(() => {
        refreshing = null;
      }, 100);
    }
  })();
  return refreshing;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers ?? {});

  if (MUTATING_METHODS.has(method)) {
    const csrf = readCookie("csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  const finalInit: RequestInit = { ...init, headers, credentials: "same-origin" };

  let res = await fetch(input, finalInit);

  // Tenta refresh uma única vez em 401 de rotas /api/ que não sejam de auth.
  const url = typeof input === "string" ? input : input.toString();
  const isAuthRoute = url.includes("/api/auth/");
  if (res.status === 401 && !isAuthRoute) {
    const ok = await attemptRefresh();
    if (ok) {
      // Re-lê o CSRF (pode ter sido rotacionado pelo refresh)
      if (MUTATING_METHODS.has(method)) {
        const csrf = readCookie("csrf");
        if (csrf) headers.set("X-CSRF-Token", csrf);
      }
      res = await fetch(input, { ...init, headers, credentials: "same-origin" });
      if (res.status === 401) {
        // Refresh "deu certo" mas a chamada ainda falhou — sessão de fato expirada.
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res;
}
