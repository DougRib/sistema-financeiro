"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { Tag } from "@/components/ui/Tag";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatMonthYear, currentMonth } from "@/lib/format";

interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  occurredAt: string;
  description: string | null;
  walletId: number;
  wallet?: { id: number; name: string };
  category: { id: number; name: string } | null;
}

interface Category {
  id: number;
  name: string;
}

interface Wallet {
  id: number;
  name: string;
}

export default function TransacoesPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"" | "INCOME" | "EXPENSE">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [walletFilter, setWalletFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (typeFilter) params.set("type", typeFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (walletFilter) params.set("walletId", walletFilter);
    if (search.trim()) params.set("q", search.trim());
    try {
      const r = await fetch(`/api/transactions?${params}`);
      const j = await r.json();
      if (j.ok) setTransactions(j.transactions);
    } finally {
      setLoading(false);
    }
  }, [month, year, typeFilter, categoryFilter, walletFilter, search]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias").then(r => r.json()),
      fetch("/api/wallets").then(r => r.json()),
    ]).then(([cats, walls]) => {
      if (cats.ok) setCategories(cats.categorias);
      if (walls.ok) setWallets(walls.wallets);
    });
  }, []);

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const r = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) setTransactions(txs => txs.filter(t => t.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-border-subtle flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-text">Transações</h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-1">
            <button onClick={prevMonth} className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-text-secondary px-1 min-w-[100px] text-center">
              {formatMonthYear(month, year)}
            </span>
            <button onClick={nextMonth} className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-subtle">
          <span className="text-income font-bold">↑ {formatCurrency(income)}</span>
          <span className="text-expense font-bold">↓ {formatCurrency(expense)}</span>
          <span className="text-text-secondary">{transactions.length} transações</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Pesquisar descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | "INCOME" | "EXPENSE")}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">Todas as carteiras</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <CardBlock>
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_120px_100px_110px_40px] gap-2 px-3 py-2 bg-card-hover rounded-lg mb-1">
            {["Data", "Descrição", "Categoria", "Carteira", "Valor", ""].map(h => (
              <div key={h} className="text-[9px] font-semibold uppercase tracking-widest text-muted">{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted">Carregando...</div>
          ) : transactions.length === 0 ? (
            <EmptyState icon="📋" title="Nenhuma transação encontrada" description="Tente ajustar os filtros ou mude o período." />
          ) : (
            transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`grid grid-cols-[80px_1fr_120px_100px_110px_40px] gap-2 px-3 py-3 rounded-lg items-center transition-colors hover:bg-card-hover ${
                  tx.type === "INCOME" ? "bg-[#13121a]" : ""
                } ${i < transactions.length - 1 ? "border-b border-border-subtle" : ""}`}
              >
                <div className="text-xs text-muted">{formatDate(tx.occurredAt).slice(0, 5)}</div>
                <div>
                  <p className="text-xs font-medium text-text truncate">
                    {tx.description || "Sem descrição"}
                  </p>
                  <p className="text-[10px] text-muted capitalize">{tx.type === "INCOME" ? "Receita" : "Despesa"}</p>
                </div>
                <div>
                  {tx.category ? (
                    <Tag variant="purple">{tx.category.name}</Tag>
                  ) : (
                    <span className="text-[10px] text-muted">—</span>
                  )}
                </div>
                <div className="text-xs text-subtle truncate">{wallets.find(w => w.id === tx.walletId)?.name ?? "—"}</div>
                <div className={`text-xs font-bold ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
                  {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                </div>
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deleting === tx.id}
                  className="text-muted hover:text-danger transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </CardBlock>
      </div>
    </div>
  );
}
