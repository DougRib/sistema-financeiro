import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta grátis",
  description:
    "Crie sua conta grátis no FinControl e tenha controle total das suas finanças em minutos. Dashboard, orçamentos, metas e relatórios.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Criar conta grátis | FinControl",
    description:
      "Crie sua conta grátis e tenha controle total das suas finanças em minutos.",
    url: "/register",
    type: "website",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
