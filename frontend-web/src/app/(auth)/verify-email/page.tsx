"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      queueMicrotask(() => {
        setStatus("error");
        setErrorMsg("Link inválido");
      });
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setStatus("success");
        else {
          setStatus("error");
          setErrorMsg(j.error ?? "Erro ao verificar");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Erro de rede");
      });
  }, [token]);

  return (
    <div className="min-h-screen login-right-bg flex items-center justify-center px-6 py-10 relative">
      <div className="w-full max-w-sm relative z-10">
        <div className="login-glass-card p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-center text-accent animate-pulse">
                <Sparkles size={28} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Verificando...</h2>
              <p className="text-xs text-text-secondary">Aguarde um instante.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-income/15 border border-income/30 flex items-center justify-center text-income">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Email confirmado!</h2>
              <p className="text-xs text-text-secondary mb-5">
                Sua conta está ativa. Você já pode acessar o sistema.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-5 py-3 rounded-lg cursor-pointer"
              >
                Ir para o dashboard
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-expense/15 border border-expense/30 flex items-center justify-center text-expense">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Não foi possível verificar</h2>
              <p className="text-xs text-text-secondary mb-5">{errorMsg}</p>
              <Link
                href="/login"
                className="inline-block text-xs font-semibold text-accent hover:underline"
              >
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
