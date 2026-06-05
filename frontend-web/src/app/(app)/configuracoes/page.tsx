"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogOut, AlertCircle, CheckCircle2 } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { formatDate } from "@/lib/format";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface Stats {
  txCount: number;
  walletCount: number;
  categoryCount: number;
  goalCount: number;
}

type Tab = "perfil" | "senha";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("perfil");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setUser(j.user);
          setStats(j.stats);
          setName(j.user.name);
          setEmail(j.user.email);
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
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      const r = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const j = await r.json();
      if (!j.ok) {
        setProfileError(j.error ?? "Erro ao atualizar perfil");
        return;
      }
      setUser((prev) => (prev ? { ...prev, name: j.user.name, email: j.user.email } : prev));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Nova senha e confirmação não coincidem");
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
        setPasswordError(j.error ?? "Erro ao atualizar senha");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
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
              </div>

              {/* Profile tab */}
              {tab === "perfil" && (
                <CardBlock title="Editar perfil">
                  <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
                    {profileError && (
                      <div className="flex items-center gap-2 bg-card-hover border border-expense/30 rounded-lg p-3">
                        <AlertCircle size={14} className="text-expense flex-shrink-0" />
                        <p className="text-xs text-text">{profileError}</p>
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="flex items-center gap-2 bg-card-hover border border-income/30 rounded-lg p-3">
                        <CheckCircle2 size={14} className="text-income flex-shrink-0" />
                        <p className="text-xs text-text">Perfil atualizado com sucesso.</p>
                      </div>
                    )}

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
                    {passwordError && (
                      <div className="flex items-center gap-2 bg-card-hover border border-expense/30 rounded-lg p-3">
                        <AlertCircle size={14} className="text-expense flex-shrink-0" />
                        <p className="text-xs text-text">{passwordError}</p>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 bg-card-hover border border-income/30 rounded-lg p-3">
                        <CheckCircle2 size={14} className="text-income flex-shrink-0" />
                        <p className="text-xs text-text">Senha atualizada com sucesso.</p>
                      </div>
                    )}

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
