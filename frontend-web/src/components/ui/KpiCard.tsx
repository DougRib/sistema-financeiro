"use client";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "income" | "expense" | "accent";
}

export function KpiCard({ label, value, trend, trendUp, variant = "default" }: KpiCardProps) {
  const valueColor =
    variant === "income" ? "text-income" :
    variant === "expense" ? "text-expense" :
    variant === "accent" ? "text-accent" :
    "text-text";

  const accentBorder = variant === "accent" ? "border-l-2 border-l-accent" : "";

  return (
    <div className={`bg-card rounded-xl p-4 border border-border ${accentBorder} hover:border-border-subtle transition-colors`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trendUp ? "text-income" : "text-expense"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}
