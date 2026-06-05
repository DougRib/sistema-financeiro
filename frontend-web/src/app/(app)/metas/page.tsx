"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

interface Goal {
  id: number;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  pct: number;
}

const GRADIENT_BY_PCT = (pct: number) =>
  pct >= 100
    ? "from-income to-emerald-400"
    : pct >= 60
    ? "from-accent to-violet-400"
    : "from-blue-500 to-cyan-400";

function monthsUntil(deadline: string | null): string | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const months = Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return "Prazo expirado";
  return `${months} ${months === 1 ? "mês" : "meses"} restantes`;
}

function monthlySaving(goal: Goal): number | null {
  if (!goal.deadline) return null;
  const months = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return null;
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return 0;
  return remaining / months;
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deposit modal
  const [depositGoalId, setDepositGoalId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  async function fetchGoals() {
    setLoading(true);
    try {
      const r = await fetch("/api/goals");
      const j = await r.json();
      if (j.ok) setGoals(j.goals);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/goals")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setGoals(j.goals);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!name.trim() || !target) { setError("Nome e valor alvo são obrigatórios"); return; }
    const targetNum = parseFloat(target.replace(",", "."));
    if (isNaN(targetNum) || targetNum <= 0) { setError("Valor alvo inválido"); return; }
    const currentNum = parseFloat(current.replace(",", ".")) || 0;
    setSaving(true); setError(null);
    try {
      const r = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji: emoji || "🎯",
          targetAmount: targetNum,
          currentAmount: currentNum,
          deadline: deadline ? new Date(deadline + "T00:00:00.000Z").toISOString() : undefined,
        }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Erro ao criar"); return; }
      setName(""); setEmoji("🎯"); setTarget(""); setCurrent("0"); setDeadline("");
      setShowForm(false);
      fetchGoals();
    } finally { setSaving(false); }
  }

  async function handleDeposit() {
    if (!depositGoalId) return;
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;
    setDepositing(true);
    try {
      const goal = goals.find(g => g.id === depositGoalId)!;
      await fetch(`/api/goals/${depositGoalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: goal.currentAmount + amount }),
      });
      setDepositGoalId(null);
      setDepositAmount("");
      fetchGoals();
    } finally { setDepositing(false); }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals(gs => gs.filter(g => g.id !== id));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-text">Metas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-3 py-2.5 rounded-lg transition-all cursor-pointer hover:shadow-md hover:shadow-accent/20"
        >
          <Plus size={14} /> Nova meta
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted">Carregando...</div>
        ) : goals.length === 0 && !showForm ? (
          <EmptyState
            icon="🎯"
            title="Nenhuma meta criada"
            description="Defina objetivos financeiros e acompanhe seu progresso."
            action={
              <button onClick={() => setShowForm(true)} className="text-xs text-accent hover:underline cursor-pointer">
                Criar primeira meta
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const monthly = monthlySaving(goal);
              const timeLeft = monthsUntil(goal.deadline);
              return (
                <div key={goal.id} className="bg-card border border-border rounded-xl p-5 group hover:border-border-subtle transition-colors relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center text-xl">
                        {goal.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{goal.name}</p>
                        {goal.deadline && (
                          <p className="text-[10px] text-muted mt-0.5">{timeLeft}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-muted hover:text-expense transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-muted">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-xs font-bold text-text">{goal.pct}%</span>
                    </div>
                    <div className="h-2 bg-card-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${GRADIENT_BY_PCT(goal.pct)} transition-all`}
                        style={{ width: `${Math.min(goal.pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1.5">
                      Meta: {formatCurrency(goal.targetAmount)}
                      {goal.pct >= 100 && <span className="text-income ml-2">✓ Atingida!</span>}
                    </p>
                  </div>

                  {monthly !== null && monthly > 0 && (
                    <p className="text-[10px] text-accent mb-3">
                      Poupar {formatCurrency(monthly)}/mês para atingir no prazo
                    </p>
                  )}

                  <button
                    onClick={() => { setDepositGoalId(goal.id); setDepositAmount(""); }}
                    className="w-full py-2 bg-card-hover hover:bg-accent hover:text-white border border-border hover:border-accent rounded-lg text-xs font-semibold text-muted transition-colors cursor-pointer"
                  >
                    + Adicionar valor
                  </button>
                </div>
              );
            })}

            {/* Create card */}
            {showForm && (
              <div className="bg-card border border-accent rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-accent">Nova meta</p>
                  <button onClick={() => { setShowForm(false); setError(null); }} className="text-muted hover:text-text cursor-pointer"><X size={14} /></button>
                </div>
                {[
                  { label: "Emoji", value: emoji, onChange: setEmoji, placeholder: "🎯" },
                  { label: "Nome", value: name, onChange: setName, placeholder: "Ex: Comprar carro" },
                  { label: "Valor alvo (R$)", value: target, onChange: setTarget, placeholder: "10.000,00" },
                  { label: "Já guardado (R$)", value: current, onChange: setCurrent, placeholder: "0,00" },
                ].map(({ label, value, onChange, placeholder }) => (
                  <div key={label}>
                    <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">{label}</label>
                    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                      className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Prazo (opcional)</label>
                  <input type="month" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors" />
                </div>
                {error && <p className="text-[10px] text-expense">{error}</p>}
                <button onClick={handleCreate} disabled={saving}
                  className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                  {saving ? "..." : "Criar meta"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deposit modal */}
      {depositGoalId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDepositGoalId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-text">Adicionar valor à meta</p>
                <button onClick={() => setDepositGoalId(null)} className="text-muted hover:text-text cursor-pointer"><X size={14} /></button>
              </div>
              <label className="text-[9px] uppercase tracking-widest text-muted mb-1.5 block">Valor (R$)</label>
              <input
                autoFocus
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleDeposit()}
                placeholder="0,00"
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors mb-4"
              />
              <button
                onClick={handleDeposit}
                disabled={depositing}
                className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {depositing ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
