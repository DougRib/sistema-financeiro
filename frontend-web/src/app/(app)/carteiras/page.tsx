"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // New wallet form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("CHECKING");
  const [newBalance, setNewBalance] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { fetchWallets(); }, []);

  async function handleCreate() {
    if (!newName.trim()) { setError("Nome obrigatório"); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          balance: parseFloat(newBalance.replace(",", ".")) || 0,
        }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Erro ao criar"); return; }
      setNewName(""); setNewType("CHECKING"); setNewBalance("0");
      setShowForm(false);
      fetchWallets();
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(id: number) {
    if (!editName.trim()) return;
    await fetch(`/api/wallets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditId(null);
    fetchWallets();
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    setDeleteError(null);
    try {
      const r = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!j.ok) { setDeleteError(j.error || "Erro ao excluir"); return; }
      setWallets(ws => ws.filter(w => w.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-border-subtle flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-text">Carteiras</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-subtle">
            Saldo total: <span className="text-accent font-bold">{formatCurrency(totalBalance)}</span>
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} /> Nova carteira
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {deleteError && (
          <div className="mb-4 text-xs text-danger bg-[#f43f5e10] border border-[#f43f5e30] rounded-lg px-3 py-2">
            {deleteError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-muted">Carregando...</div>
        ) : wallets.length === 0 && !showForm ? (
          <EmptyState
            icon="💳"
            title="Nenhuma carteira cadastrada"
            description="Adicione uma carteira para começar a registrar transações."
            action={
              <button onClick={() => setShowForm(true)} className="text-xs text-accent hover:underline cursor-pointer">
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
                    {formatCurrency(bal)}
                  </p>
                </div>
              );
            })}

            {/* Add new card */}
            {showForm ? (
              <div className="bg-card border border-accent rounded-xl p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold text-accent">Nova carteira</p>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Nome</label>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Ex: Nubank, Itaú..."
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Saldo inicial</label>
                  <input
                    type="text"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                  />
                </div>
                {error && <p className="text-[10px] text-danger">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "..." : "Criar"}
                  </button>
                  <button onClick={() => { setShowForm(false); setError(null); }} className="px-3 py-2 bg-card-hover border border-border rounded-lg text-xs text-muted hover:text-text transition-colors cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="bg-card border-2 border-dashed border-border hover:border-accent rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer min-h-[140px]"
              >
                <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                  <Plus size={16} />
                </div>
                <span className="text-xs text-muted group-hover:text-accent transition-colors">Adicionar carteira</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
