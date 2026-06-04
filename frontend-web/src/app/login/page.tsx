"use client";

import { useState } from "react";
import Link from "next/link";
import { loginSchema } from "@/lib/validators";

export default function LoginPage() {
  // campos controlados do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // mensagem de erro exibida na tela
  const [erro, setErro] = useState<string | null>(null);
  // controla estado de carregamento do botão
  const [loading, setLoading] = useState(false);

  // lógica de login
  async function handleLogin() {
    setErro(null);

    // valida email e senha com Zod (front)
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      // pega a primeira mensagem de erro do schema
      setErro(first?.message || "Dados inválidos");
      return;
    }

    setLoading(true);

    try {
      // chama a rota de login da API
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // envia os dados já validados
        body: JSON.stringify(parsed.data),
      });

      // se a resposta não for ok, mostra erro retornado
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErro(j.error || "Falha no login");
        return;
      }

      // valida que "from" é um caminho relativo seguro (evita open redirect)
      const raw = new URLSearchParams(window.location.search).get("from");
      const from =
        raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
      window.location.href = from;
    } catch {
      // erro de rede 
      setErro("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* cabeçalho com “logo” / título do sistema */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sistema de Controle Financeiro
          </div>
          <h1 className="text-3xl font-semibold text-white mt-3">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-slate-400">
            Acesse seu painel para acompanhar seus gastos e saldo do mês.
          </p>
        </div>

        {/* card de login */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl space-y-5">
          {/* campos de email e senha */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 transition"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200">
                Senha
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 transition"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* mensagem de erro abaixo dos campos */}
          {erro && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          {/* botão de login */}
          <button
            disabled={loading}
            onClick={handleLogin}
            className="w-full rounded-xl bg-emerald-500 text-sm font-medium text-slate-950 py-2.5 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/30"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {/* links extras: criar conta, voltar pra home */}
          <div className="pt-1 space-y-1.5 text-center text-[12px]">
            <p className="text-slate-400">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="text-emerald-300 hover:text-emerald-200 underline-offset-4 hover:underline"
              >
                Criar conta
              </Link>
            </p>
            <p>
              <Link
                href="/"
                className="text-slate-500 hover:text-slate-300 underline-offset-4 hover:underline"
              >
                ⟵ Voltar para a página inicial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
