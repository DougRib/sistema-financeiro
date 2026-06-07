"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, KeyRound, Copy, CheckCircle2, Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "loading" | "scan" | "verify" | "backup";

interface SetupData {
  secret: string;
  qr: string;
}

export function TwoFactorSetup({ open, onClose, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>("loading");
  const [data, setData] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setStep("loading");
      setCode("");
      setBackupCodes([]);
      setCopied(false);
    });
    fetch("/api/auth/2fa/setup")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setData({ secret: j.secret, qr: j.qr });
          setStep("scan");
        } else {
          toast.error("Erro", { description: j.error });
          onClose();
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Erro de rede");
          onClose();
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleVerify() {
    if (!code.trim()) {
      toast.error("Informe o código");
      return;
    }
    setVerifying(true);
    try {
      const r = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code.trim() }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Código inválido", { description: j.error });
        return;
      }
      setBackupCodes(j.backupCodes);
      setStep("backup");
      onSuccess?.();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setVerifying(false);
    }
  }

  function copyBackupCodes() {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Códigos copiados");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadBackupCodes() {
    const text = [
      "FinControl — Códigos de backup do 2FA",
      "Guarde esses códigos em local seguro. Cada um funciona apenas uma vez.",
      "",
      ...backupCodes,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fincontrol-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const title =
    step === "backup" ? "Salve seus códigos de backup" : "Ativar autenticação em 2 fatores";
  const description =
    step === "scan"
      ? "Escaneie o QR Code com seu app autenticador"
      : step === "verify"
        ? "Digite o código de 6 dígitos do app para confirmar"
        : step === "backup"
          ? "Use esses códigos se perder acesso ao app autenticador"
          : "Configurando...";

  return (
    <Modal
      open={open}
      onClose={step === "backup" ? () => { onClose(); } : onClose}
      title={title}
      description={description}
      icon={step === "backup" ? <KeyRound size={18} /> : <ShieldCheck size={18} />}
      size="md"
      showClose={step !== "loading"}
      footer={
        step === "scan" ? (
          <button
            onClick={() => setStep("verify")}
            className="w-full bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-sm font-bold py-3 rounded-xl cursor-pointer"
          >
            Já escaneei — continuar
          </button>
        ) : step === "verify" ? (
          <div className="flex gap-2">
            <button
              onClick={() => setStep("scan")}
              className="flex-1 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text-secondary py-3 cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold py-3 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {verifying ? "Verificando..." : "Ativar 2FA"}
            </button>
          </div>
        ) : step === "backup" ? (
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-sm font-bold py-3 rounded-xl cursor-pointer"
          >
            Salvei meus códigos — concluir
          </button>
        ) : null
      }
    >
      {step === "loading" && (
        <div className="py-8 text-center text-sm text-muted">Gerando QR Code...</div>
      )}

      {step === "scan" && data && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Abra seu app autenticador (Google Authenticator, 1Password, Authy, Microsoft Authenticator)
            e escaneie o QR Code abaixo.
          </p>
          <div className="bg-white p-4 rounded-xl mx-auto">
            <Image
              src={data.qr}
              alt="QR Code 2FA"
              width={200}
              height={200}
              style={{ width: "200px", height: "200px" }}
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5">
              Ou cole esta chave manualmente
            </p>
            <div className="flex items-center gap-2 bg-card-hover border border-border rounded-lg px-3 py-2">
              <code className="text-xs text-text font-mono flex-1 break-all">{data.secret}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.secret);
                  toast.success("Chave copiada");
                }}
                className="text-muted hover:text-accent transition-colors cursor-pointer"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary block">
            Código do app autenticador
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            autoFocus
            placeholder="000000"
            className="w-full bg-card-hover border border-border rounded-lg px-4 py-3 text-2xl font-mono text-text text-center tracking-[8px] outline-none focus:border-accent transition-colors"
          />
          <p className="text-[11px] text-muted text-center">
            O código muda a cada 30 segundos.
          </p>
        </div>
      )}

      {step === "backup" && (
        <div className="flex flex-col gap-3">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
            <ShieldCheck size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-text leading-relaxed">
              Salve estes códigos em local seguro. Cada um funciona <strong>apenas uma vez</strong>.
              Use-os se perder acesso ao seu app autenticador.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="bg-card-hover border border-border rounded-md py-2 text-center font-mono text-sm text-text tracking-widest"
              >
                {code}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyBackupCodes}
              className="flex-1 flex items-center justify-center gap-1.5 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text py-2.5 cursor-pointer hover:border-accent/40 transition-colors"
            >
              {copied ? <CheckCircle2 size={12} className="text-income" /> : <Copy size={12} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 flex items-center justify-center gap-1.5 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text py-2.5 cursor-pointer hover:border-accent/40 transition-colors"
            >
              <Download size={12} />
              Baixar TXT
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
