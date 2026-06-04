"use client";

import { useState } from "react";
import Link from "next/link";
import { registerSchema } from "@/lib/validators";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Dados inválidos"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Falha no cadastro");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: "Nome", type: "text", value: name, onChange: setName, placeholder: "Seu nome completo" },
    { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "seu@email.com" },
    { label: "Senha", type: "password", value: password, onChange: setPassword, placeholder: "Mínimo 8 caracteres" },
    { label: "Confirmar senha", type: "password", value: confirm, onChange: setConfirm, placeholder: "Repita sua senha" },
  ] as const;

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex w-1/2 bg-[#0d0d14] flex-col justify-center px-16 border-r border-border">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-lg">F</div>
          <div>
            <p className="text-base font-black text-text">Finança</p>
            <p className="text-[9px] uppercase tracking-[2px] text-muted">Sistema de Controle</p>
          </div>
        </div>
        <h1 className="text-4xl font-black text-text leading-tight tracking-tight mb-4">
          Comece a controlar<br />seu dinheiro<br /><span className="text-accent">hoje.</span>
        </h1>
        <p className="text-sm text-subtle leading-relaxed">
          Crie sua conta gratuitamente e tenha controle total das suas finanças em minutos.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-text mb-1">Criar uma conta</h2>
            <p className="text-sm text-muted mb-7">Preencha os dados abaixo para começar</p>

            {fields.map(({ label, type, value, onChange, placeholder }) => (
              <div key={label} className="mb-4">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-[#18181b] border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}

            {error && (
              <p className="text-xs text-danger bg-[#f43f5e10] border border-[#f43f5e30] rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-center text-xs text-muted mt-5">
              Já tem conta?{" "}
              <Link href="/login" className="text-accent hover:underline">Fazer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
