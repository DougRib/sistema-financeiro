"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Wallet,
  Upload,
  Tag,
  Target,
  CalendarDays,
  Sparkles,
  Settings,
  X,
} from "lucide-react";

interface MoreItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const ITEMS: MoreItem[] = [
  { label: "Carteiras", href: "/carteiras", icon: <Wallet size={20} /> },
  { label: "Transferências", href: "/transferencias", icon: <ArrowLeftRight size={20} /> },
  { label: "Categorias", href: "/categorias", icon: <Tag size={20} /> },
  { label: "Orçamentos", href: "/orcamentos", icon: <Target size={20} /> },
  { label: "Metas", href: "/metas", icon: <Target size={20} /> },
  { label: "Agenda", href: "/agenda", icon: <CalendarDays size={20} /> },
  { label: "Importar", href: "/importar", icon: <Upload size={20} /> },
  { label: "Insights IA", href: "/insights", icon: <Sparkles size={20} />, badge: "IA" },
  { label: "Configurações", href: "/configuracoes", icon: <Settings size={20} /> },
];

interface MoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative mobile-sheet animate-slide-up safe-bottom max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-base font-bold text-text">Menu</h2>
          <button
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full bg-card-hover text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drag handle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/15 pointer-events-none" />

        <div className="grid grid-cols-3 gap-2 px-4 pb-6">
          {ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all min-h-[88px] ${
                  active
                    ? "border-accent/50 bg-gradient-to-br from-[#e6c879]/20 to-[#b8893f]/5 text-accent"
                    : "border-border bg-card text-text-secondary active:scale-95"
                }`}
              >
                <span className={active ? "text-accent" : "text-text-secondary"}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-[#1a1208]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
