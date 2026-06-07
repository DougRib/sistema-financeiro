"use client";

import { formatCurrency } from "@/lib/format";
import { maskValue, usePrivacy } from "./PrivacyContext";

interface MoneyProps {
  value: number | string;
  /** Optional prefix like "+" for income */
  sign?: "+" | "-";
  /** Override formatted display (e.g. already formatted by caller) */
  formatted?: string;
  className?: string;
}

/**
 * Renders a currency value that respects privacy mode.
 * Replaces digits with bullets when hidden, keeping the R$ prefix.
 */
export function Money({ value, sign, formatted, className }: MoneyProps) {
  const { hidden } = usePrivacy();
  const base = formatted ?? formatCurrency(value);
  const withSign = sign ? `${sign} ${base}` : base;
  const display = maskValue(withSign, hidden);
  return <span className={className}>{display}</span>;
}
