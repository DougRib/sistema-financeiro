"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** sm | md | lg controls max-width */
  size?: "sm" | "md" | "lg";
  /** Show close button (default true) */
  showClose?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  showClose = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setMounted(true);
        // second microtask to let the mount paint before adding opacity
        queueMicrotask(() => setVisible(true));
      });
    } else if (mounted) {
      queueMicrotask(() => setVisible(false));
      const t = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // ESC to close
  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 safe-x safe-top safe-bottom"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal panel */}
      <div
        className={`relative w-full ${SIZE_CLASSES[size]} card-base p-0 overflow-hidden transition-all duration-200 ease-out ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-[0.97]"
        }`}
        style={{ borderRadius: 20 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border-subtle">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center flex-shrink-0 text-accent">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 id="modal-title" className="text-base font-bold text-text leading-tight">
                {title}
              </h2>
              {description && (
                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {showClose && (
            <button
              onClick={onClose}
              className="touch-target text-muted hover:text-text transition-colors cursor-pointer flex-shrink-0 -mt-1 -mr-1"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Footer (sticky) */}
        {footer && (
          <div className="px-5 py-4 border-t border-border-subtle bg-card/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
