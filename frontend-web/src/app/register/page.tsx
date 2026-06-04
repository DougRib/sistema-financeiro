"use client";

import { useState } from "react";
import Link from "next/link";
import { registerSchema } from "@/lib/validators";

export default function RegisterPage() {
  // campos do formulário de registro
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // mensagem de erro exibida na tela
  const [erro, setErro] = useState<string | null>(null);
  // controla estado de carregamento do botão
  const [loading, setLoading] = useState(false);

  // lógica para registrar um novo usuário
  async function handleRegister() {
    setErro(null);

    // valida name, email e password com Zod (front)
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setErro(first?.message || "Dados inválidos");
      return;
    }

    // validação extra de confirmação de senha
    if (password !== confirmPassword) {
      setErro("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      // chama a API de registro
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // usa os dados já validados pelo Zod
        body: JSON.stringify(parsed.data),
      });

      // se a resposta não for ok, mostra erro retornado
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErro(j.error || "Falha no registro");
        return;
      }

      // pega o "from" da URL ou manda para /dashboard
      const from =
        new URLSearchParams(window.location.search).get("from") || "/dashboard";
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
            Criar uma conta
          </h1>
          <p className="text-sm text-slate-400">
            Leva só alguns segundos para começar a organizar suas finanças.
          </p>
        </div>

        {/* card de registro */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl space-y-5">
          {/* campos do formulário */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200">
                Nome
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 transition"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200">
                Confirmar senha
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 transition"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* mensagem de erro abaixo dos campos */}
          {erro && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          {/* botão de registrar */}
          <button
            disabled={loading}
            onClick={handleRegister}
            className="w-full rounded-xl bg-emerald-500 text-sm font-medium text-slate-950 py-2.5 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/30"
          >
            {loading ? "Criando conta..." : "Registrar"}
          </button>

          {/* links extras: já tem conta / voltar pra home */}
          <div className="pt-1 space-y-1.5 text-center text-[12px]">
            <p className="text-slate-400">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-emerald-300 hover:text-emerald-200 underline-offset-4 hover:underline"
              >
                Fazer login
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
