"use client";

import { useState } from "react";
import Link from "next/link";
import { loginSchema } from "@/lib/validators";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Dados inválidos");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Falha no login");
        return;
      }
      const raw = new URLSearchParams(window.location.search).get("from");
      const from = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
      window.location.href = from;
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0d0d14] flex-col justify-center px-16 border-r border-border">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-lg">F</div>
          <div>
            <p className="text-base font-black text-text">Finança</p>
            <p className="text-[9px] uppercase tracking-[2px] text-muted">Sistema de Controle</p>
          </div>
        </div>
        <h1 className="text-4xl font-black text-text leading-tight tracking-tight mb-4">
          Controle total<br />das suas<br /><span className="text-accent">finanças.</span>
        </h1>
        <p className="text-sm text-subtle leading-relaxed mb-10">
          Gerencie receitas, despesas, orçamentos e carteiras em um único lugar.
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "Dashboard com visão mensal completa",
            "Orçamentos por categoria com alertas",
            "Múltiplas carteiras sincronizadas",
            "Relatórios e Insights com IA",
          ].map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-text mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-muted mb-7">Entre na sua conta para continuar</p>

            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="seu@email.com"
              className="w-full bg-[#18181b] border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors mb-4"
            />

            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-[#18181b] border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors mb-4"
            />

            {error && (
              <p className="text-xs text-danger bg-[#f43f5e10] border border-[#f43f5e30] rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-xs text-muted mt-5">
              Não tem conta?{" "}
              <Link href="/register" className="text-accent hover:underline">Criar conta grátis</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
