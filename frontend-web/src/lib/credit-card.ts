/**
 * Cálculo de período de fatura de cartão de crédito.
 *
 * Lógica:
 *   - Fatura "fecha" no closingDay (ex: dia 25).
 *   - Despesa feita em D vai pra fatura cujo fechamento é o próximo closingDay >= D.
 *   - A fatura vence no dueDay do mês seguinte ao fechamento (ex: fecha 25/jan, vence 10/fev).
 *
 * Para uma despesa em `txDate` num cartão com `closingDay`:
 *   - Se txDate.day <= closingDay → fatura fecha no closingDay deste mês.
 *   - Senão → fatura fecha no closingDay do próximo mês.
 */

function clampDay(day: number, year: number, month: number): number {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(day, last);
}

export interface InvoicePeriod {
  /** Data de fechamento (inclusive). */
  closing: Date;
  /** Data de vencimento. */
  due: Date;
  /** Início do período (dia seguinte ao fechamento anterior). */
  start: Date;
  /** Label "Out/2025" para UI. */
  label: string;
}

export function invoicePeriodForDate(
  txDate: Date,
  closingDay: number,
  dueDay: number,
): InvoicePeriod {
  const y = txDate.getUTCFullYear();
  const m = txDate.getUTCMonth();
  const d = txDate.getUTCDate();

  // Mês/ano do fechamento dessa fatura
  let closingY = y;
  let closingM = m;
  if (d > closingDay) {
    closingM++;
    if (closingM > 11) {
      closingM = 0;
      closingY++;
    }
  }

  const closingActualDay = clampDay(closingDay, closingY, closingM);
  const closing = new Date(Date.UTC(closingY, closingM, closingActualDay));

  // Início = dia seguinte ao fechamento anterior
  let prevClosingY = closingY;
  let prevClosingM = closingM - 1;
  if (prevClosingM < 0) {
    prevClosingM = 11;
    prevClosingY--;
  }
  const prevClosingDay = clampDay(closingDay, prevClosingY, prevClosingM);
  const start = new Date(Date.UTC(prevClosingY, prevClosingM, prevClosingDay + 1));

  // Vencimento = próximo mês após fechamento
  let dueY = closingY;
  let dueM = closingM + 1;
  if (dueM > 11) {
    dueM = 0;
    dueY++;
  }
  const dueActualDay = clampDay(dueDay, dueY, dueM);
  const due = new Date(Date.UTC(dueY, dueM, dueActualDay));

  const label = closing.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

  return { closing, due, start, label };
}
