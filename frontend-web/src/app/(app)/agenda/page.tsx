"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Check, AlertTriangle, Clock } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDay: number;
  categoryName: string | null;
  walletName: string | null;
  walletId: number | null;
  daysUntil: number;
  isOverdue: boolean;
}

interface Wallet { id: number; name: string; }
interface Category { id: number; name: string; }

function urgencyStyle(bill: Bill): { border: string; bg: string; label: string; icon: React.ReactNode } {
  if (bill.isOverdue || bill.daysUntil === 0) return { border: "border-expense", bg: "bg-[#ef444410]", label: "Atrasada", icon: <AlertTriangle size={12} className="text-expense" /> };
  if (bill.daysUntil <= 3) return { border: "border-orange-500", bg: "bg-[#f9731610]", label: `${bill.daysUntil}d`, icon: <Clock size={12} className="text-orange-400" /> };
  return { border: "border-border", bg: "", label: `dia ${bill.dueDay}`, icon: null };
}

interface BillRowProps {
  bill: Bill;
  paying: number | null;
  deleting: number | null;
  onPay: (id: number) => void;
  onDelete: (id: number) => void;
}

function BillRow({ bill, paying, deleting, onPay, onDelete }: BillRowProps) {
  const u = urgencyStyle(bill);
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${u.border} ${u.bg} mb-3 last:mb-0 group`}>
      <div className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center flex-shrink-0 text-sm">
        {u.icon ?? <span className="text-muted text-xs">{bill.dueDay}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{bill.name}</p>
        <p className="text-[10px] text-muted">
          {bill.categoryName ?? "Sem categoria"} · {bill.walletName ?? "Sem carteira"} · {u.label}
        </p>
      </div>
      <span className="text-sm font-bold text-expense flex-shrink-0">{formatCurrency(bill.amount)}</span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onPay(bill.id)}
          disabled={paying === bill.id}
          className="w-7 h-7 rounded-lg bg-income/20 hover:bg-income flex items-center justify-center text-income hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          title="Marcar como pago"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => onDelete(bill.id)}
          disabled={deleting === bill.id}
          className="w-7 h-7 rounded-lg bg-card-hover hover:bg-expense/20 flex items-center justify-center text-muted hover:text-expense transition-colors cursor-pointer disabled:opacity-30"
          title="Remover"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBills() {
    setLoading(true);
    try {
      const r = await fetch("/api/bills");
      const j = await r.json();
      if (j.ok) setBills(j.bills);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/bills").then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
    ])
      .then(([billsJson, walls, cats]) => {
        if (cancelled) return;
        if (billsJson.ok) setBills(billsJson.bills);
        if (walls.ok) {
          setWallets(walls.wallets);
          if (walls.wallets.length > 0) setWalletId(String(walls.wallets[0].id));
        }
        if (cats.ok) setCategories(cats.categorias);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePay(id: number) {
    setPaying(id);
    try {
      await fetch(`/api/bills/${id}/pay`, { method: "POST" });
      fetchBills();
    } finally { setPaying(null); }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await fetch(`/api/bills/${id}`, { method: "DELETE" });
      setBills(bs => bs.filter(b => b.id !== id));
    } finally { setDeleting(null); }
  }

  async function handleCreate() {
    if (!name.trim() || !amount || !dueDay) { setError("Preencha nome, valor e dia"); return; }
    const amountNum = parseFloat(amount.replace(",", "."));
    const dueDayNum = parseInt(dueDay);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Valor inválido"); return; }
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 28) { setError("Dia deve ser entre 1 e 28"); return; }
    setSaving(true); setError(null);
    try {
      const r = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: amountNum,
          dueDay: dueDayNum,
          categoryId: categoryId ? Number(categoryId) : undefined,
          walletId: walletId ? Number(walletId) : undefined,
        }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Erro ao criar"); return; }
      setName(""); setAmount(""); setDueDay("1"); setCategoryId(""); setShowForm(false);
      fetchBills();
    } finally { setSaving(false); }
  }

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const overdueBills = bills.filter(b => b.isOverdue || b.daysUntil === 0);
  const urgentBills = bills.filter(b => !b.isOverdue && b.daysUntil > 0 && b.daysUntil <= 3);
  const normalBills = bills.filter(b => !b.isOverdue && b.daysUntil > 3);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 lg:px-6 py-3 lg:h-14 lg:py-0 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-text">Agenda</h1>
          <span className="text-xs text-muted sm:hidden">
            <span className="text-expense font-bold">{formatCurrency(totalMonthly)}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted hidden sm:inline">
            Total mensal: <span className="text-expense font-bold">{formatCurrency(totalMonthly)}</span>
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-3 py-2.5 rounded-lg transition-all cursor-pointer hover:shadow-md hover:shadow-accent/20"
          >
            <Plus size={14} /> Adicionar conta
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted">Carregando...</div>
            ) : bills.length === 0 ? (
              <EmptyState icon="📅" title="Nenhuma conta fixa cadastrada" description="Adicione suas contas recorrentes para nunca perder um vencimento." />
            ) : (
              <>
                {overdueBills.length > 0 && (
                  <CardBlock title={`⚠ Atrasadas ou vencem hoje (${overdueBills.length})`}>
                    {overdueBills.map(b => (
                      <BillRow key={b.id} bill={b} paying={paying} deleting={deleting} onPay={handlePay} onDelete={handleDelete} />
                    ))}
                  </CardBlock>
                )}
                {urgentBills.length > 0 && (
                  <CardBlock title={`Vencem em breve (${urgentBills.length})`}>
                    {urgentBills.map(b => (
                      <BillRow key={b.id} bill={b} paying={paying} deleting={deleting} onPay={handlePay} onDelete={handleDelete} />
                    ))}
                  </CardBlock>
                )}
                {normalBills.length > 0 && (
                  <CardBlock title={`Este mês (${normalBills.length})`}>
                    {normalBills.map(b => (
                      <BillRow key={b.id} bill={b} paying={paying} deleting={deleting} onPay={handlePay} onDelete={handleDelete} />
                    ))}
                  </CardBlock>
                )}
              </>
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <CardBlock title="Resumo">
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between"><span className="text-muted">Total de contas</span><span className="font-bold text-text">{bills.length}</span></div>
                <div className="flex justify-between"><span className="text-muted">Total mensal</span><span className="font-bold text-expense">{formatCurrency(totalMonthly)}</span></div>
                {overdueBills.length > 0 && (
                  <div className="flex justify-between"><span className="text-expense">Atrasadas</span><span className="font-bold text-expense">{overdueBills.length}</span></div>
                )}
              </div>
            </CardBlock>

            {showForm && (
              <CardBlock title="Nova conta fixa">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Nome", value: name, onChange: setName, placeholder: "Ex: Aluguel, Netflix..." },
                    { label: "Valor (R$)", value: amount, onChange: setAmount, placeholder: "0,00" },
                    { label: "Dia do vencimento", value: dueDay, onChange: setDueDay, placeholder: "1-28" },
                  ].map(({ label, value, onChange, placeholder }) => (
                    <div key={label}>
                      <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">{label}</label>
                      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                        className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Categoria (opcional)</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                      className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer">
                      <option value="">Sem categoria</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Carteira (opcional)</label>
                    <select value={walletId} onChange={e => setWalletId(e.target.value)}
                      className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer">
                      <option value="">Sem carteira</option>
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  {error && <p className="text-[10px] text-expense">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleCreate} disabled={saving}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                      {saving ? "..." : "Adicionar"}
                    </button>
                    <button onClick={() => { setShowForm(false); setError(null); }}
                      className="px-3 py-2 bg-card-hover border border-border rounded-lg text-xs text-muted hover:text-text transition-colors cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </div>
              </CardBlock>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
