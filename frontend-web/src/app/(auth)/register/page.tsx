"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@/lib/validators";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleRegister() {
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      toast.error("Dados inválidos", {
        description: parsed.error.issues[0]?.message,
      });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error("Falha no cadastro", {
          description: j.error || "Tente novamente.",
        });
        return;
      }
      toast.success("Conta criada com sucesso!");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Erro de rede", {
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 login-left-bg flex-col justify-center px-16 border-r border-border-subtle">
        <div className="relative z-10 flex flex-col">
          <div className="mb-10">
            <Image
              src="/fc-logo.png"
              alt="Logo FinControl"
              width={256}
              height={64}
              priority
              sizes="(max-width: 1024px) 208px, 256px"
              className="w-52 lg:w-60"
              style={{ height: "auto" }}
              loading="eager"
            />
          </div>

          <h1 className="text-[44px] font-black text-text leading-[1.1] tracking-tight mb-5">
            Comece a controlar
            <br />
            seu dinheiro
            <br />
            <span className="text-gold-gradient">hoje.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md">
            Crie sua conta gratuitamente e tenha controle total das suas finanças
            em minutos.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 login-right-bg flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="login-glass-card p-7">
            <h2 className="text-xl font-bold text-text mb-1">Criar uma conta</h2>
            <p className="text-xs text-text-secondary mb-6">
              Preencha os dados abaixo para começar
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                Nome
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="login-input"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="login-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  placeholder="Repita sua senha"
                  className="login-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn-gold w-full text-sm py-3 cursor-pointer"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-center text-xs text-text-secondary mt-5">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
