import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fincontrol.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: [
          "/api/",
          "/dashboard",
          "/transacoes",
          "/transferencias",
          "/carteiras",
          "/importar",
          "/categorias",
          "/orcamentos",
          "/metas",
          "/agenda",
          "/relatorios",
          "/insights",
          "/configuracoes",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
