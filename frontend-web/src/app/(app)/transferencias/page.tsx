"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeftRight, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatMonthYear, currentMonth } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

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
  const toast = useToast();

  async function fetchTransfers() {
    setLoading(true);
    try {
      const r = await fetch(`/api/transfers?month=${month}&year=${year}`);
      const j = await r.json();
      if (j.ok) setTransfers(j.transfers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transfers?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setTransfers(j.transfers);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, year]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wallets")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setWallets(j.wallets);
          if (j.wallets.length >= 2) {
            setFromWalletId(String(j.wallets[0].id));
            setToWalletId(String(j.wallets[1].id));
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!amountNum || amountNum <= 0) { toast.error("Valor inválido"); return; }
    if (!fromWalletId || !toWalletId) { toast.error("Selecione as carteiras"); return; }
    if (fromWalletId === toWalletId) { toast.error("Carteiras devem ser diferentes"); return; }

    setSaving(true);
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
      if (!j.ok) {
        toast.error("Não foi possível transferir", { description: j.error });
        return;
      }
      toast.success("Transferência realizada");
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
      <div className="border-b border-border-subtle px-4 lg:px-6 py-3 lg:h-14 lg:py-0 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-base font-bold text-text">Transferências</h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-1">
            <button onClick={prevMonth} className="touch-target p-1.5 text-muted hover:text-text transition-colors cursor-pointer"><ChevronLeft size={14} /></button>
            <span className="text-xs font-semibold text-text-secondary px-1 min-w-[100px] text-center capitalize">{formatMonthYear(month, year)}</span>
            <button onClick={nextMonth} className="touch-target p-1.5 text-muted hover:text-text transition-colors cursor-pointer"><ChevronRight size={14} /></button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-3 py-2.5 rounded-lg transition-all cursor-pointer hover:shadow-md hover:shadow-accent/20"
        >
          <Plus size={14} /> Nova transferência
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <CardBlock title={`Transferências de ${formatMonthYear(month, year)}`}>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted">Carregando...</div>
          ) : transfers.length === 0 ? (
            <EmptyState
              Icon={ArrowLeftRight}
              title="Nenhuma transferência neste mês"
              description="Mova valores entre suas carteiras sem afetar o saldo do mês."
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer hover:shadow-md hover:shadow-accent/20 transition-all"
                >
                  <Plus size={13} /> Fazer transferência
                </button>
              }
            />
          ) : (
            transfers.map((t, i) => {
              const from = t.transactions[0];
              const to = t.transactions[1];
              return (
                <div key={t.transferGroupId ?? i} className={`flex items-center gap-4 py-3 ${i < transfers.length - 1 ? "border-b border-border-subtle" : ""}`}>
                  <div className="w-9 h-9 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={14} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-text">
                      <span className="text-text-secondary truncate">{from?.walletName ?? "Carteira"}</span>
                      <ArrowRight size={11} className="text-muted flex-shrink-0" />
                      <span className="truncate">{to?.walletName ?? "Carteira"}</span>
                    </div>
                    <div className="text-[10px] text-muted mt-0.5 truncate">
                      {formatDate(t.occurredAt)}{t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-accent whitespace-nowrap">{formatCurrency(t.amount)}</span>
                </div>
              );
            })
          )}
        </CardBlock>
      </div>

      {/* New transfer modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova transferência"
        description="Mova valores entre suas carteiras"
        icon={<ArrowLeftRight size={18} />}
        size="md"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-card-hover border border-border rounded-lg text-xs font-semibold text-text-secondary hover:text-text py-2.5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer hover:shadow-md hover:shadow-accent/20"
            >
              {saving ? "Transferindo..." : "Transferir"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Valor (R$)</label>
            <input
              autoFocus
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">De (origem)</label>
              <select value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer">
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Para (destino)</label>
              <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)}
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer">
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Descrição (opcional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Reserva mensal"
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
