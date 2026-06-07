"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  description?: string;
  duration?: number; // ms
}

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  show: (variant: ToastVariant, title: string, options?: ToastOptions) => void;
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, options?: ToastOptions) => {
      const id = nextIdRef.current++;
      const duration = options?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [
        ...prev,
        { id, variant, title, description: options?.description, duration },
      ]);
    },
    [],
  );

  const value: ToastContextValue = {
    show,
    success: (title, opts) => show("success", title, opts),
    error: (title, opts) => show("error", title, opts),
    info: (title, opts) => show("info", title, opts),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

// ──────────────────────────────────────────────
// Viewport — stacked container at top-center
// ──────────────────────────────────────────────
interface ViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function ToastViewport({ toasts, onDismiss }: ViewportProps) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none safe-top"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Toast card
// ──────────────────────────────────────────────
interface CardProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: React.ReactNode; border: string; iconColor: string; barColor: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    border: "border-income/40",
    iconColor: "text-income",
    barColor: "bg-income",
  },
  error: {
    icon: <AlertCircle size={18} />,
    border: "border-expense/40",
    iconColor: "text-expense",
    barColor: "bg-expense",
  },
  info: {
    icon: <Info size={18} />,
    border: "border-accent/40",
    iconColor: "text-accent",
    barColor: "bg-accent",
  },
};

function ToastCard({ toast, onDismiss }: CardProps) {
  const styles = VARIANT_STYLES[toast.variant];
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  function handleClose() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }

  return (
    <div
      role="status"
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto relative overflow-hidden bg-card border ${styles.border} rounded-xl shadow-2xl px-3 py-3 flex items-start gap-3 ${
        exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
        {styles.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[11px] text-text-secondary leading-relaxed mt-1 break-words">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="touch-target -m-1 text-muted hover:text-text transition-colors cursor-pointer flex-shrink-0"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] ${styles.barColor} opacity-70`}
        style={{
          width: "100%",
          animation: `toast-progress ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
}
