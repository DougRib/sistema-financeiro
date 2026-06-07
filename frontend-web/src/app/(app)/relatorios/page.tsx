"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { KpiCard } from "@/components/ui/KpiCard";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

const PIE_COLORS = [
  "#8b5cf6",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#a855f7",
];

interface MonthData {
  month: number;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface AnnualData {
  year: number;
  months: MonthData[];
  categoriesChart: CategoryData[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  savingsRate: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold text-text mb-1">{label}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          className={
            p.name === "income"
              ? "text-income"
              : p.name === "expense"
                ? "text-expense"
                : "text-accent"
          }
        >
          {p.name === "income"
            ? "Receitas"
            : p.name === "expense"
              ? "Despesas"
              : "Saldo"}
          : {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function RelatoriosPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AnnualData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/annual?year=${year}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setData(j);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const hasData = data && (data.totalIncome > 0 || data.totalExpense > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-text">Relatórios</h1>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="touch-target p-1.5 text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-text-secondary px-2">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="touch-target p-1.5 text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Carregando...</div>
        ) : !hasData ? (
          <EmptyState
            Icon={BarChart3}
            title="Sem dados para este ano"
            description="Registre transações para que possamos gerar relatórios anuais."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Receitas anuais"
                value={formatCurrency(data!.totalIncome)}
                variant="income"
              />
              <KpiCard
                label="Despesas anuais"
                value={formatCurrency(data!.totalExpense)}
                variant="expense"
              />
              <KpiCard
                label="Saldo anual"
                value={formatCurrency(data!.totalBalance)}
                variant={data!.totalBalance >= 0 ? "accent" : "expense"}
              />
              <KpiCard
                label="Taxa de poupança"
                value={`${data!.savingsRate}%`}
                variant="accent"
              />
            </div>

            {/* Monthly bar chart */}
            <CardBlock title="Receitas vs Despesas por mês">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data!.months}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(v) => (v === "income" ? "Receitas" : "Despesas")}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} name="income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} name="expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardBlock>

            {/* Balance line chart */}
            <CardBlock title="Evolução do saldo mensal">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={data!.months}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 3 }}
                    name="balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBlock>

            {/* Categories */}
            {data!.categoriesChart.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CardBlock title="Despesas por categoria">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data!.categoriesChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data!.categoriesChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: unknown) => formatCurrency(v as number)}
                        contentStyle={{
                          background: "#111827",
                          border: "1px solid #404040",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardBlock>

                <CardBlock title="Top categorias (despesas)">
                  <div className="flex flex-col gap-2">
                    {data!.categoriesChart.map((c, i) => {
                      const pct =
                        data!.totalExpense > 0
                          ? Math.round((c.value / data!.totalExpense) * 100)
                          : 0;
                      return (
                        <div key={c.name}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-text">{c.name}</span>
                            <span className="text-xs text-muted">
                              {formatCurrency(c.value)} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-card-hover rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBlock>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
