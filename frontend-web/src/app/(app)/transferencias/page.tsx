"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatMonthYear, currentMonth } from "@/lib/format";

interface Wallet {
  id: number;
  name: string;
  balance: number;
}

interface Transfer {
  transferGroupId: string | null;
  amount: number;
  occurredAt: string;
  description: string | null;
  transactions: { id: number; walletId: number; walletName?: string }[];
}

export default function TransferenciasPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/transfers?month=${month}&year=${year}`);
      const j = await r.json();
      if (j.ok) setTransfers(j.transfers);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  useEffect(() => {
    fetch("/api/wallets").then(r => r.json()).then(j => {
      if (j.ok) {
        setWallets(j.wallets);
        if (j.wallets.length >= 2) {
          setFromWalletId(String(j.wallets[0].id));
          setToWalletId(String(j.wallets[1].id));
        }
      }
    });
  }, []);

  async function handleSave() {
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!amountNum || amountNum <= 0) { setError("Valor inválido"); return; }
    if (!fromWalletId || !toWalletId) { setError("Selecione as carteiras"); return; }
    if (fromWalletId === toWalletId) { setError("Carteiras devem ser diferentes"); return; }

    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          fromWalletId: Number(fromWalletId),
          toWalletId: Number(toWalletId),
          occurredAt: new Date(date + "T12:00:00.000Z").toISOString(),
          description: description || undefined,
        }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Erro ao transferir"); return; }
      setAmount(""); setDescription(""); setShowForm(false);
      fetchTransfers();
    } finally {
      setSaving(false);
    }
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-border-subtle flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-text">Transferências</h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-1">
            <button onClick={prevMonth} className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer"><ChevronLeft size={14} /></button>
            <span className="text-xs font-semibold text-text-secondary px-1 min-w-[100px] text-center">{formatMonthYear(month, year)}</span>
            <button onClick={nextMonth} className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer"><ChevronRight size={14} /></button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} /> Nova transferência
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Transfer list */}
          <div className="lg:col-span-2">
            <CardBlock title={`Transferências de ${formatMonthYear(month, year)}`}>
              {loading ? (
                <div className="py-8 text-center text-xs text-muted">Carregando...</div>
              ) : transfers.length === 0 ? (
                <EmptyState icon="⇄" title="Nenhuma transferência neste mês" />
              ) : (
                transfers.map((t, i) => {
                  const from = t.transactions[0];
                  const to = t.transactions[1];
                  return (
                    <div key={t.transferGroupId ?? i} className={`flex items-center gap-4 py-3 ${i < transfers.length - 1 ? "border-b border-border-subtle" : ""}`}>
                      <div className="w-8 h-8 rounded-lg bg-[#8b5cf620] flex items-center justify-center flex-shrink-0">
                        <ArrowRight size={14} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-text">
                          <span className="text-subtle">{from?.walletName ?? "Carteira"}</span>
                          <ArrowRight size={11} className="text-muted" />
                          <span>{to?.walletName ?? "Carteira"}</span>
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          {formatDate(t.occurredAt)}{t.description ? ` · ${t.description}` : ""}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-accent">{formatCurrency(t.amount)}</span>
                    </div>
                  );
                })
              )}
            </CardBlock>
          </div>

          {/* Form panel */}
          <div>
            {showForm ? (
              <CardBlock title="Nova transferência">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Valor (R$)", type: "text", value: amount, onChange: setAmount, placeholder: "0,00" },
                    { label: "Data", type: "date", value: date, onChange: setDate, placeholder: "" },
                    { label: "Descrição", type: "text", value: description, onChange: setDescription, placeholder: "Opcional" },
                  ].map(({ label, type, value, onChange, placeholder }) => (
                    <div key={label}>
                      <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">{label}</label>
                      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />
                    </div>
                  ))}

                  {[
                    { label: "De (origem)", value: fromWalletId, onChange: setFromWalletId },
                    { label: "Para (destino)", value: toWalletId, onChange: setToWalletId },
                  ].map(({ label, value, onChange }) => (
                    <div key={label}>
                      <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">{label}</label>
                      <select value={value} onChange={e => onChange(e.target.value)}
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer">
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance))})</option>)}
                      </select>
                    </div>
                  ))}

                  {error && <p className="text-[10px] text-danger">{error}</p>}

                  <div className="flex gap-2 mt-1">
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                      {saving ? "..." : "Transferir"}
                    </button>
                    <button onClick={() => { setShowForm(false); setError(null); }}
                      className="px-3 py-2 bg-card-hover border border-border rounded-lg text-xs text-muted hover:text-text transition-colors cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </div>
              </CardBlock>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-xs text-muted mb-3">Transfira valores entre suas carteiras sem afetar o saldo do mês.</p>
                <button onClick={() => setShowForm(true)}
                  className="text-xs text-accent hover:underline cursor-pointer">
                  Fazer transferência
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
