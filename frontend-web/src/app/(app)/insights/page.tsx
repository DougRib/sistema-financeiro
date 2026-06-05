"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

type Severity = "info" | "good" | "warn" | "danger";

interface Insight {
  id: string;
  severity: Severity;
  icon: string;
  title: string;
  body: string;
  metric?: string;
}

interface InsightsResponse {
  ok: boolean;
  insights: Insight[];
  meta: {
    currentMonth: { income: number; expense: number };
    previousMonth: { income: number; expense: number };
  };
}

const SEVERITY_STYLES: Record<Severity, { border: string; badge: string; badgeText: string }> = {
  good: {
    border: "border-l-income",
    badge: "bg-income/15",
    badgeText: "text-income",
  },
  warn: {
    border: "border-l-yellow-500",
    badge: "bg-yellow-500/15",
    badgeText: "text-yellow-400",
  },
  danger: {
    border: "border-l-expense",
    badge: "bg-expense/15",
    badgeText: "text-expense",
  },
  info: {
    border: "border-l-accent",
    badge: "bg-accent/15",
    badgeText: "text-accent",
  },
};

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const r = await fetch("/api/insights");
      const j: InsightsResponse = await r.json();
      if (j.ok) setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((j: InsightsResponse) => {
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
  }, []);

  const currentMonthLabel = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-accent flex-shrink-0" />
          <h1 className="text-base font-bold text-text truncate">Insights IA</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent uppercase tracking-widest flex-shrink-0">
            beta
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="touch-target flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-40 flex-shrink-0"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Recalcular</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4 max-w-4xl">
          {/* Hero */}
          <div className="bg-gradient-to-br from-accent/15 via-card to-card border border-accent/20 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
              Análise de {currentMonthLabel}
            </p>
            <p className="text-sm text-text">
              Padrões detectados a partir das suas transações, comparando com o mês anterior e seus
              orçamentos ativos.
            </p>
            {data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted">Receitas</p>
                  <p className="text-sm font-bold text-income">
                    {formatCurrency(data.meta.currentMonth.income)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted">Despesas</p>
                  <p className="text-sm font-bold text-expense">
                    {formatCurrency(data.meta.currentMonth.expense)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Receitas mês anterior
                  </p>
                  <p className="text-sm font-bold text-text-secondary">
                    {formatCurrency(data.meta.previousMonth.income)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Despesas mês anterior
                  </p>
                  <p className="text-sm font-bold text-text-secondary">
                    {formatCurrency(data.meta.previousMonth.expense)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <CardBlock>
              <div className="py-8 text-center text-sm text-muted">Analisando suas finanças...</div>
            </CardBlock>
          ) : !data || data.insights.length === 0 ? (
            <CardBlock>
              <EmptyState
                icon="✨"
                title="Sem insights por enquanto"
                description="Registre mais transações para obter análises."
              />
            </CardBlock>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.insights.map((ins) => {
                const styles = SEVERITY_STYLES[ins.severity];
                return (
                  <div
                    key={ins.id}
                    className={`bg-card border border-border border-l-4 ${styles.border} rounded-xl p-4`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{ins.icon}</span>
                        <p className="text-sm font-bold text-text">{ins.title}</p>
                      </div>
                      {ins.metric && (
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md ${styles.badge} ${styles.badgeText} flex-shrink-0`}
                        >
                          {ins.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{ins.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-muted text-center mt-2">
            Insights baseados em heurísticas locais — não substituem aconselhamento financeiro
            profissional.
          </p>
        </div>
      </div>
    </div>
  );
}
