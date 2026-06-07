"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogOut, Users, Trash2, Check, X, ShieldCheck } from "lucide-react";
import { TwoFactorSetup } from "@/components/ui/TwoFactorSetup";
import { Modal } from "@/components/ui/Modal";
import { CardBlock } from "@/components/ui/CardBlock";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface Stats {
  txCount: number;
  walletCount: number;
  categoryCount: number;
  goalCount: number;
}

type Tab = "perfil" | "senha" | "compartilhar" | "seguranca";

interface SharedUser {
  id: number;
  user: { id: number; name: string; email: string };
  permission: "READ" | "WRITE";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: string;
  acceptedAt: string | null;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("perfil");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Shared access
  const [sharedOut, setSharedOut] = useState<SharedUser[]>([]);
  const [sharedIn, setSharedIn] = useState<SharedUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"READ" | "WRITE">("READ");
  const [inviting, setInviting] = useState(false);

  async function fetchShared() {
    try {
      const r = await fetch("/api/shared-access");
      const j = await r.json();
      if (j.ok) {
        setSharedOut(j.sharedOut);
        setSharedIn(j.sharedIn);
      }
    } catch {
      /* ignore */
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Informe um email");
      return;
    }
    setInviting(true);
    try {
      const r = await fetch("/api/shared-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), permission: invitePermission }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível convidar", { description: j.error });
        return;
      }
      toast.success("Convite enviado");
      setInviteEmail("");
      fetchShared();
    } catch {
      toast.error("Erro de rede ao convidar");
    } finally {
      setInviting(false);
    }
  }

  async function handleAccept(id: number) {
    try {
      const r = await fetch(`/api/shared-access/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const j = await r.json();
      if (j.ok) {
        toast.success("Convite aceito");
        fetchShared();
      } else {
        toast.error("Não foi possível aceitar", { description: j.error });
      }
    } catch {
      toast.error("Erro de rede ao aceitar");
    }
  }

  async function handleRevoke(id: number) {
    try {
      const r = await fetch(`/api/shared-access/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE" }),
      });
      const j = await r.json();
      if (j.ok) {
        toast.success("Acesso revogado");
        fetchShared();
      } else {
        toast.error("Não foi possível revogar", { description: j.error });
      }
    } catch {
      toast.error("Erro de rede ao revogar");
    }
  }

  async function handleDeleteShare(id: number) {
    try {
      const r = await fetch(`/api/shared-access/${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({ ok: r.ok }));
      if (j.ok) {
        toast.success("Compartilhamento removido");
        fetchShared();
      } else {
        toast.error("Não foi possível remover", { description: j.error });
      }
    } catch {
      toast.error("Erro de rede ao remover");
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/shared-access").then((r) => r.json()),
    ])
      .then(([uj, sj]) => {
        if (cancelled) return;
        if (uj.ok) {
          setUser(uj.user);
          setStats(uj.stats);
          setName(uj.user.name);
          setEmail(uj.user.email);
        }
        if (sj.ok) {
          setSharedOut(sj.sharedOut);
          setSharedIn(sj.sharedIn);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const r = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível salvar o perfil", {
          description: j.error,
        });
        return;
      }
      setUser((prev) => (prev ? { ...prev, name: j.user.name, email: j.user.email } : prev));
      toast.success("Perfil atualizado com sucesso");
    } catch {
      toast.error("Erro de rede ao salvar o perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Nova senha e confirmação não coincidem");
      return;
    }

    setSavingPassword(true);
    try {
      const r = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível atualizar a senha", {
          description: j.error,
        });
        return;
      }
      toast.success("Senha atualizada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Erro de rede ao atualizar a senha");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 gap-2">
        <h1 className="text-base font-bold text-text">Configurações</h1>
        <button
          onClick={handleLogout}
          className="touch-target flex items-center gap-1.5 text-xs text-muted hover:text-danger transition-colors cursor-pointer"
        >
          <LogOut size={12} />
          <span className="hidden sm:inline">Sair da conta</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4 max-w-3xl">
          {/* Profile header */}
          {loading ? (
            <CardBlock>
              <div className="py-8 text-center text-sm text-muted">Carregando...</div>
            </CardBlock>
          ) : user ? (
            <>
              <CardBlock>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-violet-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-text">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Conta criada em {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border-subtle">
                    <div className="text-center">
                      <p className="text-lg font-bold text-text">{stats.txCount}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Transações</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text">{stats.walletCount}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Carteiras</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text">{stats.categoryCount}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Categorias</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text">{stats.goalCount}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Metas</p>
                    </div>
                  </div>
                )}
              </CardBlock>

              {/* Tabs */}
              <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
                <button
                  onClick={() => setTab("perfil")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    tab === "perfil"
                      ? "bg-accent text-white font-semibold"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <User size={12} />
                  Perfil
                </button>
                <button
                  onClick={() => setTab("senha")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    tab === "senha"
                      ? "bg-accent text-white font-semibold"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <Lock size={12} />
                  Senha
                </button>
                <button
                  onClick={() => setTab("compartilhar")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    tab === "compartilhar"
                      ? "bg-accent text-white font-semibold"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <Users size={12} />
                  Compartilhar
                </button>
                <button
                  onClick={() => setTab("seguranca")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    tab === "seguranca"
                      ? "bg-accent text-white font-semibold"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <ShieldCheck size={12} />
                  Segurança
                </button>
              </div>

              {/* Profile tab */}
              {tab === "perfil" && (
                <CardBlock title="Editar perfil">
                  <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile || (name === user.name && email === user.email)}
                      className="self-end bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {savingProfile ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </form>
                </CardBlock>
              )}

              {/* Password tab */}
              {tab === "senha" && (
                <CardBlock title="Alterar senha">
                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">
                        Senha atual
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">
                        Nova senha
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                      />
                      <p className="text-[10px] text-muted mt-1">Mínimo de 8 caracteres.</p>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">
                        Confirmar nova senha
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        savingPassword || !currentPassword || !newPassword || !confirmPassword
                      }
                      className="self-end bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {savingPassword ? "Salvando..." : "Atualizar senha"}
                    </button>
                  </form>
                </CardBlock>
              )}

              {/* Shared access tab */}
              {tab === "compartilhar" && (
                <div className="flex flex-col gap-4">
                  <CardBlock title="Convidar alguém">
                    <p className="text-[11px] text-text-secondary mb-3">
                      Compartilhe acesso às suas finanças com seu cônjuge ou parceiro(a).
                      Eles precisam ter uma conta no FinControl.
                    </p>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="flex-1 bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                      />
                      <select
                        value={invitePermission}
                        onChange={(e) => setInvitePermission(e.target.value as "READ" | "WRITE")}
                        className="bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer"
                      >
                        <option value="READ">Apenas leitura</option>
                        <option value="WRITE">Leitura + edição</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting || !inviteEmail.trim()}
                        className="bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        {inviting ? "Enviando..." : "Convidar"}
                      </button>
                    </form>
                  </CardBlock>

                  <CardBlock title={`Pessoas com acesso (${sharedOut.length})`}>
                    {sharedOut.length === 0 ? (
                      <p className="text-xs text-muted py-2">Nenhum convite enviado.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sharedOut.map((s) => (
                          <ShareRow
                            key={s.id}
                            share={s}
                            isOwner
                            onRevoke={() => handleRevoke(s.id)}
                            onDelete={() => handleDeleteShare(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardBlock>

                  <CardBlock title={`Convites recebidos (${sharedIn.length})`}>
                    {sharedIn.length === 0 ? (
                      <p className="text-xs text-muted py-2">Nenhum convite recebido.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sharedIn.map((s) => (
                          <ShareRow
                            key={s.id}
                            share={s}
                            isOwner={false}
                            onAccept={() => handleAccept(s.id)}
                            onRevoke={() => handleRevoke(s.id)}
                            onDelete={() => handleDeleteShare(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardBlock>
                </div>
              )}

              {/* Security tab — 2FA + sessões */}
              {tab === "seguranca" && (
                <SecurityTab
                  user={user}
                  onUserChange={setUser}
                  onLogout={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                />
              )}
            </>
          ) : (
            <CardBlock>
              <p className="text-sm text-muted py-4 text-center">Erro ao carregar perfil.</p>
            </CardBlock>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Share row — used in both sharedOut and sharedIn lists
// ──────────────────────────────────────────────
interface ShareRowProps {
  share: SharedUser;
  isOwner: boolean;
  onAccept?: () => void;
  onRevoke?: () => void;
  onDelete?: () => void;
}

function ShareRow({ share, isOwner, onAccept, onRevoke, onDelete }: ShareRowProps) {
  const statusLabel = {
    PENDING: { label: "Pendente", className: "bg-yellow-500/15 text-yellow-400" },
    ACCEPTED: { label: "Aceito", className: "bg-income/15 text-income" },
    REVOKED: { label: "Revogado", className: "bg-card-hover text-muted" },
  }[share.status];

  return (
    <div className="flex items-center justify-between gap-3 bg-card-hover border border-border-subtle rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e6c879] to-[#b8893f] flex items-center justify-center text-[#1a1208] text-xs font-bold flex-shrink-0">
          {share.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text truncate">{share.user.name}</p>
          <p className="text-[10px] text-muted truncate">{share.user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest font-bold text-text-secondary">
          {share.permission === "WRITE" ? "Editar" : "Leitura"}
        </span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusLabel.className}`}>
          {statusLabel.label}
        </span>
        {/* Actions */}
        {!isOwner && share.status === "PENDING" && onAccept && (
          <button
            onClick={onAccept}
            className="touch-target text-income hover:bg-income/15 rounded-md p-1.5 cursor-pointer transition-colors"
            aria-label="Aceitar"
          >
            <Check size={14} />
          </button>
        )}
        {share.status === "ACCEPTED" && onRevoke && (
          <button
            onClick={onRevoke}
            className="touch-target text-muted hover:text-yellow-400 rounded-md p-1.5 cursor-pointer transition-colors"
            aria-label="Revogar"
            title="Revogar acesso"
          >
            <X size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="touch-target text-muted hover:text-expense rounded-md p-1.5 cursor-pointer transition-colors"
            aria-label="Remover"
            title="Remover permanentemente"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Security tab — 2FA + sessões
// ──────────────────────────────────────────────
interface SecurityTabProps {
  user: UserProfile;
  onUserChange: (u: UserProfile) => void;
  onLogout: () => void;
}

function SecurityTab({ user, onUserChange, onLogout }: SecurityTabProps) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePw, setDisablePw] = useState("");
  const [resendingVerify, setResendingVerify] = useState(false);
  const toast = useToast();

  async function handleDisable() {
    if (!disablePw) {
      toast.error("Informe sua senha");
      return;
    }
    try {
      const r = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePw }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível desativar", { description: j.error });
        return;
      }
      onUserChange({ ...user, twoFactorEnabled: false });
      setDisableOpen(false);
      setDisablePw("");
      toast.success("2FA desativado");
    } catch {
      toast.error("Erro de rede");
    }
  }

  async function handleResendVerify() {
    setResendingVerify(true);
    try {
      const r = await fetch("/api/auth/resend-verification", { method: "POST" });
      const j = await r.json();
      if (j.ok) toast.success("Email de verificação enviado");
      else toast.error("Erro", { description: j.error });
    } catch {
      toast.error("Erro de rede");
    } finally {
      setResendingVerify(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Email verification status */}
      {user.emailVerified === false && (
        <CardBlock>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text">Email não verificado</p>
              <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                Confirme seu email para receber alertas importantes e recuperar sua conta caso esqueça a senha.
              </p>
              <button
                onClick={handleResendVerify}
                disabled={resendingVerify}
                className="mt-3 text-xs font-semibold text-accent hover:underline cursor-pointer disabled:opacity-50"
              >
                {resendingVerify ? "Enviando..." : "Reenviar email de verificação"}
              </button>
            </div>
          </div>
        </CardBlock>
      )}

      {/* 2FA */}
      <CardBlock title="Autenticação em dois fatores (2FA)">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            user.twoFactorEnabled
              ? "bg-income/15 border-income/30 text-income"
              : "bg-accent-soft border-accent/30 text-accent"
          }`}>
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-text">
              2FA por TOTP
              {user.twoFactorEnabled && (
                <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-income/15 text-income">
                  Ativo
                </span>
              )}
            </p>
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              {user.twoFactorEnabled
                ? "A cada login, será solicitado um código de 6 dígitos do seu app autenticador."
                : "Adicione uma camada extra de proteção exigindo um código de 6 dígitos do seu app autenticador (Google Authenticator, 1Password, Authy)."}
            </p>
            {user.twoFactorEnabled ? (
              <button
                onClick={() => setDisableOpen(true)}
                className="mt-3 text-xs font-semibold text-expense hover:underline cursor-pointer"
              >
                Desativar 2FA
              </button>
            ) : (
              <button
                onClick={() => setSetupOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                <ShieldCheck size={12} /> Ativar 2FA
              </button>
            )}
          </div>
        </div>
      </CardBlock>

      <CardBlock title="Sessão atual">
        <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
          Trocar a senha encerra todas as sessões em outros dispositivos automaticamente.
        </p>
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-expense hover:underline cursor-pointer"
        >
          Encerrar a sessão atual
        </button>
      </CardBlock>

      <TwoFactorSetup
        open={setupOpen}
        onClose={() => {
          setSetupOpen(false);
          // Refetch profile pra refletir twoFactorEnabled atualizado
          fetch("/api/user")
            .then((r) => r.json())
            .then((j) => {
              if (j.ok) onUserChange(j.user);
            })
            .catch(() => {});
        }}
      />

      <Modal
        open={disableOpen}
        onClose={() => {
          setDisableOpen(false);
          setDisablePw("");
        }}
        title="Desativar 2FA"
        description="Confirme sua senha para desativar a autenticação em dois fatores"
        icon={<ShieldCheck size={18} />}
        size="sm"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDisableOpen(false);
                setDisablePw("");
              }}
              className="flex-1 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text-secondary py-2.5 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleDisable}
              className="flex-1 bg-expense text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
            >
              Desativar
            </button>
          </div>
        }
      >
        <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">
          Senha atual
        </label>
        <input
          autoFocus
          type="password"
          value={disablePw}
          onChange={(e) => setDisablePw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDisable()}
          className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
        />
      </Modal>
    </div>
  );
}
