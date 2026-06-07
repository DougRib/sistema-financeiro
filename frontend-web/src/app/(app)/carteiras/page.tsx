"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check, Wallet as WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { maskValue, usePrivacy } from "@/components/ui/PrivacyContext";
import { Modal } from "@/components/ui/Modal";

interface Wallet {
  id: number;
  name: string;
  balance: number | string;
  type: "CHECKING" | "CREDIT" | "INVESTMENT" | "OTHER";
}

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Conta Corrente",
  CREDIT: "Cartão de Crédito",
  INVESTMENT: "Investimento",
  OTHER: "Outro",
};

export default function CarteirasPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  // New wallet form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("CHECKING");
  const [newBalance, setNewBalance] = useState("0");
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [newClosingDay, setNewClosingDay] = useState("");
  const [newDueDay, setNewDueDay] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { hidden } = usePrivacy();

  async function fetchWallets() {
    setLoading(true);
    try {
      const r = await fetch("/api/wallets");
      const j = await r.json();
      if (j.ok) setWallets(j.wallets);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wallets")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setWallets(j.wallets);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        type: newType,
        balance: parseFloat(newBalance.replace(",", ".")) || 0,
      };
      if (newType === "CREDIT") {
        const limit = parseFloat(newCreditLimit.replace(",", "."));
        if (!isNaN(limit) && limit > 0) body.creditLimit = limit;
        const cd = parseInt(newClosingDay);
        if (!isNaN(cd) && cd >= 1 && cd <= 31) body.closingDay = cd;
        const dd = parseInt(newDueDay);
        if (!isNaN(dd) && dd >= 1 && dd <= 31) body.dueDay = dd;
      }
      const r = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível criar a carteira", { description: j.error });
        return;
      }
      toast.success("Carteira criada");
      setNewName("");
      setNewType("CHECKING");
      setNewBalance("0");
      setNewCreditLimit("");
      setNewClosingDay("");
      setNewDueDay("");
      setShowForm(false);
      fetchWallets();
    } catch {
      toast.error("Erro de rede ao criar carteira");
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(id: number) {
    if (!editName.trim()) return;
    try {
      const r = await fetch(`/api/wallets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível renomear", { description: j.error });
        return;
      }
      toast.success("Carteira renomeada");
      setEditId(null);
      fetchWallets();
    } catch {
      toast.error("Erro de rede ao renomear");
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const r = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível excluir", { description: j.error });
        return;
      }
      toast.success("Carteira excluída");
      setWallets(ws => ws.filter(w => w.id !== id));
    } catch {
      toast.error("Erro de rede ao excluir carteira");
    } finally {
      setDeleting(null);
    }
  }

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="border-b border-border-subtle px-4 lg:px-6 py-3 lg:h-14 lg:py-0 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-text">Carteiras</h1>
          <span className="text-xs text-subtle sm:hidden">
            <span className="text-accent font-bold">{maskValue(formatCurrency(totalBalance), hidden)}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-subtle hidden sm:inline">
            Saldo total: <span className="text-accent font-bold">{maskValue(formatCurrency(totalBalance), hidden)}</span>
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-3 py-2.5 rounded-lg transition-all cursor-pointer touch-target hover:shadow-md hover:shadow-accent/20"
          >
            <Plus size={14} /> Nova carteira
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted">Carregando...</div>
        ) : wallets.length === 0 && !showForm ? (
          <EmptyState
            Icon={WalletIcon}
            title="Nenhuma carteira cadastrada"
            description="Adicione uma carteira para começar a registrar transações."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer hover:shadow-md hover:shadow-accent/20 transition-all"
              >
                <Plus size={13} />
                Criar primeira carteira
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wallets.map((wallet) => {
              const bal = Number(wallet.balance);
              const isNeg = bal < 0;
              return (
                <div
                  key={wallet.id}
                  className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:border-border-subtle transition-colors"
                >
                  {/* Background accent circle */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-accent opacity-[0.06]" />

                  <div className="text-[9px] uppercase tracking-[2px] text-muted mb-1.5">
                    {TYPE_LABELS[wallet.type] ?? wallet.type}
                  </div>

                  {editId === wallet.id ? (
                    <div className="flex items-center gap-1.5 mb-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(wallet.id); if (e.key === "Escape") setEditId(null); }}
                        autoFocus
                        className="flex-1 bg-card-hover border border-accent rounded px-2 py-1 text-sm text-text outline-none text-xs"
                      />
                      <button onClick={() => handleRename(wallet.id)} className="text-income cursor-pointer"><Check size={13} /></button>
                      <button onClick={() => setEditId(null)} className="text-muted cursor-pointer"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-text truncate">{wallet.name}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditId(wallet.id); setEditName(wallet.name); }}
                          className="text-muted hover:text-accent transition-colors cursor-pointer"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(wallet.id)}
                          disabled={deleting === wallet.id}
                          className="text-muted hover:text-danger transition-colors cursor-pointer disabled:opacity-30"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  <p className={`text-2xl font-black tracking-tight ${isNeg ? "text-expense" : "text-text"}`}>
                    {maskValue(formatCurrency(bal), hidden)}
                  </p>
                </div>
              );
            })}

            {/* Add new card (dashed button — opens modal) */}
            <button
              onClick={() => setShowForm(true)}
              className="bg-card border-2 border-dashed border-border hover:border-accent rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Plus size={18} />
              </div>
              <span className="text-xs font-semibold text-text-secondary group-hover:text-accent transition-colors">Adicionar carteira</span>
            </button>
          </div>
        )}
      </div>

      {/* New wallet modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova carteira"
        description="Adicione uma conta, cartão ou investimento"
        icon={<WalletIcon size={18} />}
        size="sm"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text-secondary hover:text-text py-2.5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer hover:shadow-md hover:shadow-accent/20"
            >
              {saving ? "Criando..." : "Criar carteira"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Nome</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Ex: Nubank, Itaú, Carteira..."
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Tipo</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">
              {newType === "CREDIT" ? "Saldo já utilizado (R$)" : "Saldo inicial (R$)"}
            </label>
            <input
              type="text"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          {newType === "CREDIT" && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">
                  Limite de crédito (R$)
                </label>
                <input
                  type="text"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                  placeholder="5.000,00"
                  className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">
                    Dia fecha
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newClosingDay}
                    onChange={(e) => setNewClosingDay(e.target.value)}
                    placeholder="25"
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">
                    Dia vence
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newDueDay}
                    onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="10"
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                Despesas feitas até o dia <strong className="text-text">{newClosingDay || "25"}</strong>{" "}
                vão na fatura que vence em <strong className="text-text">{newDueDay || "10"}</strong> do mês seguinte.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
