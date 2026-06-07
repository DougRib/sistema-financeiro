"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Link inválido — solicite um novo");
      return;
    }
    if (password.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível redefinir", { description: j.error });
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast.error("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
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
            />
          </div>
          <h1 className="text-[44px] font-black text-text leading-[1.1] tracking-tight mb-5">
            Crie uma<br />
            nova<br />
            <span className="text-gold-gradient">senha.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md">
            Escolha uma senha forte com pelo menos 8 caracteres. Recomendamos usar
            letras, números e símbolos.
          </p>
        </div>
      </div>

      <div className="flex-1 login-right-bg flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="login-glass-card p-7">
            {done ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-income/15 border border-income/30 flex items-center justify-center text-income">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-xl font-bold text-text mb-2">Senha redefinida!</h2>
                <p className="text-xs text-text-secondary mb-2">
                  Você será redirecionado para o login em alguns instantes.
                </p>
              </div>
            ) : !token ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-expense/15 border border-expense/30 flex items-center justify-center text-expense">
                  <AlertCircle size={28} />
                </div>
                <h2 className="text-xl font-bold text-text mb-2">Link inválido</h2>
                <p className="text-xs text-text-secondary mb-5">
                  Este link de recuperação está inválido ou já foi usado.
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-block bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Solicitar novo link
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text mb-1">Nova senha</h2>
                <p className="text-xs text-text-secondary mb-6">
                  Crie uma nova senha para sua conta.
                </p>

                <form onSubmit={handleSubmit}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                    Nova senha
                  </label>
                  <div className="relative mb-4">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="login-input pr-10"
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                    Confirmar nova senha
                  </label>
                  <div className="relative mb-5">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="login-input"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold w-full text-sm py-3 cursor-pointer"
                  >
                    {loading ? "Salvando..." : "Redefinir senha"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <Sparkles
          size={28}
          className="absolute bottom-8 right-8 text-accent/40 pointer-events-none"
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
