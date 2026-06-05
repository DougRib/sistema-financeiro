"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { KpiCard } from "@/components/ui/KpiCard";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatShortDate,
  formatMonthYear,
  currentMonth,
} from "@/lib/format";

interface SummaryData {
  income: number;
  expense: number;
  balance: number;
  categoriesChart: { name: string; value: number }[];
  dailyChart: { day: number; value: number }[];
  transactions: {
    id: number;
    type: string;
    amount: number;
    occurredAt: string;
    description: string | null;
    walletId: number;
    category: { id: number; name: string } | null;
  }[];
}

interface Wallet {
  id: number;
  name: string;
  balance: number;
  type: string;
}

export default function DashboardPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, wallRes] = await Promise.all([
        fetch(`/api/summary?month=${month}&year=${year}`),
        fetch("/api/wallets"),
      ]);
      const sumJson = await sumRes.json();
      const wallJson = await wallRes.json();
      if (sumJson.ok) setSummary(sumJson);
      if (wallJson.ok) setWallets(wallJson.wallets);
    } finally {
      setLoading(false);
    }
  }, [month, year, refreshKey]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const income = summary ? Number(summary.income) : 0;
  const expense = summary ? Number(summary.expense) : 0;
  const balance = income - expense;

  // Build daily chart data
  const dailyData = (summary?.dailyChart ?? []).map((d) => ({
    day: `${String(d.day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    value: d.value,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-border-subtle sidebar flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-text">Dashboard</h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-1">
            <button
              onClick={prevMonth}
              className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-text-secondary px-1 min-w-[100px] text-center">
              {formatMonthYear(month, year)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Nova transação
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && !summary && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted">Carregando...</p>
          </div>
        )}

        {!loading || summary ? (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <KpiCard
                label="Receitas"
                value={formatCurrency(income)}
                variant="income"
              />
              <KpiCard
                label="Despesas"
                value={formatCurrency(expense)}
                variant="expense"
              />
              <KpiCard
                label="Saldo do mês"
                value={formatCurrency(balance)}
                variant={balance >= 0 ? "accent" : "expense"}
              />
              <KpiCard
                label="Saldo Total"
                value={formatCurrency(totalBalance)}
                variant="accent"
              />
            </div>

            {/* Charts + Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Daily flow chart */}
              <CardBlock title="Fluxo diário do mês">
                {dailyData.length === 0 ? (
                  <EmptyState icon="📊" title="Sem transações neste mês" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={dailyData}
                      margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "#71717a" }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#71717a" }}
                        tickFormatter={(v: number) => `R$${Math.abs(v)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111113",
                          border: "1px solid #27272a",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => [
                          formatCurrency(Number(v ?? 0)),
                          "Saldo",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardBlock>

              {/* Recent transactions */}
              <CardBlock title="Últimas transações">
                {!summary?.transactions?.length ? (
                  <EmptyState icon="💸" title="Nenhuma transação neste mês" />
                ) : (
                  <div className="flex flex-col">
                    {summary.transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center text-sm flex-shrink-0">
                          {tx.type === "INCOME" ? "💰" : "💸"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text truncate">
                            {tx.description ||
                              tx.category?.name ||
                              "Sem descrição"}
                          </p>
                          <p className="text-[10px] text-muted">
                            {tx.category?.name ?? "Sem categoria"} ·{" "}
                            {formatShortDate(tx.occurredAt)}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold flex-shrink-0 ${
                            tx.type === "INCOME"
                              ? "text-income"
                              : "text-expense"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}{" "}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBlock>

              {/* Category breakdown */}
              {summary?.categoriesChart &&
                summary.categoriesChart.length > 0 && (
                  <CardBlock
                    title="Gastos por categoria"
                    className="lg:col-span-2"
                  >
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={summary.categoriesChart}
                        layout="vertical"
                        margin={{ left: 40, right: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          tickFormatter={(v: number) => `R$${v}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#a1a1aa" }}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#111113",
                            border: "1px solid #27272a",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any) => [
                            formatCurrency(Number(v ?? 0)),
                            "Total",
                          ]}
                        />
                        <Bar
                          dataKey="value"
                          fill="#8b5cf6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBlock>
                )}
            </div>
          </>
        ) : null}
      </div>

      {/* New Transaction Inline Modal */}
      {showForm && (
        <NewTransactionPanel
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Inline new-transaction panel (slide-in from right)
// ──────────────────────────────────────────────
interface NewTransactionPanelProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewTransactionPanel({ onClose, onCreated }: NewTransactionPanelProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [wallets, setWallets] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
    ]).then(([cats, walls]) => {
      if (cats.ok) setCategories(cats.categorias);
      if (walls.ok) {
        setWallets(walls.wallets);
        if (walls.wallets.length > 0) setWalletId(String(walls.wallets[0].id));
      }
    });
  }, []);

  async function handleSave() {
    if (!amount || !date || !walletId) {
      setError("Preencha valor, data e carteira");
      return;
    }
    const amountNum = parseFloat(amount.replace(",", "."));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Valor inválido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amountNum,
          occurredAt: new Date(date + "T12:00:00.000Z").toISOString(),
          description: description || undefined,
          categoryId: categoryId ? Number(categoryId) : null,
          walletId: Number(walletId),
        }),
      });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error || "Erro ao salvar");
        return;
      }
      onCreated();
    } catch {
      setError("Erro de rede");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-sidebar border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text">Nova transação</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  type === t
                    ? t === "INCOME"
                      ? "bg-income text-[#09090b]"
                      : "bg-expense text-[#09090b]"
                    : "bg-card border border-border text-muted hover:text-text"
                }`}
              >
                {t === "INCOME" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
              Valor (R$)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Carteira */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
              Carteira
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-danger bg-[#f43f5e10] border border-[#f43f5e30] rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Salvando..." : "Salvar transação"}
          </button>
        </div>
      </div>
    </>
  );
}
