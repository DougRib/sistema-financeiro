"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LayoutDashboard,
  Target,
  Wallet,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { loginSchema } from "@/lib/validators";
import { useToast } from "@/components/ui/Toast";

const FEATURES = [
  { icon: LayoutDashboard, label: "Dashboard com visão mensal completa" },
  { icon: Target, label: "Orçamentos por categoria com alertas" },
  { icon: Wallet, label: "Múltiplas carteiras sincronizadas" },
  { icon: BarChart3, label: "Relatórios e Insights com IA" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);
  const [totp, setTotp] = useState("");
  const toast = useToast();

  function redirectAfterLogin() {
    const raw = new URLSearchParams(window.location.search).get("from");
    const from =
      raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    window.location.href = from;
  }

  async function attemptLogin(payload: { email: string; password: string; totp?: string }) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  }

  async function handleLogin() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error("Dados inválidos", {
        description: parsed.error.issues[0]?.message,
      });
      return;
    }
    setLoading(true);
    try {
      const { ok, j } = await attemptLogin(parsed.data);
      if (!ok) {
        toast.error("Falha no login", {
          description: j.error || "Verifique suas credenciais.",
        });
        return;
      }
      if (j.require2fa) {
        setNeed2fa(true);
        return;
      }
      toast.success("Bem-vindo de volta!");
      redirectAfterLogin();
    } catch {
      toast.error("Erro de rede", {
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handle2faSubmit() {
    if (!totp.trim()) {
      toast.error("Informe o código");
      return;
    }
    setLoading(true);
    try {
      const { ok, j } = await attemptLogin({ email, password, totp: totp.trim() });
      if (!ok) {
        toast.error("Código inválido", { description: j.error });
        return;
      }
      toast.success("Bem-vindo de volta!");
      redirectAfterLogin();
    } catch {
      toast.error("Erro de rede");
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
            Controle total
            <br />
            das suas
            <br />
            <span className="text-gold-gradient">finanças.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-10 max-w-md">
            Gerencie receitas, despesas, orçamentos e carteiras em um único lugar.
          </p>

          <ul className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-text-secondary"
              >
                <span className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-accent" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 login-right-bg flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="login-glass-card p-7">
            {need2fa ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={18} className="text-accent" />
                  <h2 className="text-xl font-bold text-text">Autenticação em 2 fatores</h2>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  Digite o código de 6 dígitos do seu app autenticador, ou use um código de backup.
                </p>

                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                  Código
                </label>
                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handle2faSubmit()}
                  placeholder="000000"
                  autoFocus
                  className="w-full bg-card-hover border border-border rounded-lg px-4 py-3 text-2xl font-mono text-text text-center tracking-[4px] outline-none focus:border-accent transition-colors mb-5"
                />

                <button
                  onClick={handle2faSubmit}
                  disabled={loading}
                  className="btn-gold w-full text-sm py-3 cursor-pointer"
                >
                  {loading ? "Verificando..." : "Verificar e entrar"}
                </button>

                <button
                  onClick={() => {
                    setNeed2fa(false);
                    setTotp("");
                  }}
                  className="block w-full text-center text-xs text-muted hover:text-text transition-colors mt-4 cursor-pointer"
                >
                  Voltar
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text mb-1">
                  Bem-vindo de volta
                </h2>
                <p className="text-xs text-text-secondary mb-6">
                  Entre na sua conta para continuar
                </p>

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
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="seu@email.com"
                      className="login-input"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="mb-5">
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
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="••••••••"
                      className="login-input pr-10"
                      autoComplete="current-password"
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

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn-gold w-full text-sm py-3 cursor-pointer"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </>
            )}

            {!need2fa && (
              <>
                <p className="text-center text-xs text-text-secondary mt-5">
                  Não tem conta?{" "}
                  <Link
                    href="/register"
                    className="text-accent font-semibold hover:text-accent-hover transition-colors"
                  >
                    Criar conta grátis
                  </Link>
                </p>
                <p className="text-center text-xs text-text-secondary mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-muted hover:text-accent transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
