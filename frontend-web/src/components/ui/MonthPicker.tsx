"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const FULL_MONTH = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface MonthPickerProps {
  month: number; // 1..12
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors cursor-pointer"
      >
        <span className="capitalize">{FULL_MONTH[month - 1]} {year}</span>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <MonthPickerPanel
          month={month}
          year={year}
          onPick={(m, y) => {
            onChange(m, y);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface PanelProps {
  month: number;
  year: number;
  onPick: (month: number, year: number) => void;
}

function MonthPickerPanel({ month, year, onPick }: PanelProps) {
  // Local draftYear, initialized fresh each time the panel mounts.
  const [draftYear, setDraftYear] = useState(year);

  const now = new Date();
  const isCurrentMonth = (m: number) =>
    draftYear === now.getFullYear() && m === now.getMonth() + 1;

  return (
    <div className="absolute right-0 mt-2 w-[280px] bg-card border border-border rounded-xl shadow-2xl z-50 p-3 animate-pop">
      {/* Year header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
        <button
          onClick={() => setDraftYear((y) => y - 1)}
          className="p-1.5 rounded-md hover:bg-card-hover text-muted hover:text-text transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-bold text-text">{draftYear}</span>
        <button
          onClick={() => setDraftYear((y) => y + 1)}
          className="p-1.5 rounded-md hover:bg-card-hover text-muted hover:text-text transition-colors cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1;
          const active = m === month && draftYear === year;
          const current = isCurrentMonth(m);
          return (
            <button
              key={m}
              onClick={() => onPick(m, draftYear)}
              className={`text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer ${
                active
                  ? "bg-gradient-to-br from-[#e6c879] to-[#b8893f] text-[#1a1208] shadow-md"
                  : current
                    ? "bg-card-hover text-accent border border-accent/30"
                    : "text-text-secondary hover:bg-card-hover hover:text-text"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border-subtle">
        <button
          onClick={() => onPick(now.getMonth() + 1, now.getFullYear())}
          className="flex-1 text-[11px] font-semibold py-1.5 rounded-md bg-card-hover text-text hover:bg-accent/20 hover:text-accent transition-colors cursor-pointer"
        >
          Hoje
        </button>
      </div>
    </div>
  );
}
