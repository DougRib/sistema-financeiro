"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatMonthYear, currentMonth } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface BudgetItem {
  id: number;
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  pct: number;
}

interface Category {
  id: number;
  name: string;
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-expense";
  if (pct >= 90) return "bg-orange-500";
  if (pct >= 60) return "bg-yellow-500";
  return "bg-income";
}

export default function OrcamentosPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [totalLimit, setTotalLimit] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function fetchBudgets() {
    setLoading(true);
    try {
      const r = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const j = await r.json();
      if (j.ok) {
        setBudgets(j.budgets);
        setTotalLimit(j.totalLimit);
        setTotalSpent(j.totalSpent);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/budgets?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setBudgets(j.budgets);
          setTotalLimit(j.totalLimit);
          setTotalSpent(j.totalSpent);
        }
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
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setCategories(j.categorias);
          if (j.categorias.length > 0) setCategoryId(String(j.categorias[0].id));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!categoryId || !limit) { toast.error("Preencha todos os campos"); return; }
    const limitNum = parseFloat(limit.replace(",", "."));
    if (isNaN(limitNum) || limitNum <= 0) { toast.error("Limite inválido"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: Number(categoryId), month, year, limit: limitNum }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível salvar o orçamento", { description: j.error });
        return;
      }
      toast.success("Orçamento definido");
      setLimit(""); setShowForm(false);
      fetchBudgets();
    } catch {
      toast.error("Erro de rede ao salvar orçamento");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      const r = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({ ok: r.ok }));
      if (j.ok) {
        toast.success("Orçamento removido");
      } else {
        toast.error("Não foi possível remover", { description: j.error });
      }
      fetchBudgets();
    } catch {
      toast.error("Erro de rede ao remover orçamento");
    }
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 lg:px-6 py-3 lg:h-14 lg:py-0 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-base font-bold text-text">Orçamentos</h1>
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
          <Plus size={14} /> Definir orçamento
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Budget list */}
          <div className="lg:col-span-2">
            <CardBlock title="Progresso por categoria">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted">Carregando...</div>
              ) : budgets.length === 0 ? (
                <EmptyState
                  Icon={Target}
                  title="Nenhum orçamento definido"
                  description="Defina limites por categoria para controlar seus gastos."
                  action={
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer hover:shadow-md hover:shadow-accent/20 transition-all"
                    >
                      <Plus size={13} /> Definir primeiro orçamento
                    </button>
                  }
                />
              ) : (
                <div className="flex flex-col gap-5">
                  {budgets.map(b => (
                    <div key={b.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text">{b.categoryName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">
                            {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                          </span>
                          <span className={`text-xs font-bold ${b.pct >= 100 ? "text-expense" : b.pct >= 90 ? "text-orange-400" : "text-muted"}`}>
                            {b.pct}%
                          </span>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-muted hover:text-expense transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 bg-card-hover rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(b.pct)}`}
                          style={{ width: `${Math.min(b.pct, 100)}%` }}
                        />
                      </div>
                      {b.pct >= 100 && (
                        <p className="text-[10px] text-expense mt-1">⚠ Limite excedido em {formatCurrency(b.spent - b.limit)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBlock>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <CardBlock title="Resumo geral">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total orçado</span>
                  <span className="font-bold text-text">{formatCurrency(totalLimit)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total gasto</span>
                  <span className={`font-bold ${overallPct >= 90 ? "text-expense" : "text-text"}`}>{formatCurrency(totalSpent)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Saldo restante</span>
                  <span className="font-bold text-accent">{formatCurrency(Math.max(0, totalLimit - totalSpent))}</span>
                </div>
                {totalLimit > 0 && (
                  <div className="mt-1">
                    <div className="h-1.5 bg-card-hover rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progressColor(overallPct)}`} style={{ width: `${Math.min(overallPct, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-muted mt-1 text-right">{overallPct}% utilizado</p>
                  </div>
                )}
              </div>
            </CardBlock>

          </div>
        </div>
      </div>

      {/* New budget modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Novo orçamento"
        description="Defina um limite mensal para uma categoria"
        icon={<Target size={18} />}
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
              {saving ? "Salvando..." : "Salvar orçamento"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors cursor-pointer">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Limite mensal (R$)</label>
            <input
              autoFocus
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>
          <p className="text-[10px] text-muted">
            Você será avisado quando atingir 80% e 100% do limite.
          </p>
        </div>
      </Modal>
    </div>
  );
}
