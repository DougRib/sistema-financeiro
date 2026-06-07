import type { NextConfig } from "next";
import path from "path";

/**
 * Content Security Policy.
 *
 * Notas:
 *  - 'unsafe-inline' em script-src é necessário pelo Next.js para hidratação inicial
 *    (script de bootstrap). Em produção, idealmente substituir por nonces.
 *  - 'unsafe-eval' é necessário em dev para HMR/turbopack; só liberamos quando NODE_ENV=development.
 *  - data: liberado para imagens (lucide icons, base64 inline).
 *  - https: liberado para conexões (Neon Postgres é acessado server-side, mas alguma libs podem chamar).
 */
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
};

const cspString = Object.entries(cspDirectives)
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspString },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS só faz sentido sob HTTPS. Quando rodando em prod (Vercel/Custom domain),
  // força 1 ano + subdomínios + preload. Em dev fica fora.
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Tree-shaking otimizado: importa só os símbolos usados em vez do barrel inteiro.
    // Reduz o bundle de lucide-react (~5KB por ícone usado em vez de toda a lib) e recharts.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
