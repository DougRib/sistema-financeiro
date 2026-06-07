"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Target, PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

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
  const toast = useToast();

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
    if (!name.trim() || !target) { toast.error("Nome e valor alvo são obrigatórios"); return; }
    const targetNum = parseFloat(target.replace(",", "."));
    if (isNaN(targetNum) || targetNum <= 0) { toast.error("Valor alvo inválido"); return; }
    const currentNum = parseFloat(current.replace(",", ".")) || 0;
    setSaving(true);
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
      if (!j.ok) {
        toast.error("Não foi possível criar a meta", { description: j.error });
        return;
      }
      toast.success("Meta criada");
      setName(""); setEmoji("🎯"); setTarget(""); setCurrent("0"); setDeadline("");
      setShowForm(false);
      fetchGoals();
    } catch {
      toast.error("Erro de rede ao criar meta");
    } finally { setSaving(false); }
  }

  async function handleDeposit() {
    if (!depositGoalId) return;
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    setDepositing(true);
    try {
      const goal = goals.find(g => g.id === depositGoalId)!;
      const r = await fetch(`/api/goals/${depositGoalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: goal.currentAmount + amount }),
      });
      const j = await r.json().catch(() => ({ ok: r.ok }));
      if (!j.ok) {
        toast.error("Não foi possível depositar", { description: j.error });
        return;
      }
      toast.success(`+${formatCurrency(amount)} adicionado a ${goal.name}`);
      setDepositGoalId(null);
      setDepositAmount("");
      fetchGoals();
    } catch {
      toast.error("Erro de rede ao depositar");
    } finally { setDepositing(false); }
  }

  async function handleDelete(id: number) {
    try {
      const r = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({ ok: r.ok }));
      if (j.ok) {
        setGoals(gs => gs.filter(g => g.id !== id));
        toast.success("Meta excluída");
      } else {
        toast.error("Não foi possível excluir", { description: j.error });
      }
    } catch {
      toast.error("Erro de rede ao excluir meta");
    }
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
            Icon={Target}
            title="Nenhuma meta criada"
            description="Defina objetivos financeiros e acompanhe seu progresso com barras visuais."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer hover:shadow-md hover:shadow-accent/20 transition-all"
              >
                <Plus size={13} /> Criar primeira meta
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

          </div>
        )}
      </div>

      {/* New goal modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova meta"
        description="Defina um objetivo financeiro e acompanhe o progresso"
        icon={<Target size={18} />}
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
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-xs font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer hover:shadow-md hover:shadow-accent/20"
            >
              {saving ? "Criando..." : "Criar meta"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Emoji</label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎯"
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-lg text-center text-text outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Nome da meta</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reserva de emergência"
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Valor alvo (R$)</label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="10.000,00"
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Já guardado (R$)</label>
              <input
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0,00"
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Prazo (opcional)</label>
            <input
              type="month"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      </Modal>

      {/* Deposit modal */}
      <Modal
        open={depositGoalId !== null}
        onClose={() => setDepositGoalId(null)}
        title="Adicionar valor à meta"
        description="Quanto você quer guardar agora?"
        icon={<PiggyBank size={18} />}
        size="sm"
        footer={
          <button
            onClick={handleDeposit}
            disabled={depositing}
            className="w-full bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer hover:shadow-md hover:shadow-accent/20"
          >
            {depositing ? "Salvando..." : "Confirmar depósito"}
          </button>
        }
      >
        <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-1.5 block">Valor (R$)</label>
        <input
          autoFocus
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDeposit()}
          placeholder="0,00"
          className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
        />
      </Modal>
    </div>
  );
}
