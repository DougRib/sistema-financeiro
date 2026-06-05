"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Wallet as WalletIcon, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatShortDate,
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

interface MeResponse {
  ok: boolean;
  authenticated?: boolean;
  name?: string;
}

const PIE_COLORS = [
  "#e6c879",
  "#d4a857",
  "#b8893f",
  "#9e6b2a",
  "#7a4f1a",
  "#5b3a12",
  "#c89556",
  "#a87a3e",
];

export default function DashboardPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j: MeResponse) => {
        if (!cancelled && j.authenticated && j.name) setUserName(j.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Open new-transaction panel when arriving via ?new=1 (mobile FAB)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      queueMicrotask(() => {
        setShowForm(true);
        router.replace("/dashboard");
      });
    }
  }, [searchParams, router]);

  // Fetch summary + wallets whenever month/year/refresh changes
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/summary?month=${month}&year=${year}`).then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
    ])
      .then(([sumJson, wallJson]) => {
        if (cancelled) return;
        if (sumJson.ok) setSummary(sumJson);
        if (wallJson.ok) setWallets(wallJson.wallets);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, year, refreshKey]);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const income = summary ? Number(summary.income) : 0;
  const expense = summary ? Number(summary.expense) : 0;
  const balanceMonth = income - expense;

  // Daily chart: only show cumulative balance trend
  const dailyData = (summary?.dailyChart ?? []).map((d) => ({
    day: `${String(d.day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    value: Math.abs(d.value),
  }));

  const totalExpenseForPct = summary?.categoriesChart.reduce((s, c) => s + c.value, 0) ?? 0;
  const topCategories = (summary?.categoriesChart ?? [])
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const firstName = userName.split(" ")[0];

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="border-b border-border-subtle background-top  px-4 lg:px-6 py-3 lg:h-16 lg:py-0 flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-base lg:text-lg font-black text-text flex items-center gap-2">
            {firstName ? `Olá ${firstName}!` : "Olá!"}
            <span className="text-xl">👋</span>
          </h1>
          {firstName && (
            <p className="text-[11px] text-text-secondary line-clamp-1">
              Painel de finanças pessoais de {userName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <MonthPicker
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          <button
            onClick={() => setShowForm(true)}
            className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] hover:shadow-lg hover:shadow-accent/20 text-[#1a1208] text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Plus size={14} />
            Nova transação
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading && !summary ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted">Carregando...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Top row: Saldo Gold + Tendência + Categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* SALDO TOTAL — gold card */}
              <div className="card-gold p-4 lg:p-5 flex flex-col justify-between min-h-[180px] lg:min-h-[220px]">
                <div>
                  <p className="text-[10px] uppercase tracking-[2.5px] font-bold text-[#3d2810]/80">
                    Saldo Total
                  </p>
                  <p className="text-[24px] lg:text-[28px] font-black text-[#1a1208] mt-2 tracking-tight">
                    {formatCurrency(totalBalance)}
                  </p>
                  <p className="text-xs font-semibold text-[#1a4d28] mt-1 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {balanceMonth >= 0
                      ? `+${formatCurrency(balanceMonth)} este mês`
                      : `${formatCurrency(balanceMonth)} este mês`}
                  </p>
                </div>
                <button className="flex items-center gap-2 text-[#1a1208] text-xs font-semibold hover:gap-3 transition-all cursor-pointer touch-target -ml-1 self-start">
                  <span className="w-8 h-8 rounded-full bg-[#1a1208]/15 flex items-center justify-center">
                    <WalletIcon size={14} />
                  </span>
                  Ver detalhes
                </button>
              </div>

              {/* Tendência de gastos — area chart */}
              <div className="card-base card-lift p-5 min-h-[220px]">
                <p className="text-sm font-bold text-text mb-3">
                  Tendência de Gastos | <span className="text-text-secondary font-normal">{getMonthLabel(month, year)}</span>
                </p>
                {dailyData.length === 0 ? (
                  <div className="h-[150px] flex items-center justify-center">
                    <p className="text-xs text-muted">Sem dados neste mês</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="goldFlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e6c879" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#b8893f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 9, fill: "#5a6378" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#5a6378" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0d1730",
                          border: "1px solid rgba(212,175,106,0.3)",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        labelStyle={{ color: "#9ca0b0" }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => [formatCurrency(Number(v ?? 0)), "Total"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#e6c879"
                        strokeWidth={2.5}
                        fill="url(#goldFlow)"
                        dot={{ fill: "#e6c879", r: 3, strokeWidth: 2, stroke: "#0d1730" }}
                        activeDot={{ r: 5, fill: "#e6c879" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Categorias — donut */}
              <div className="card-base card-lift p-5 min-h-[220px]">
                <p className="text-sm font-bold text-text mb-3">
                  Categorias de Despesas
                </p>
                {topCategories.length === 0 ? (
                  <div className="h-[150px] flex items-center justify-center">
                    <p className="text-xs text-muted">Sem despesas neste mês</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-center">
                    <div className="relative mx-auto sm:mx-0 w-[140px]">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie
                            data={topCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={62}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {topCategories.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#0d1730",
                              border: "1px solid rgba(212,175,106,0.3)",
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            formatter={(v: unknown) => formatCurrency(Number(v))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] text-muted uppercase tracking-widest">Total</span>
                        <span className="text-xs font-bold text-text">
                          {formatCurrency(totalExpenseForPct)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {topCategories.map((c, i) => {
                        const pct = totalExpenseForPct > 0
                          ? Math.round((c.value / totalExpenseForPct) * 100)
                          : 0;
                        return (
                          <div key={c.name} className="flex items-center gap-2 text-[11px]">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="text-text-secondary truncate flex-1">{c.name}</span>
                            <span className="text-text font-semibold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary KPIs row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MiniKpi
                label="Receitas do mês"
                value={formatCurrency(income)}
                icon={<TrendingUp size={14} />}
                color="income"
              />
              <MiniKpi
                label="Despesas do mês"
                value={formatCurrency(expense)}
                icon={<TrendingDown size={14} />}
                color="expense"
              />
              <MiniKpi
                label="Saldo do mês"
                value={formatCurrency(balanceMonth)}
                icon={<WalletIcon size={14} />}
                color={balanceMonth >= 0 ? "accent" : "expense"}
              />
            </div>

            {/* Recent transactions */}
            <div className="card-base p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-text">Transações Recentes</p>
                <a
                  href="/transacoes"
                  className="text-[11px] text-accent hover:text-accent-hover transition-colors"
                >
                  Ver todas →
                </a>
              </div>

              {!summary?.transactions?.length ? (
                <EmptyState icon="💸" title="Nenhuma transação neste mês" />
              ) : (
                <>
                  {/* Desktop table header */}
                  <div className="hidden md:grid grid-cols-[70px_1fr_140px_120px_100px] gap-3 px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-muted">
                    <div>Data</div>
                    <div>Descrição</div>
                    <div>Categoria</div>
                    <div className="text-right">Valor</div>
                    <div>Status</div>
                  </div>

                  {summary.transactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-card-hover transition-colors rounded-lg"
                    >
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[70px_1fr_140px_120px_100px] gap-3 px-3 py-3 text-xs items-center">
                        <div className="text-muted">{formatShortDate(tx.occurredAt)}</div>
                        <div className="text-text font-medium truncate">
                          {tx.description || "Sem descrição"}
                        </div>
                        <div className="text-text-secondary truncate">
                          {tx.category?.name ?? "—"}
                        </div>
                        <div
                          className={`text-right font-bold ${
                            tx.type === "INCOME" ? "text-income" : "text-expense"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                        </div>
                        <div className="status-pill">
                          <span className="status-dot" style={{ background: "#5dd49f" }} />
                          <span className="text-text-secondary">
                            {tx.type === "INCOME" ? "Recebido" : "Pago"}
                          </span>
                        </div>
                      </div>

                      {/* Mobile card */}
                      <div className="md:hidden flex flex-col gap-1.5 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[10px] text-muted min-w-0">
                            <span>{formatShortDate(tx.occurredAt)}</span>
                            {tx.category && (
                              <>
                                <span>·</span>
                                <span className="truncate">{tx.category.name}</span>
                              </>
                            )}
                          </div>
                          <div className="status-pill flex-shrink-0">
                            <span className="status-dot" style={{ background: "#5dd49f" }} />
                            <span className="text-text-secondary">
                              {tx.type === "INCOME" ? "Recebido" : "Pago"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-text truncate flex-1">
                            {tx.description || "Sem descrição"}
                          </p>
                          <p
                            className={`text-sm font-bold flex-shrink-0 ${
                              tx.type === "INCOME" ? "text-income" : "text-expense"
                            }`}
                          >
                            {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

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

function getMonthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

// ──────────────────────────────────────────────
// Mini KPI inline component
// ──────────────────────────────────────────────
interface MiniKpiProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "income" | "expense" | "accent";
}

function MiniKpi({ label, value, icon, color }: MiniKpiProps) {
  const colorMap = {
    income: "text-income bg-income/10",
    expense: "text-expense bg-expense/10",
    accent: "text-accent bg-accent-soft",
  };
  return (
    <div className="card-base card-lift p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">{label}</p>
        <p className="text-base font-bold text-text mt-0.5">{value}</p>
      </div>
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm sidebar border-l border-border z-50 flex flex-col animate-pop">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-bold text-text">Nova transação</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  type === t
                    ? t === "INCOME"
                      ? "bg-income text-[#0a1224]"
                      : "bg-expense text-white"
                    : "bg-card border border-border text-muted hover:text-text"
                }`}
              >
                {t === "INCOME" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          <Field label="Valor (R$)">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </Field>

          <Field label="Data">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </Field>

          <Field label="Descrição">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </Field>

          <Field label="Categoria">
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
          </Field>

          <Field label="Carteira">
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
          </Field>

          {error && (
            <p className="text-xs text-danger bg-expense/10 border border-expense/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border-subtle">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer hover:shadow-lg hover:shadow-accent/20"
          >
            {saving ? "Salvando..." : "Salvar transação"}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
