import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua conta no FinControl para gerenciar suas finanças, orçamentos e metas em um único lugar.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Entrar | FinControl",
    description: "Acesse sua conta no FinControl.",
    url: "/login",
    type: "website",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
