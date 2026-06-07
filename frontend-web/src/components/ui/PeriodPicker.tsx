"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";

export type PeriodPreset =
  | "today"
  | "last7"
  | "last30"
  | "month"
  | "year"
  | "custom";

export interface PeriodValue {
  preset: PeriodPreset;
  /** ISO date string (yyyy-mm-dd) for the start (inclusive). */
  from: string;
  /** ISO date string (yyyy-mm-dd) for the end (exclusive). */
  to: string;
  /** Human label for the button. */
  label: string;
}

interface PeriodPickerProps {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "last7", label: "Últimos 7 dias" },
  { key: "last30", label: "Últimos 30 dias" },
  { key: "month", label: "Este mês" },
  { key: "year", label: "Este ano" },
  { key: "custom", label: "Personalizado" },
];

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildPeriod(preset: PeriodPreset, customFrom?: string, customTo?: string): PeriodValue {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  switch (preset) {
    case "today": {
      return {
        preset,
        from: toIso(today),
        to: toIso(tomorrow),
        label: "Hoje",
      };
    }
    case "last7": {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 6);
      return {
        preset,
        from: toIso(start),
        to: toIso(tomorrow),
        label: "Últimos 7 dias",
      };
    }
    case "last30": {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 29);
      return {
        preset,
        from: toIso(start),
        to: toIso(tomorrow),
        label: "Últimos 30 dias",
      };
    }
    case "month": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const monthName = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      return { preset, from: toIso(start), to: toIso(end), label: monthName };
    }
    case "year": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
      return { preset, from: toIso(start), to: toIso(end), label: String(now.getUTCFullYear()) };
    }
    case "custom": {
      const from = customFrom ?? toIso(today);
      const to = customTo ?? toIso(tomorrow);
      const fromBR = new Date(from).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      const toDate = new Date(to);
      toDate.setUTCDate(toDate.getUTCDate() - 1);
      const toBR = toDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      return { preset, from, to, label: `${fromBR} – ${toBR}` };
    }
  }
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function applyPreset(p: PeriodPreset) {
    if (p === "custom") return; // wait for user to choose dates
    onChange(buildPeriod(p));
    setOpen(false);
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    // Custom "to" is inclusive in UI -> exclusive for API
    const to = new Date(draftTo);
    to.setUTCDate(to.getUTCDate() + 1);
    onChange(buildPeriod("custom", draftFrom, toIso(to)));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors cursor-pointer capitalize"
      >
        <Calendar size={12} className="text-muted" />
        <span>{value.label}</span>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[280px] bg-card border border-border rounded-xl shadow-2xl z-50 p-2 animate-pop">
          <div className="flex flex-col">
            {PRESETS.map((p) => {
              const active = value.preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`text-left text-xs px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    active
                      ? "bg-accent-soft text-accent font-semibold"
                      : "text-text hover:bg-card-hover"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {value.preset === "custom" || draftFrom !== value.from || draftTo !== value.to ? null : null}

          <div className="border-t border-border-subtle mt-2 pt-2 px-1">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
              Range personalizado
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] text-muted">De</label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full bg-card-hover border border-border rounded-md px-2 py-1.5 text-xs text-text outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted">Até</label>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full bg-card-hover border border-border rounded-md px-2 py-1.5 text-xs text-text outline-none focus:border-accent transition-colors"
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="text-xs font-bold py-1.5 rounded-md bg-gradient-to-r from-[#e6c879] to-[#b8893f] text-[#1a1208] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
