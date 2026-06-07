"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível enviar", { description: j.error });
        return;
      }
      setSent(true);
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
            Vamos<br />
            recuperar seu<br />
            <span className="text-gold-gradient">acesso.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md">
            Informe seu email e enviaremos um link seguro para redefinir sua senha.
            O link expira em 1 hora.
          </p>
        </div>
      </div>

      <div className="flex-1 login-right-bg flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="login-glass-card p-7">
            {sent ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-income/15 border border-income/30 flex items-center justify-center text-income">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-xl font-bold text-text mb-2">Verifique seu email</h2>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  Se <strong className="text-text">{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em alguns instantes.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  <ArrowLeft size={12} /> Voltar para o login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text mb-1">Esqueci a senha</h2>
                <p className="text-xs text-text-secondary mb-6">
                  Vamos enviar um link para você criar uma nova senha.
                </p>

                <form onSubmit={handleSubmit}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                    Email cadastrado
                  </label>
                  <div className="relative mb-5">
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
                      autoFocus
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold w-full text-sm py-3 cursor-pointer"
                  >
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </form>

                <p className="text-center text-xs text-text-secondary mt-5">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-accent font-semibold hover:text-accent-hover transition-colors"
                  >
                    <ArrowLeft size={11} /> Voltar para o login
                  </Link>
                </p>
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
