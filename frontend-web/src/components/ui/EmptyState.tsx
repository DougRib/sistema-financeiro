"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Lucide icon (preferred) — renders inside a golden chip */
  Icon?: LucideIcon;
  /** Emoji fallback when no Icon is provided */
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Visual variant */
  variant?: "default" | "compact";
}

export function EmptyState({
  Icon,
  icon = "○",
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        {Icon ? (
          <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent">
            <Icon size={18} />
          </div>
        ) : (
          <div className="text-2xl opacity-40">{icon}</div>
        )}
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && (
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-14 px-6 gap-4 text-center overflow-hidden">
      {/* Decorative gold glow behind the icon */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,106,0.18) 0%, transparent 65%)",
          filter: "blur(8px)",
          top: 0,
        }}
      />

      {/* Icon chip */}
      <div className="relative">
        {Icon ? (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e6c879]/20 to-[#b8893f]/10 border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
            <Icon size={28} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e6c879]/20 to-[#b8893f]/10 border border-accent/30 flex items-center justify-center text-3xl">
            {icon}
          </div>
        )}
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent shadow-md"
          style={{ boxShadow: "0 0 12px rgba(212,175,106,0.7)" }}
        />
      </div>

      <div className="relative flex flex-col gap-1.5 max-w-sm">
        <p className="text-base font-bold text-text">{title}</p>
        {description && (
          <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>

      {action && <div className="relative mt-1">{action}</div>}
    </div>
  );
}
