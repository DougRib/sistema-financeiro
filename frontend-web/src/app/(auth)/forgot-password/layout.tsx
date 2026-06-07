import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: "Recupere o acesso à sua conta no FinControl. Enviaremos um link para redefinir sua senha.",
  alternates: { canonical: "/forgot-password" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
